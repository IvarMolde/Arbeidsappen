import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'
import type { CefrLevel, GeneratedContent, Company } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

let cefrReference: string | null = null

function getCefrReference(): string {
  if (!cefrReference) {
    try {
      const filePath = path.join(process.cwd(), 'lib/gemini/cefr_reference.md')
      cefrReference = fs.readFileSync(filePath, 'utf-8')
    } catch {
      cefrReference = 'CEFR reference not available'
    }
  }
  return cefrReference
}

export function getGeminiModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-latest',
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
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

function buildSystemPrompt(level: CefrLevel): string {
  const cefr = getCefrReference()
  return `Du er en ekspert på norskopplæring for voksne arbeidstakere med innvandrerbakgrunn.
Du lager pedagogisk presist tilpasset materiell basert på Det felles europeiske rammeverket for språk (CEFR).

CEFR-REFERANSE:
${cefr}

VIKTIGE REGLER:
1. Tilpass ALT innhold NØYAKTIG til nivå ${level} jfr. CEFR-beskrivelsene ovenfor
2. Bruk bedriftens fagspråk og terminologi, men tilpass til riktig norsknivå
3. Alle tekster og oppgaver skal være relevante for den konkrete arbeidsplassen
4. Ordlister skal inneholde oversettelse til deltakers morsmål
5. Mellom hver fagtekst lages 5 oppgaver med underpunkter a–e
6. Svar KUN med gyldig JSON. Start direkte med { – ingen annen tekst`
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
  const termsText = keyTerms.length > 0 ? keyTerms.slice(0, 30).join(', ') : ''
  const docsText = extractedTexts.length > 0
    ? extractedTexts.map((t, i) => `--- Dokument ${i + 1} ---\n${t.slice(0, 2000)}`).join('\n\n')
    : ''

  const prompt = `${buildSystemPrompt(level)}

BEDRIFTSINFORMASJON:
- Bedrift: ${company.name}
- Bransje: ${company.industry || 'ikke oppgitt'}
- Beskrivelse: ${company.description || 'ikke oppgitt'}
- Fagtermer: ${termsText}
- Fokustemaer: ${topicsText}
- Deltakers morsmål for ordlister: ${motherTongue}

${docsText ? `BEDRIFTSDOKUMENTER:\n${docsText}` : ''}

Returner KUN dette JSON-objektet:

{
  "fagTekster": [
    {
      "title": "Tittel",
      "content": "Fagtekst på ${level}-nivå tilpasset CEFR. Bruk bedriftens kontekst.",
      "vocabulary": [
        { "norwegian": "ord", "translation": "oversettelse til ${motherTongue}", "explanation": "forklaring" }
      ]
    }
  ],
  "oppgaver": [
    [
      {
        "number": 1,
        "type": "leseforstaelse",
        "title": "Oppgave 1: Leseforståelse",
        "instruction": "Les teksten og svar.",
        "subTasks": [
          { "letter": "a", "question": "Spørsmål", "options": ["A", "B", "C"], "answer": "A" }
        ]
      }
    ]
  ],
  "wordList": [
    { "norwegian": "ord", "translation": "oversettelse til ${motherTongue}", "explanation": "forklaring" }
  ],
  "pptSlides": [
    { "title": "Slide", "content": ["punkt 1", "punkt 2"], "type": "title", "notes": "Talenotat" }
  ]
}

KRAV:
- 3–5 fagtekster tilpasset nivå ${level}
- 5 oppgaver per fagtekst med 5 deloppgaver a–e
- Varier oppgavetypene: leseforstaelse, fyll_inn_blank, sorter_ord, riktig_pastand, setningsstruktur, multiple_choice, sant_usant, match_ord
- fyll_inn_blank: spørsmål inneholder ___ der svaret mangler
- sorter_ord: spørsmål er ordene i feil rekkefølge, answer er korrekt setning
- sant_usant: options=["Sant","Usant"], answer="Sant" eller "Usant"
- 15–25 ord i wordList oversatt til ${motherTongue}
- 8–12 pptSlides`

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
