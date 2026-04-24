import { GoogleGenerativeAI } from '@google/generative-ai'
import type { CefrLevel, GeneratedContent, Company } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Kortfattet CEFR-referanse (ikke full fil, for å spare tokens)
const CEFR_SUMMARY: Record<CefrLevel, string> = {
  A1: 'A1 (Gjennombrudd): Svært korte tekster (30-80 ord), 5-8 ord per setning. Enkle hverdagsord. Oppgavetyper: matching, ja/nei, fyll inn med ordbank, sorter ord.',
  A2: 'A2 (Underveis): Korte tekster (80-150 ord), 8-12 ord per setning. Hverdags- og arbeidslivsvokabular. Oppgavetyper: multiple choice, sant/usant, fyll inn blank med ordbank, enkle setningsoppgaver.',
  B1: 'B1 (Terskel): Tekster 150-300 ord, 10-20 ord per setning. Fagvokabular med omskrivinger. Oppgavetyper: åpne spørsmål, fyll inn uten ordbank, omformuler setninger, finn riktig påstand.',
}

export function getGeminiModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 16000,
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
  const cleaned = raw
    .replace(/^```json\s*/m, '')
    .replace(/^```\s*/m, '')
    .replace(/```\s*$/m, '')
    .trim()
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
  const termsText = keyTerms.length > 0 ? keyTerms.slice(0, 20).join(', ') : ''
  const docsText = extractedTexts.length > 0
    ? extractedTexts.map((t, i) => `--- Dokument ${i + 1} ---\n${t.slice(0, 1500)}`).join('\n\n')
    : ''

  const cefrInfo = CEFR_SUMMARY[level]

  const prompt = `Du er ekspert på norskopplæring for voksne arbeidstakere (CEFR-nivå ${level}).

NIVÅ ${level}: ${cefrInfo}

BEDRIFT: ${company.name} | Bransje: ${company.industry || 'ikke oppgitt'}
Beskrivelse: ${company.description || 'ikke oppgitt'}
Fagtermer: ${termsText}
Fokustemaer: ${topicsText}
Morsmål for ordlister: ${motherTongue}
${docsText ? `\nDOKUMENTER:\n${docsText}` : ''}

Lag et komplett norskopplæringsopplegg. Returner KUN gyldig JSON:

{
  "fagTekster": [
    {
      "title": "Tittel på fagtekst",
      "content": "Fagtekst tilpasset nivå ${level} og bedriftens kontekst",
      "vocabulary": [
        { "norwegian": "ord", "translation": "oversettelse til ${motherTongue}", "explanation": "kort forklaring" }
      ]
    }
  ],
  "oppgaver": [
    [
      {
        "number": 1,
        "type": "leseforstaelse",
        "title": "Oppgave 1: Leseforståelse",
        "instruction": "Les teksten og svar på spørsmålene.",
        "subTasks": [
          { "letter": "a", "question": "Spørsmål", "options": ["Alternativ A", "Alternativ B", "Alternativ C"], "answer": "Alternativ A" }
        ]
      }
    ]
  ],
  "wordList": [
    { "norwegian": "ord", "translation": "oversettelse til ${motherTongue}", "explanation": "forklaring" }
  ],
  "pptSlides": [
    { "title": "Tittel", "content": ["punkt 1", "punkt 2"], "type": "title", "notes": "Talenotat" }
  ]
}

KRAV:
- Lag 3 fagtekster (ikke 5, for å holde JSON kompakt)
- 5 oppgaver per fagtekst (oppgaver[0] = fagTekster[0] osv.)
- Hver oppgave: 5 deloppgaver a-e
- Oppgavetyper: leseforstaelse, fyll_inn_blank (med ___ i spørsmål), sorter_ord, sant_usant (options=["Sant","Usant"]), multiple_choice
- 15 ord i wordList oversatt til ${motherTongue}
- 8 pptSlides
- Alle strenger må ha escaped anførselstegn der det trengs`

  const model = getGeminiModel()
  const parsed = await withRetry(
    async () => {
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      return parseGeminiJson(text)
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
