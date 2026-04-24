'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Company, CompanyDocument, CefrLevel, GeneratedContent, DesignProfile } from '@/types'
import ContentPreview from '@/components/generation/ContentPreview'

function GeneratePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyId = searchParams.get('company')
  const supabase = createClient()

  const [company, setCompany] = useState<Company | null>(null)
  const [documents, setDocuments] = useState<CompanyDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [exportingDocx, setExportingDocx] = useState(false)
  const [exportingPptx, setExportingPptx] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ htmlUrl?: string } | null>(null)
  const [generatedData, setGeneratedData] = useState<{ content: GeneratedContent; design: DesignProfile; requestId?: string } | null>(null)

  const [level, setLevel] = useState<CefrLevel>('A2')
  const [motherTongue, setMotherTongue] = useState('')
  const [topics, setTopics] = useState('')
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [docType, setDocType] = useState('instruction')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      if (!companyId) { router.push('/dashboard'); return }
      const { data: co } = await supabase.from('companies').select('*').eq('id', companyId).eq('user_id', user.id).single()
      if (!co) { router.push('/dashboard'); return }
      setCompany(co)
      const { data: docs } = await supabase.from('company_documents').select('*').eq('company_id', companyId).order('created_at', { ascending: false })
      setDocuments(docs || [])
      setLoading(false)
    }
    load()
  }, [companyId])

  async function handleUploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !companyId) return
    setUploadingDoc(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('companyId', companyId)
    formData.append('documentType', docType)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.document) {
      setDocuments(prev => [data.document, ...prev])
    } else {
      setError(data.error || 'Opplasting feilet')
    }
    setUploadingDoc(false)
    e.target.value = ''
  }

  async function handleGenerate() {
    if (!motherTongue.trim()) { setError('Morsmål er påkrevd'); return }
    setGenerating(true)
    setError('')
    setSuccess(null)
    setGeneratedData(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: reqRecord } = await supabase.from('generation_requests').insert({
      company_id: companyId,
      user_id: user.id,
      cefr_level: level,
      mother_tongue: motherTongue,
      topics: topics.split(',').map(t => t.trim()).filter(Boolean),
      document_ids: selectedDocs,
    }).select().single()

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        level,
        motherTongue,
        topics: topics.split(',').map(t => t.trim()).filter(Boolean),
        documentIds: selectedDocs,
        requestId: reqRecord?.id,
      }),
    })

    const data = await res.json()
    setGenerating(false)

    if (data.success) {
      setSuccess({ htmlUrl: data.htmlUrl })
      setGeneratedData({ content: data.content, design: data.design, requestId: reqRecord?.id })
    } else {
      setError(data.error || 'Generering feilet')
    }
  }

  async function handleExportDocx() {
    if (!generatedData) return
    setExportingDocx(true)
    setError('')
    try {
      const res = await fetch('/api/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: generatedData.content, design: generatedData.design, requestId: generatedData.requestId }),
      })
      if (!res.ok) throw new Error('DOCX-generering feilet')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `arbeidsark_${level}_${company?.name || 'bedrift'}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('Kunne ikke laste ned Word-fil')
    }
    setExportingDocx(false)
  }

  async function handleExportPptx() {
    if (!generatedData) return
    setExportingPptx(true)
    setError('')
    try {
      const res = await fetch('/api/export/pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: generatedData.content, design: generatedData.design, requestId: generatedData.requestId }),
      })
      if (!res.ok) throw new Error('PPTX-generering feilet')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `presentasjon_${level}_${company?.name || 'bedrift'}.pptx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError('Kunne ikke laste ned PowerPoint-fil')
    }
    setExportingPptx(false)
  }

  const levelDescriptions: Record<CefrLevel, string> = {
    A1: 'Gjennombrudd – svært enkelt, korte fraser og ord',
    A2: 'Underveis – hverdagsspråk, enkle arbeidsoppgaver',
    B1: 'Terskel – selvstendig kommunikasjon på jobben',
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.7rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit', background: 'white' }
  const labelStyle: React.CSSProperties = { display: 'block', fontWeight: '600', fontSize: '0.88rem', marginBottom: '0.4rem', color: '#374151' }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#1a56db', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}></div>
        <p style={{ color: '#64748b' }}>Laster...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <nav style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 2rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#0f172a' }}>
          <span style={{ fontSize: '1.4rem' }}>🇳🇴</span>
          <span style={{ fontWeight: '800' }}>Arbeidsnorsk</span>
        </Link>
        <Link href="/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>← Dashboard</Link>
      </nav>

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {company && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: company.primary_color || '#1a56db' }}></div>
            {company.logo_url
              ? <img src={company.logo_url} alt="logo" style={{ height: '48px', width: '48px', objectFit: 'contain', borderRadius: '8px' }} />
              : <div style={{ width: '48px', height: '48px', background: company.primary_color || '#1a56db', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '1.2rem' }}>{company.name.charAt(0)}</div>
            }
            <div>
              <h1 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>{company.name}</h1>
              <p style={{ color: '#64748b', fontSize: '0.88rem' }}>{company.industry || 'Generer norskopplæringsmateriell'}</p>
            </div>
          </div>
        )}

        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}

        {/* PREVIEW PANEL */}
        {success && generatedData && (
          <ContentPreview
            content={generatedData.content}
            design={generatedData.design}
            htmlUrl={success.htmlUrl}
            onExportDocx={handleExportDocx}
            onExportPptx={handleExportPptx}
            onReset={() => { setSuccess(null); setGeneratedData(null) }}
            exportingDocx={exportingDocx}
            exportingPptx={exportingPptx}
          />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* CEFR Level */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
              <h3 style={{ fontWeight: '800', marginBottom: '1rem', color: '#0f172a' }}>📊 CEFR-nivå</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(['A1', 'A2', 'B1'] as CefrLevel[]).map(l => (
                  <label key={l} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', border: `2px solid ${level === l ? '#1a56db' : '#e2e8f0'}`, borderRadius: '8px', cursor: 'pointer', background: level === l ? '#eff6ff' : 'white', transition: 'all 0.15s' }}>
                    <input type="radio" value={l} checked={level === l} onChange={() => setLevel(l)} style={{ marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: '700', color: level === l ? '#1a56db' : '#374151' }}>{l}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>{levelDescriptions[l]}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <h3 style={{ fontWeight: '800', color: '#0f172a' }}>⚙️ Innstillinger</h3>
              <div>
                <label style={labelStyle}>Deltakers morsmål *</label>
                <input style={inputStyle} value={motherTongue} onChange={e => setMotherTongue(e.target.value)} placeholder="f.eks. polsk, arabisk, tagalog, somali..." />
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.3rem' }}>Brukes til oversettelse av ordlister</p>
              </div>
              <div>
                <label style={labelStyle}>Fokustemaer (valgfritt)</label>
                <input style={inputStyle} value={topics} onChange={e => setTopics(e.target.value)} placeholder="HMS, arbeidsrutiner, sikkerhet..." />
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.3rem' }}>Kommaseparert. La stå tomt for automatisk valg.</p>
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Documents */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
              <h3 style={{ fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>📁 Bedriftsdokumenter</h3>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <select value={docType} onChange={e => setDocType(e.target.value)}
                  style={{ padding: '0.5rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', background: 'white', flex: 1 }}>
                  <option value="instruction">Arbeidsinstruks</option>
                  <option value="manual">Manual / Håndbok</option>
                  <option value="hms">HMS-dokument</option>
                  <option value="design">Designfil (kun profil)</option>
                  <option value="other">Annet</option>
                </select>
                <label style={{ background: uploadingDoc ? '#94a3b8' : '#f1f5f9', border: '1.5px dashed #cbd5e1', padding: '0.5rem 0.9rem', borderRadius: '8px', cursor: uploadingDoc ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.85rem', color: '#374151', whiteSpace: 'nowrap' }}>
                  {uploadingDoc ? '⏳ Laster...' : '📎 Last opp'}
                  <input type="file" onChange={handleUploadDocument} disabled={uploadingDoc} accept=".pdf,.docx,.txt" style={{ display: 'none' }} />
                </label>
              </div>

              {documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.88rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                  Ingen dokumenter ennå.<br />Last opp arbeidsinstrukser, manualer eller HMS-dokumenter.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '280px', overflowY: 'auto' }}>
                  {documents.map(doc => {
                    const isSelected = selectedDocs.includes(doc.id)
                    const isDesign = doc.document_type === 'design'
                    return (
                      <label key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${isSelected ? '#1a56db' : '#e2e8f0'}`, background: isSelected ? '#eff6ff' : 'white', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <input type="checkbox" checked={isSelected && !isDesign} disabled={isDesign}
                          onChange={e => {
                            if (e.target.checked) setSelectedDocs(p => [...p, doc.id])
                            else setSelectedDocs(p => p.filter(id => id !== doc.id))
                          }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {isDesign ? '🎨 Kun design' : '📝 Innhold'} · {doc.file_type.toUpperCase()}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Generate button */}
            <button onClick={handleGenerate} disabled={generating || !motherTongue.trim()}
              style={{ background: generating ? '#94a3b8' : 'linear-gradient(135deg, #1a56db, #2563eb)', color: 'white', border: 'none', padding: '1.1rem', borderRadius: '12px', fontWeight: '800', fontSize: '1.05rem', cursor: generating ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: generating ? 'none' : '0 4px 16px rgba(26,86,219,0.35)' }}>
              {generating ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <span style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }}></span>
                  Gemini AI genererer...
                </span>
              ) : '✨ Generer norskopplæringsmateriell'}
            </button>

            {/* Info */}
            <div style={{ background: '#f8faff', border: '1px solid #dbeafe', borderRadius: '10px', padding: '1rem', fontSize: '0.83rem', color: '#374151' }}>
              <div style={{ fontWeight: '700', marginBottom: '0.5rem', color: '#1e40af' }}>📦 Tre formater genereres:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div>🌐 <strong>HTML</strong> – interaktiv, responsiv, for digital bruk</div>
                <div>📄 <strong>Word</strong> – utskriftsvennlig arbeidsark med fasit</div>
                <div>📊 <strong>PowerPoint</strong> – for leder og ansatt sammen</div>
              </div>
              <div style={{ marginTop: '0.6rem', color: '#64748b', borderTop: '1px solid #dbeafe', paddingTop: '0.6rem' }}>
                3–5 fagtekster · 5 oppgaver per tekst · ordliste til {motherTongue || 'morsmål'}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @media (max-width: 640px) { .gen-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

export default function GeneratePage() {
  return (
    <Suspense>
      <GeneratePageInner />
    </Suspense>
  )
}
