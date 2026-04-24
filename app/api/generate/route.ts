import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateContent } from '@/lib/gemini/client'
import type { CefrLevel, DesignProfile } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { companyId, level, motherTongue, topics, documentIds, requestId } = body

  if (!companyId || !level || !motherTongue) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .eq('user_id', user.id)
    .single()

  if (companyError || !company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  if (requestId) {
    await supabase
      .from('generation_requests')
      .update({ status: 'processing' })
      .eq('id', requestId)
  }

  let extractedTexts: string[] = []
  if (documentIds && documentIds.length > 0) {
    const { data: docs } = await supabase
      .from('company_documents')
      .select('extracted_text, document_type')
      .in('id', documentIds)
      .neq('document_type', 'design')

    if (docs) {
      extractedTexts = docs
        .filter((d) => d.extracted_text)
        .map((d) => d.extracted_text!)
    }
  }

  try {
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

    if (requestId) {
      await supabase
        .from('generation_requests')
        .update({ status: 'completed' })
        .eq('id', requestId)
    }

    // Return content and design – no files generated yet
    // Files are generated on-demand when user clicks download buttons
    return NextResponse.json({
      success: true,
      content: generated,
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
