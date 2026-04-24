export type CefrLevel = 'A1' | 'A2' | 'B1'

export type OutputFormat = 'docx' | 'pptx' | 'html'

export interface Company {
  id: string
  name: string
  website_url?: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  accent_color?: string
  font_family?: string
  industry?: string
  description?: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface CompanyDocument {
  id: string
  company_id: string
  file_name: string
  file_url: string
  file_type: string
  document_type: 'instruction' | 'manual' | 'hms' | 'other' | 'design'
  extracted_text?: string
  created_at: string
}

export interface GenerationRequest {
  id: string
  company_id: string
  cefr_level: CefrLevel
  mother_tongue: string
  topics: string[]
  document_ids: string[]
  status: 'pending' | 'processing' | 'completed' | 'error'
  output_docx_url?: string
  output_pptx_url?: string
  output_html_url?: string
  created_at: string
  updated_at: string
}

export interface FagTekst {
  title: string
  content: string
  vocabulary: VocabularyItem[]
}

export interface VocabularyItem {
  norwegian: string
  translation: string
  explanation: string
}

export interface Oppgave {
  number: number
  type: OppgaveType
  title: string
  instruction: string
  subTasks: SubTask[]
}

export type OppgaveType =
  | 'leseforstaelse'
  | 'fyll_inn_blank'
  | 'sorter_ord'
  | 'riktig_pastand'
  | 'setningsstruktur'
  | 'multiple_choice'
  | 'sant_usant'
  | 'match_ord'

export interface SubTask {
  letter: string
  question: string
  options?: string[]
  answer: string
  hint?: string
}

export interface GeneratedContent {
  company: Company
  level: CefrLevel
  motherTongue: string
  fagTekster: FagTekst[]
  oppgaver: Oppgave[][]
  wordList: VocabularyItem[]
  pptSlides: PptSlide[]
}

export interface PptSlide {
  title: string
  content: string[]
  type: 'title' | 'vocabulary' | 'text' | 'task' | 'discussion'
  notes?: string
}

export interface DesignProfile {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  logoUrl?: string
  companyName: string
}

export interface ScrapedDesign {
  colors: string[]
  logoUrl?: string
  title?: string
  description?: string
  keyTerms: string[]
}
