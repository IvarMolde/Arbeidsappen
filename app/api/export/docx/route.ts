import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDocx } from '@/lib/utils/docxExport'
import type { GeneratedContent, DesignProfile } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, design, requestId } = await req.json() as {
    content: GeneratedContent
    design: DesignProfile
    requestId?: string
  }

  if (!content || !design) {
    return NextResponse.json({ error: 'content and design required' }, { status: 400 })
  }

  try {
    const buffer = await generateDocx(content, design)

    // Upload to Supabase Storage
    const fileName = `${user.id}/${content.company.id}/arbeidsark_${content.level}_${Date.now()}.docx`
    const { error: uploadError } = await supabase.storage
      .from('generated-outputs')
      .upload(fileName, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true,
      })

    let docxUrl: string | undefined
    if (!uploadError) {
      const { data } = await supabase.storage
        .from('generated-outputs')
        .createSignedUrl(fileName, 86400 * 7)
      docxUrl = data?.signedUrl
    }

    // Update request record
    if (requestId) {
      await supabase
        .from('generation_requests')
        .update({ output_docx_url: docxUrl })
        .eq('id', requestId)
    }

    // Return as downloadable file
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="arbeidsark_${content.level}.docx"`,
        'X-File-Url': docxUrl || '',
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('DOCX generation error:', error)
    return NextResponse.json({ error: 'DOCX generation failed: ' + msg }, { status: 500 })
  }
}
