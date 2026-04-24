'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SetupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [industry, setIndustry] = useState('')
  const [description, setDescription] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#1a56db')
  const [secondaryColor, setSecondaryColor] = useState('#e1effe')
  const [accentColor, setAccentColor] = useState('#f59e0b')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [scrapedTerms, setScrapedTerms] = useState<string[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)

  async function handleScrape() {
    if (!websiteUrl) return
    setScraping(true)
    setError('')
    try {
      // Create company first if not exists
      let cId = companyId
      if (!cId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/auth/login'); return }
        const { data: company, error: ce } = await supabase
          .from('companies')
          .insert({ name: name || 'Ny bedrift', website_url: websiteUrl, user_id: user.id })
          .select()
          .single()
        if (ce) throw new Error(ce.message)
        cId = company.id
        setCompanyId(cId)
      }

      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl, companyId: cId }),
      })
      const data = await res.json()
      if (data.data) {
        if (data.data.colors[0]) setPrimaryColor(data.data.colors[0])
        if (data.data.colors[1]) setSecondaryColor(data.data.colors[1])
        if (data.data.colors[2]) setAccentColor(data.data.colors[2])
        if (data.data.logoUrl) setLogoUrl(data.data.logoUrl)
        if (data.data.keyTerms) setScrapedTerms(data.data.keyTerms.slice(0, 20))
        if (data.data.description && !description) setDescription(data.data.description)
      }
    } catch (e) {
      setError('Kunne ikke hente designprofil fra nettsiden. Fyll inn manuelt.')
    }
    setScraping(false)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const url = URL.createObjectURL(file)
    setLogoUrl(url)
  }

  async function handleSave() {
    if (!name) { setError('Bedriftsnavn er påkrevd'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    let finalLogoUrl = logoUrl

    // Upload logo if file selected
    if (logoFile && companyId) {
      const ext = logoFile.name.split('.').pop()
      const path = `${user.id}/${companyId}/logo.${ext}`
      const bytes = await logoFile.arrayBuffer()
      const { error: uploadError } = await supabase.storage.from('company-logos').upload(path, bytes, { contentType: logoFile.type, upsert: true })
      if (!uploadError) {
        const { data } = supabase.storage.from('company-logos').getPublicUrl(path)
        finalLogoUrl = data.publicUrl
      }
    }

    const companyData = {
      name,
      website_url: websiteUrl,
      industry,
      description,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_color: accentColor,
      logo_url: finalLogoUrl,
      key_terms: scrapedTerms,
      user_id: user.id,
    }

    if (companyId) {
      const { error } = await supabase.from('companies').update(companyData).eq('id', companyId)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { data, error } = await supabase.from('companies').insert(companyData).select().single()
      if (error) { setError(error.message); setLoading(false); return }
      setCompanyId(data.id)
    }

    router.push('/dashboard')
  }

  const inputStyle = { width: '100%', padding: '0.7rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }
  const labelStyle = { display: 'block', fontWeight: '600', fontSize: '0.88rem', marginBottom: '0.4rem', color: '#374151' }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 2rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#0f172a' }}>
          <span style={{ fontSize: '1.4rem' }}>🇳🇴</span>
          <span style={{ fontWeight: '800' }}>Arbeidsnorsk</span>
        </Link>
        <Link href="/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>← Tilbake</Link>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.7rem', fontWeight: '900', color: '#0f172a', marginBottom: '0.5rem' }}>Ny bedriftsprofil</h1>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>Fyll inn informasjon om bedriften. Vi bruker dette til å tilpasse norskopplæringsmateriell.</p>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {['Grunninfo', 'Designprofil', 'Dokumenter'].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', padding: '0.5rem', borderRadius: '8px', background: step === i + 1 ? '#1a56db' : step > i + 1 ? '#dcfce7' : '#f1f5f9', color: step === i + 1 ? 'white' : step > i + 1 ? '#16a34a' : '#94a3b8', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
              onClick={() => setStep(i + 1)}>
              {step > i + 1 ? '✓ ' : `${i + 1}. `}{s}
            </div>
          ))}
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}

        {/* STEP 1: Grunninfo */}
        {step === 1 && (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Bedriftsnavn *</label>
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="f.eks. Molde Renholdservice AS" />
            </div>
            <div>
              <label style={labelStyle}>Bransje</label>
              <select style={{ ...inputStyle, background: 'white' }} value={industry} onChange={e => setIndustry(e.target.value)}>
                <option value="">Velg bransje</option>
                {['Renhold', 'Helse og omsorg', 'Barnehage/skole', 'Transport og logistikk', 'Bygg og anlegg', 'Industri og produksjon', 'Handel og butikk', 'Hotell og restaurant', 'Landbruk', 'Annet'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Nettside (URL)</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input style={{ ...inputStyle, flex: 1 }} value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://www.dinbedrift.no" type="url" />
                <button onClick={handleScrape} disabled={scraping || !websiteUrl}
                  style={{ background: scraping ? '#94a3b8' : '#1a56db', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '8px', cursor: scraping ? 'not-allowed' : 'pointer', fontWeight: '700', whiteSpace: 'nowrap', fontSize: '0.88rem' }}>
                  {scraping ? 'Henter...' : '🔍 Hent profil'}
                </button>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.4rem' }}>Trykk "Hent profil" for å automatisk hente logo, farger og fagtermer</p>
            </div>
            <div>
              <label style={labelStyle}>Kort beskrivelse av bedriften</label>
              <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Hva gjør bedriften? Hvilke tjenester tilbyr dere?" />
            </div>
            <button onClick={() => setStep(2)} style={{ background: '#1a56db', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem' }}>
              Neste: Designprofil →
            </button>
          </div>
        )}

        {/* STEP 2: Design */}
        {step === 2 && (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#f8faff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '1rem', fontSize: '0.88rem', color: '#1e40af' }}>
              💡 Designprofilen brukes til å gi Word-, PowerPoint- og HTML-filer bedriftens utseende.
            </div>

            {/* Logo */}
            <div>
              <label style={labelStyle}>Logo</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {logoUrl && <img src={logoUrl} alt="logo" style={{ height: '60px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0.5rem' }} />}
                <div>
                  <input type="file" id="logo-upload" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                  <label htmlFor="logo-upload" style={{ background: '#f1f5f9', border: '1.5px dashed #cbd5e1', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem', color: '#374151' }}>
                    📎 Last opp logo
                  </label>
                  {logoUrl && !logoFile && <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.3rem' }}>Hentet fra nettside</p>}
                </div>
              </div>
            </div>

            {/* Colors */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {[
                { label: 'Primærfarge', value: primaryColor, set: setPrimaryColor },
                { label: 'Sekundærfarge', value: secondaryColor, set: setSecondaryColor },
                { label: 'Aksentfarge', value: accentColor, set: setAccentColor },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <label style={labelStyle}>{label}</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="color" value={value} onChange={e => set(e.target.value)} style={{ width: '44px', height: '44px', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '2px', cursor: 'pointer' }} />
                    <input type="text" value={value} onChange={e => set(e.target.value)} style={{ ...inputStyle, flex: 1, fontSize: '0.82rem' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ background: primaryColor, color: 'white', padding: '0.75rem 1rem', fontWeight: '700', fontSize: '0.9rem' }}>
                {logoUrl && <img src={logoUrl} alt="" style={{ height: '24px', marginRight: '0.5rem', verticalAlign: 'middle' }} />}
                {name || 'Bedriftsnavn'} – Forhåndsvisning
              </div>
              <div style={{ background: secondaryColor, padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#374151' }}>
                Eksempeltekst i sekundærfarge · <span style={{ color: accentColor, fontWeight: '700' }}>Aksentfarge</span>
              </div>
            </div>

            {/* Scraped terms */}
            {scrapedTerms.length > 0 && (
              <div>
                <label style={labelStyle}>Fagtermer funnet på nettside ({scrapedTerms.length})</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {scrapedTerms.map(t => (
                    <span key={t} style={{ background: secondaryColor, color: primaryColor, padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.82rem', fontWeight: '600' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, background: '#f1f5f9', color: '#374151', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>← Tilbake</button>
              <button onClick={() => setStep(3)} style={{ flex: 2, background: '#1a56db', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}>Neste: Dokumenter →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Documents & Save */}
        {step === 3 && (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#f8faff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '1rem', fontSize: '0.88rem', color: '#1e40af' }}>
              💡 Dokumenter lastes opp etter at bedriftsprofilen er lagret. Gå til "Generer materiell" for å laste opp dokumenter og starte generering.
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ fontWeight: '700', marginBottom: '0.5rem', color: '#15803d' }}>📋 Oppsummering</div>
              <div style={{ fontSize: '0.9rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div>🏢 <strong>Bedrift:</strong> {name}</div>
                {industry && <div>🔧 <strong>Bransje:</strong> {industry}</div>}
                {websiteUrl && <div>🌐 <strong>Nettside:</strong> {websiteUrl}</div>}
                <div>🎨 <strong>Primærfarge:</strong> <span style={{ color: primaryColor, fontWeight: '700' }}>{primaryColor}</span></div>
                {scrapedTerms.length > 0 && <div>📚 <strong>Fagtermer:</strong> {scrapedTerms.length} hentet</div>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, background: '#f1f5f9', color: '#374151', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>← Tilbake</button>
              <button onClick={handleSave} disabled={loading}
                style={{ flex: 2, background: loading ? '#94a3b8' : '#16a34a', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '⏳ Lagrer...' : '✅ Lagre bedriftsprofil'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
