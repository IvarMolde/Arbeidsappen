import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateHtml } from '@/lib/utils/htmlExport'
import type { GeneratedContent, DesignProfile } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, design } = await req.json() as {
    content: GeneratedContent
    design: DesignProfile
  }

  if (!content || !design) {
    return NextResponse.json({ error: 'content and design required' }, { status: 400 })
  }

  try {
    const html = generateHtml(content, design)
    const buffer = Buffer.from(html, 'utf-8')

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="norskopplaering_${content.level}.html"`,
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'HTML generation failed: ' + msg }, { status: 500 })
  }
}
