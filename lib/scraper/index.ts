import * as cheerio from 'cheerio'
import type { ScrapedDesign } from '@/types'

export async function scrapeCompanyWebsite(url: string): Promise<ScrapedDesign> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ArbeidsnorskBot/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract colors from CSS/style attributes
    const colors = extractColors($, html)

    // Extract logo
    const logoUrl = extractLogo($, url)

    // Extract title and description
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text().trim() ||
      ''

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      ''

    // Extract key terms from visible text
    const keyTerms = extractKeyTerms($)

    return {
      colors: colors.slice(0, 5),
      logoUrl,
      title,
      description,
      keyTerms: keyTerms.slice(0, 40),
    }
  } catch (error) {
    console.error('Scrape error:', error)
    return {
      colors: [],
      keyTerms: [],
    }
  }
}

function extractColors($: ReturnType<typeof cheerio.load>, html: string): string[] {
  const colorSet = new Set<string>()

  // From inline styles
  $('[style]').each((_, el) => {
    const style = $(el).attr('style') || ''
    const matches = style.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)/g)
    if (matches) matches.forEach((c) => colorSet.add(c))
  })

  // From <style> tags
  const styleContent = $('style').text()
  const cssColors = styleContent.match(/#[0-9a-fA-F]{6}/g)
  if (cssColors) cssColors.forEach((c) => colorSet.add(c.toLowerCase()))

  // From embedded CSS in HTML
  const inlineColors = html.match(/color:\s*(#[0-9a-fA-F]{3,6})/g)
  if (inlineColors) {
    inlineColors.forEach((m) => {
      const hex = m.match(/#[0-9a-fA-F]{3,6}/)?.[0]
      if (hex) colorSet.add(hex.toLowerCase())
    })
  }

  // Filter out very light/dark and return
  return Array.from(colorSet)
    .filter((c) => {
      if (!c.startsWith('#')) return true
      const hex = c.replace('#', '')
      if (hex.length !== 6) return true
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      return brightness > 30 && brightness < 220
    })
    .slice(0, 5)
}

function extractLogo(
  $: ReturnType<typeof cheerio.load>,
  baseUrl: string
): string | undefined {
  // Try og:image first
  const ogImage = $('meta[property="og:image"]').attr('content')
  if (ogImage) return resolveUrl(ogImage, baseUrl)

  // Try common logo selectors
  const selectors = [
    'img[class*="logo"]',
    'img[alt*="logo" i]',
    'img[src*="logo" i]',
    'header img',
    'nav img',
    '.logo img',
    '#logo img',
  ]

  for (const sel of selectors) {
    const src = $(sel).first().attr('src')
    if (src) return resolveUrl(src, baseUrl)
  }

  return undefined
}

function extractKeyTerms($: ReturnType<typeof cheerio.load>): string[] {
  const stopWords = new Set([
    'og', 'i', 'er', 'for', 'til', 'av', 'på', 'de', 'det', 'en', 'et',
    'vi', 'som', 'med', 'om', 'har', 'ikke', 'kan', 'vil', 'men', 'fra',
    'at', 'den', 'du', 'seg', 'sin', 'bli', 'var', 'her', 'da', 'når',
    'the', 'and', 'or', 'of', 'to', 'in', 'is', 'it', 'that', 'for',
  ])

  const text = $('h1, h2, h3, p, li, td').text()
  const words = text
    .toLowerCase()
    .replace(/[^a-zæøåÆØÅ\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))

  const freq: Record<string, number> = {}
  words.forEach((w) => {
    freq[w] = (freq[w] || 0) + 1
  })

  return Object.entries(freq)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
}

function resolveUrl(src: string, base: string): string {
  if (src.startsWith('http')) return src
  try {
    return new URL(src, base).href
  } catch {
    return src
  }
}
