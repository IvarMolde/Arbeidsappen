import { GoogleGenerativeAI } from '@google/generative-ai'
import type { CefrLevel, GeneratedContent, Company } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const CEFR_SUMMARY: Record<CefrLevel, string> = {
  A1: 'A1: Svært korte tekster (30-80 ord), enkle ord, korte setninger.',
  A2: 'A2: Korte tekster (80-150 ord), hverdagsvokabular, enkle arbeidsoppgaver.',
  B1: 'B1: Tekster 150-250 ord, fagvokabular, selvstendig kommunikasjon.',
}

export function getGeminiModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  })
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3, label = 'Gemini'): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const isLast = attempt === maxAttempts
      const msg = error instanceof Error ? error.message : String(error)
      const isRetryable = msg.includes('503') || msg.includes('429') || msg.includes('UNAVAILABLE') || msg.includes('timeout') || msg.includes('overloaded')
      console.warn(`[${label}] Attempt ${attempt}/${maxAttempts} failed: ${msg}`)
      if (isLast || !isRetryable) throw error
      const delay = Math.min(1000 * 2 ** (attempt - 1), 8000)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw new Error(`${label} failed after ${maxAttempts} attempts`)
}

function parseGeminiJson(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found in Gemini response')
  return JSON.parse(cleaned.slice(start, end + 1))
}

export async function generateContent(params: {
  company: Company
  level: CefrLevel
  motherTongue: string
  topics: string[]
  extractedTexts: string[]
  keyTerms: string[]
}): Promise<GeneratedContent> {
  const { company, level, motherTongue, topics, extractedTexts, keyTerms } = params
  const topicsText = topics.length > 0 ? topics.join(', ') : 'generelle arbeidsoppgaver'
  const termsText = keyTerms.length > 0 ? keyTerms.slice(0, 15).join(', ') : ''
  const docsText = extractedTexts.length > 0
    ? extractedTexts[0].slice(0, 800)
    : ''

  const prompt = `Du er ekspert på norskopplæring (CEFR ${level}). ${CEFR_SUMMARY[level]}

Bedrift: ${company.name} | ${company.industry || ''} | ${company.description?.slice(0, 200) || ''}
Fagtermer: ${termsText}
Tema: ${topicsText}
Morsmål: ${motherTongue}
${docsText ? `Dokument: ${docsText}` : ''}

Lag norskopplæringsmateriell. Svar KUN med JSON:

{
  "fagTekster": [
    {
      "title": "string",
      "content": "string",
      "vocabulary": [{"norwegian":"string","translation":"string","explanation":"string"}]
    }
  ],
  "oppgaver": [
    [
      {
        "number": 1,
        "type": "leseforstaelse",
        "title": "string",
        "instruction": "string",
        "subTasks": [
          {"letter":"a","question":"string","options":["string","string","string"],"answer":"string"}
        ]
      }
    ]
  ],
  "wordList": [{"norwegian":"string","translation":"string","explanation":"string"}],
  "pptSlides": [{"title":"string","content":["string"],"type":"title","notes":"string"}]
}

VIKTIG - hold deg til disse grensene:
- Nøyaktig 2 fagtekster
- Nøyaktig 3 oppgaver per fagtekst, hver med 3 deloppgaver (a,b,c)
- Nøyaktig 10 ord i wordList
- Nøyaktig 5 pptSlides
- Tekster maks 150 ord
- Korte, konsise svar`

  const model = getGeminiModel()
  const parsed = await withRetry(
    async () => {
      const result = await model.generateContent(prompt)
      return parseGeminiJson(result.response.text())
    },
    3,
    `generateContent(${level})`
  )

  return {
    company,
    level,
    motherTongue,
    fagTekster: (parsed.fagTekster as GeneratedContent['fagTekster']) || [],
    oppgaver: (parsed.oppgaver as GeneratedContent['oppgaver']) || [],
    wordList: (parsed.wordList as GeneratedContent['wordList']) || [],
    pptSlides: (parsed.pptSlides as GeneratedContent['pptSlides']) || [],
  }
}
