import { NextRequest, NextResponse } from 'next/server'
import { scrapeCompanyWebsite } from '@/lib/scraper'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url, companyId } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  try {
    const scraped = await scrapeCompanyWebsite(url)

    // Update company with scraped data if companyId provided
    if (companyId && (scraped.colors.length > 0 || scraped.keyTerms.length > 0)) {
      const updates: Record<string, unknown> = {}
      if (scraped.colors[0]) updates.primary_color = scraped.colors[0]
      if (scraped.colors[1]) updates.secondary_color = scraped.colors[1]
      if (scraped.colors[2]) updates.accent_color = scraped.colors[2]
      if (scraped.logoUrl) updates.logo_url = scraped.logoUrl
      if (scraped.keyTerms.length > 0) updates.key_terms = scraped.keyTerms
      if (scraped.description) updates.description = scraped.description

      await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ success: true, data: scraped })
  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json({ error: 'Could not scrape website' }, { status: 500 })
  }
}
