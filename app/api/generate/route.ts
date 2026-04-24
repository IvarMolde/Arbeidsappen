import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateContent } from '@/lib/gemini/client'
import { generateHtml } from '@/lib/utils/htmlExport'
import type { CefrLevel, DesignProfile } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { companyId, level, motherTongue, topics, documentIds, requestId } = body

  // Validate
  if (!companyId || !level || !motherTongue) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Fetch company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .eq('user_id', user.id)
    .single()

  if (companyError || !company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  // Update request status
  if (requestId) {
    await supabase
      .from('generation_requests')
      .update({ status: 'processing' })
      .eq('id', requestId)
  }

  // Fetch document texts
  let extractedTexts: string[] = []
  if (documentIds && documentIds.length > 0) {
    const { data: docs } = await supabase
      .from('company_documents')
      .select('extracted_text, document_type')
      .in('id', documentIds)
      .neq('document_type', 'design') // Exclude design files

    if (docs) {
      extractedTexts = docs
        .filter((d) => d.extracted_text)
        .map((d) => d.extracted_text!)
    }
  }

  try {
    // Generate content with Gemini
    const generated = await generateContent({
      company,
      level: level as CefrLevel,
      motherTongue,
      topics: topics || [],
      extractedTexts,
      keyTerms: company.key_terms || [],
    })

    const design: DesignProfile = {
      primaryColor: company.primary_color || '#1a56db',
      secondaryColor: company.secondary_color || '#e1effe',
      accentColor: company.accent_color || '#f59e0b',
      fontFamily: company.font_family || 'Inter',
      logoUrl: company.logo_url,
      companyName: company.name,
    }

    // Generate HTML
    const htmlContent = generateHtml(generated, design)

    // Store HTML file in Supabase storage
    const htmlFileName = `${user.id}/${companyId}/output_${Date.now()}.html`
    const { error: uploadError } = await supabase.storage
      .from('generated-outputs')
      .upload(htmlFileName, htmlContent, {
        contentType: 'text/html; charset=utf-8',
        upsert: true,
      })

    let htmlUrl: string | undefined
    if (!uploadError) {
      const { data: urlData } = await supabase.storage
        .from('generated-outputs')
        .createSignedUrl(htmlFileName, 86400 * 7) // 7 days
      htmlUrl = urlData?.signedUrl
    }

    // Update request as completed
    if (requestId) {
      await supabase
        .from('generation_requests')
        .update({
          status: 'completed',
          output_html_url: htmlUrl,
        })
        .eq('id', requestId)
    }

    return NextResponse.json({
      success: true,
      content: generated,
      htmlUrl,
      design,
    })
  } catch (error) {
    console.error('Generation error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'

    if (requestId) {
      await supabase
        .from('generation_requests')
        .update({ status: 'error', error_message: msg })
        .eq('id', requestId)
    }

    return NextResponse.json({ error: 'Generation failed: ' + msg }, { status: 500 })
  }
}
