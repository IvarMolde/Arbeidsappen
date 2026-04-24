'use client'
import type { GeneratedContent, DesignProfile } from '@/types'

interface PreviewProps {
  content: GeneratedContent
  design: DesignProfile
  htmlUrl?: string
  onExportDocx: () => void
  onExportPptx: () => void
  onReset: () => void
  exportingDocx: boolean
  exportingPptx: boolean
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

export default function ContentPreview({
  content, design, htmlUrl,
  onExportDocx, onExportPptx, onReset,
  exportingDocx, exportingPptx,
}: PreviewProps) {
  const { company, level, motherTongue, fagTekster, oppgaver, wordList } = content
  const levelColor = levelColors[level] || '#2563eb'
  const primary = design.primaryColor
  const secondary = design.secondaryColor

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.65rem',
    padding: '0.8rem 1.1rem', borderRadius: '10px',
    fontWeight: '700', cursor: 'pointer', border: 'none',
    fontSize: '0.92rem', transition: 'all 0.2s',
  }

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

      {/* Hero banner */}
      <div style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)`, padding: '1.5rem 1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-30px', top: '-30px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '0.25rem 0.8rem', borderRadius: '99px', fontSize: '0.82rem', fontWeight: '700', border: '1px solid rgba(255,255,255,0.3)' }}>
              Nivå {level}
            </span>
            <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '0.25rem 0.8rem', borderRadius: '99px', fontSize: '0.82rem', border: '1px solid rgba(255,255,255,0.2)' }}>
              {motherTongue}
            </span>
            <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '0.25rem 0.8rem', borderRadius: '99px', fontSize: '0.82rem', border: '1px solid rgba(255,255,255,0.2)' }}>
              {fagTekster.length} fagtekster · {wordList.length} ord
            </span>
          </div>
          <h2 style={{ color: 'white', fontSize: '1.3rem', fontWeight: '800', margin: 0 }}>
            ✅ {company.name} – Norskopplæring klar
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: '0.3rem', fontSize: '0.9rem' }}>
            Kontroller innholdet nedenfor før nedlasting
          </p>
        </div>
      </div>

      {/* Download buttons */}
      <div style={{ padding: '1.25rem 1.75rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {htmlUrl && (
          <a href={htmlUrl} target="_blank" rel="noopener noreferrer"
            style={{ ...btnBase, background: '#1a56db', color: 'white', textDecoration: 'none', boxShadow: '0 2px 8px rgba(26,86,219,0.3)' }}>
            <span style={{ fontSize: '1.2rem' }}>🌐</span>
            <div><div>HTML-fil</div><div style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.85 }}>Åpne interaktiv versjon</div></div>
          </a>
        )}
        <button onClick={onExportDocx} disabled={exportingDocx}
          style={{ ...btnBase, background: exportingDocx ? '#94a3b8' : '#2563eb', color: 'white', boxShadow: '0 2px 8px rgba(37,99,235,0.25)', cursor: exportingDocx ? 'not-allowed' : 'pointer' }}>
          {exportingDocx
            ? <><Spinner /><span>Genererer Word...</span></>
            : <><span style={{ fontSize: '1.2rem' }}>📄</span><div><div>Word (.docx)</div><div style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.85 }}>Utskriftsvennlig arbeidsark</div></div></>}
        </button>
        <button onClick={onExportPptx} disabled={exportingPptx}
          style={{ ...btnBase, background: exportingPptx ? '#94a3b8' : '#7c3aed', color: 'white', boxShadow: '0 2px 8px rgba(124,58,237,0.25)', cursor: exportingPptx ? 'not-allowed' : 'pointer' }}>
          {exportingPptx
            ? <><Spinner /><span>Genererer PPT...</span></>
            : <><span style={{ fontSize: '1.2rem' }}>📊</span><div><div>PowerPoint (.pptx)</div><div style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.85 }}>For leder og ansatt</div></div></>}
        </button>
        <button onClick={onReset}
          style={{ ...btnBase, background: 'white', color: '#64748b', border: '1.5px solid #e2e8f0' }}>
          🔄 Generer nytt
        </button>
      </div>

      {/* Content preview */}
      <div style={{ padding: '1.75rem' }}>

        {/* Wordlist preview */}
        <Section icon="📖" title={`Ordliste (${wordList.length} ord)`} color={primary}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
            {wordList.slice(0, 12).map((w, i) => (
              <div key={i} style={{ background: secondary, borderRadius: '8px', padding: '0.65rem 0.85rem', borderLeft: `3px solid ${primary}` }}>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: primary }}>{w.norwegian}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>{w.translation}</div>
              </div>
            ))}
            {wordList.length > 12 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '0.65rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                +{wordList.length - 12} flere ord i dokumentene
              </div>
            )}
          </div>
        </Section>

        {/* Fagtekster + oppgaver preview */}
        {fagTekster.map((tekst, tIdx) => (
          <div key={tIdx}>
            <Section icon="📝" title={`Fagtekst ${tIdx + 1}: ${tekst.title}`} color={primary}>
              <div style={{ background: '#f8faff', borderLeft: `4px solid ${primary}`, padding: '1rem 1.25rem', borderRadius: '0 8px 8px 0', fontSize: '0.92rem', lineHeight: '1.7', color: '#374151' }}>
                {tekst.content.length > 400
                  ? tekst.content.slice(0, 400) + '…'
                  : tekst.content}
              </div>
              {tekst.vocabulary.length > 0 && (
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {tekst.vocabulary.map((v, vi) => (
                    <span key={vi} style={{ background: 'white', border: `1px solid ${primary}40`, color: primary, padding: '0.2rem 0.65rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '600' }}>
                      {v.norwegian}
                    </span>
                  ))}
                </div>
              )}
            </Section>

            {/* Oppgaver for this tekst */}
            {(oppgaver[tIdx] || []).length > 0 && (
              <Section icon="✏️" title={`Oppgaver til Fagtekst ${tIdx + 1}`} color="#f59e0b" indent>
                {(oppgaver[tIdx] || []).map((o, oIdx) => (
                  <div key={oIdx} style={{ marginBottom: '1rem', background: '#fffbeb', borderRadius: '10px', padding: '1rem 1.1rem', border: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                      <div style={{ background: '#f59e0b', color: 'white', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.82rem', flexShrink: 0 }}>
                        {o.number}
                      </div>
                      <span style={{ fontWeight: '700', fontSize: '0.92rem' }}>{o.title}</span>
                      <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.15rem 0.55rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' }}>
                        {typeLabels[o.type] || o.type}
                      </span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.6rem', fontStyle: 'italic' }}>{o.instruction}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {o.subTasks.slice(0, 3).map((st, si) => (
                        <div key={si} style={{ fontSize: '0.85rem', color: '#374151', paddingLeft: '0.25rem' }}>
                          <span style={{ fontWeight: '800', color: '#f59e0b', marginRight: '0.4rem' }}>{st.letter})</span>
                          {st.question}
                          {st.options && st.options.length > 0 && (
                            <span style={{ color: '#94a3b8', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                              [{st.options.join(' / ')}]
                            </span>
                          )}
                        </div>
                      ))}
                      {o.subTasks.length > 3 && (
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', paddingLeft: '0.25rem' }}>
                          + {o.subTasks.length - 3} flere deloppgaver i dokumentene
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </Section>
            )}
          </div>
        ))}

        {/* PPT slides preview */}
        {content.pptSlides.length > 0 && (
          <Section icon="📊" title={`PowerPoint – ${content.pptSlides.length} slides`} color="#7c3aed">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.6rem' }}>
              {content.pptSlides.map((slide, si) => (
                <div key={si} style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '0.7rem 0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: '700', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {si + 1}. {slide.type}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>{slide.title}</div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ icon, title, color, indent = false, children }: {
  icon: string; title: string; color: string; indent?: boolean; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '1.5rem', paddingLeft: indent ? '1rem' : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem', paddingBottom: '0.5rem', borderBottom: `2px solid ${color}20` }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <h3 style={{ fontWeight: '700', fontSize: '0.97rem', color: '#0f172a', margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0 }} />
  )
}
