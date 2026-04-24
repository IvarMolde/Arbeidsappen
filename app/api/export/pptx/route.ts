import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePptx } from '@/lib/utils/pptxExport'
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
    const buffer = await generatePptx(content, design)

    // Upload to Supabase Storage
    const fileName = `${user.id}/${content.company.id}/presentasjon_${content.level}_${Date.now()}.pptx`
    const { error: uploadError } = await supabase.storage
      .from('generated-outputs')
      .upload(fileName, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        upsert: true,
      })

    let pptxUrl: string | undefined
    if (!uploadError) {
      const { data } = await supabase.storage
        .from('generated-outputs')
        .createSignedUrl(fileName, 86400 * 7)
      pptxUrl = data?.signedUrl
    }

    // Update request record
    if (requestId) {
      await supabase
        .from('generation_requests')
        .update({ output_pptx_url: pptxUrl })
        .eq('id', requestId)
    }

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="presentasjon_${content.level}.pptx"`,
        'X-File-Url': pptxUrl || '',
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('PPTX generation error:', error)
    return NextResponse.json({ error: 'PPTX generation failed: ' + msg }, { status: 500 })
  }
}
