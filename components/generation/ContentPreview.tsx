'use client'
import type { GeneratedContent, DesignProfile } from '@/types'

interface PreviewProps {
  content: GeneratedContent
  design: DesignProfile
  onReset: () => void
}

const levelColors: Record<string, string> = {
  A1: '#16a34a', A2: '#2563eb', B1: '#7c3aed',
}

const typeLabels: Record<string, string> = {
  leseforstaelse: 'Leseforståelse', fyll_inn_blank: 'Fyll inn blankt',
  sorter_ord: 'Sorter ord', riktig_pastand: 'Finn riktig påstand',
  setningsstruktur: 'Setningsstruktur', multiple_choice: 'Flervalg',
  sant_usant: 'Sant / Usant', match_ord: 'Match ordene',
}

export default function ContentPreview({ content, design, onReset }: PreviewProps) {
  const { company, level, motherTongue, fagTekster, oppgaver, wordList } = content
  const primary = design.primaryColor
  const secondary = design.secondaryColor

  async function handleDownload(format: 'docx' | 'pptx' | 'html') {
    const endpoint = `/api/export/${format}`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, design }),
    })
    if (!res.ok) {
      alert(`Kunne ikke generere ${format.toUpperCase()}-fil`)
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const ext = format
    a.download = `norskopplaering_${level}_${company.name.replace(/\s+/g, '_')}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

      {/* Banner */}
      <div style={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc)`, padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '0.25rem 0.8rem', borderRadius: '99px', fontSize: '0.82rem', fontWeight: '700' }}>Nivå {level}</span>
          <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '0.25rem 0.8rem', borderRadius: '99px', fontSize: '0.82rem' }}>{motherTongue}</span>
          <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '0.25rem 0.8rem', borderRadius: '99px', fontSize: '0.82rem' }}>{fagTekster.length} fagtekster · {wordList.length} ord</span>
        </div>
        <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>
          ✅ {company.name} – Innhold generert!
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: '0.3rem', fontSize: '0.88rem' }}>
          Velg format og last ned nedenfor
        </p>
      </div>

      {/* Download buttons */}
      <div style={{ padding: '1.5rem 1.75rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Last ned i ønsket format:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>

          {/* Word */}
          <DownloadButton
            icon="📄"
            label="Word (.docx)"
            sublabel="Utskriftsvennlig arbeidsark med fasit"
            color="#2563eb"
            onClick={() => handleDownload('docx')}
          />

          {/* PowerPoint */}
          <DownloadButton
            icon="📊"
            label="PowerPoint (.pptx)"
            sublabel="Presentasjon for leder og ansatt"
            color="#7c3aed"
            onClick={() => handleDownload('pptx')}
          />

          {/* HTML */}
          <DownloadButton
            icon="🌐"
            label="HTML-fil"
            sublabel="Interaktiv digital versjon"
            color="#0891b2"
            onClick={() => handleDownload('html')}
          />
        </div>
        <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.75rem' }}>
          Alle tre formater inneholder nøyaktig samme innhold
        </p>
      </div>

      {/* Content preview */}
      <div style={{ padding: '1.75rem' }}>

        {/* Wordlist */}
        <Section icon="📖" title={`Ordliste – ${wordList.length} ord oversatt til ${motherTongue}`} color={primary}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.55rem' }}>
            {wordList.map((w, i) => (
              <div key={i} style={{ background: secondary, borderRadius: '8px', padding: '0.6rem 0.8rem', borderLeft: `3px solid ${primary}` }}>
                <div style={{ fontWeight: '700', fontSize: '0.88rem', color: primary }}>{w.norwegian}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>{w.translation}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Fagtekster og oppgaver */}
        {fagTekster.map((tekst, tIdx) => (
          <div key={tIdx}>
            <Section icon="📝" title={`Fagtekst ${tIdx + 1}: ${tekst.title}`} color={primary}>
              <div style={{ background: '#f8faff', borderLeft: `4px solid ${primary}`, padding: '1rem 1.25rem', borderRadius: '0 8px 8px 0', fontSize: '0.92rem', lineHeight: '1.7', color: '#374151' }}>
                {tekst.content}
              </div>
              {tekst.vocabulary.length > 0 && (
                <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {tekst.vocabulary.map((v, vi) => (
                    <span key={vi} style={{ background: 'white', border: `1px solid ${primary}40`, color: primary, padding: '0.2rem 0.65rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '600' }}>
                      {v.norwegian} → <span style={{ fontStyle: 'italic', fontWeight: '400' }}>{v.translation}</span>
                    </span>
                  ))}
                </div>
              )}
            </Section>

            {(oppgaver[tIdx] || []).length > 0 && (
              <Section icon="✏️" title={`Oppgaver til Fagtekst ${tIdx + 1}`} color="#f59e0b" indent>
                {(oppgaver[tIdx] || []).map((o, oIdx) => (
                  <div key={oIdx} style={{ marginBottom: '0.85rem', background: '#fffbeb', borderRadius: '10px', padding: '0.9rem 1rem', border: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <div style={{ background: '#f59e0b', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem', flexShrink: 0 }}>
                        {o.number}
                      </div>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{o.title}</span>
                      <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.15rem 0.55rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: '600' }}>
                        {typeLabels[o.type] || o.type}
                      </span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '0.5rem', fontStyle: 'italic' }}>{o.instruction}</p>
                    {o.subTasks.map((st, si) => (
                      <div key={si} style={{ fontSize: '0.83rem', color: '#374151', padding: '0.2rem 0', paddingLeft: '0.25rem' }}>
                        <span style={{ fontWeight: '800', color: '#f59e0b', marginRight: '0.4rem' }}>{st.letter})</span>
                        {st.question}
                        {st.options && st.options.length > 0 && (
                          <span style={{ color: '#94a3b8', fontSize: '0.76rem', marginLeft: '0.4rem' }}>
                            [{st.options.join(' / ')}]
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </Section>
            )}
          </div>
        ))}

        {/* PPT slides */}
        {content.pptSlides.length > 0 && (
          <Section icon="📊" title={`PowerPoint – ${content.pptSlides.length} slides`} color="#7c3aed">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
              {content.pptSlides.map((slide, si) => (
                <div key={si} style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '0.65rem 0.8rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: '700', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                    {si + 1}. {slide.type}
                  </div>
                  <div style={{ fontSize: '0.83rem', fontWeight: '600', color: '#374151' }}>{slide.title}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <button onClick={onReset}
          style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '500', marginTop: '0.5rem' }}>
          🔄 Generer nytt innhold
        </button>
      </div>
    </div>
  )
}

function DownloadButton({ icon, label, sublabel, color, onClick }: {
  icon: string; label: string; sublabel: string; color: string; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: color, color: 'white', border: 'none', padding: '1rem 1.1rem', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', textAlign: 'left', width: '100%', boxShadow: `0 2px 8px ${color}40`, transition: 'all 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
      <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '0.95rem' }}>{label}</div>
        <div style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: '400', marginTop: '0.1rem' }}>{sublabel}</div>
      </div>
    </button>
  )
}

function Section({ icon, title, color, indent = false, children }: {
  icon: string; title: string; color: string; indent?: boolean; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '1.5rem', paddingLeft: indent ? '1rem' : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: `2px solid ${color}25` }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <h3 style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a', margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}
