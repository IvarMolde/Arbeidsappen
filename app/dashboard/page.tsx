'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Company, GenerationRequest, CompanyDocument } from '@/types'

type View = 'dashboard' | 'library' | 'history' | 'companies' | 'documents'
type FolderFilter = 'alle' | string

interface LibraryFile {
  id: string
  name: string
  type: 'docx' | 'pptx' | 'html'
  company: string
  companyId: string
  level: string
  date: string
  url?: string
  size?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [view, setView] = useState<View>('dashboard')
  const [companies, setCompanies] = useState<Company[]>([])
  const [requests, setRequests] = useState<GenerationRequest[]>([])
  const [documents, setDocuments] = useState<CompanyDocument[]>([])
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string } } | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [folderFilter, setFolderFilter] = useState<FolderFilter>('alle')
  const [histFilter, setHistFilter] = useState<'alle' | 'completed' | 'error'>('alle')
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [folders, setFolders] = useState<string[]>([])
  const [newFolderInput, setNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const folderInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)
      const [{ data: cos }, { data: reqs }, { data: docs }] = await Promise.all([
        supabase.from('companies').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('generation_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('company_documents').select('*').order('created_at', { ascending: false }),
      ])
      setCompanies(cos || [])
      setRequests(reqs || [])
      setDocuments(docs || [])
      setLoading(false)
    }
    load()
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function deleteRequest(id: string) {
    await supabase.from('generation_requests').delete().eq('id', id)
    setRequests(prev => prev.filter(r => r.id !== id))
    showToast('Historikk slettet')
  }

  async function clearAllHistory() {
    if (!window.confirm('Slette all historikk? Dette kan ikke angres.')) return
    const ids = requests.map(r => r.id)
    await supabase.from('generation_requests').delete().in('id', ids)
    setRequests([])
    showToast('All historikk slettet')
  }

  async function deleteDocument(id: string) {
    await supabase.from('company_documents').delete().eq('id', id)
    setDocuments(prev => prev.filter(d => d.id !== id))
    showToast('Fil slettet')
  }

  function addFolder() {
    setNewFolderInput(true)
    setTimeout(() => folderInputRef.current?.focus(), 50)
  }

  function confirmFolder() {
    if (newFolderName.trim()) {
      setFolders(prev => [...prev, newFolderName.trim()])
      showToast(`Mappe "${newFolderName.trim()}" opprettet`)
    }
    setNewFolderInput(false)
    setNewFolderName('')
  }

  // Build library files from requests
  const libraryFiles: LibraryFile[] = requests
    .filter(r => r.status === 'completed')
    .flatMap(r => {
      const company = companies.find(c => c.id === r.company_id)
      const companyName = company?.name || 'Ukjent bedrift'
      const date = new Date(r.created_at).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
      const files: LibraryFile[] = []
      if (r.output_docx_url) files.push({ id: `${r.id}-docx`, name: `Arbeidsark_${r.cefr_level}_${r.mother_tongue}.docx`, type: 'docx', company: companyName, companyId: r.company_id, level: r.cefr_level, date, url: r.output_docx_url })
      if (r.output_pptx_url) files.push({ id: `${r.id}-pptx`, name: `Presentasjon_${r.cefr_level}_${r.mother_tongue}.pptx`, type: 'pptx', company: companyName, companyId: r.company_id, level: r.cefr_level, date, url: r.output_pptx_url })
      if (r.output_html_url) files.push({ id: `${r.id}-html`, name: `Interaktiv_${r.cefr_level}_${r.mother_tongue}.html`, type: 'html', company: companyName, companyId: r.company_id, level: r.cefr_level, date, url: r.output_html_url })
      return files
    })

  const filteredFiles = folderFilter === 'alle' ? libraryFiles : libraryFiles.filter(f => f.companyId === folderFilter)
  const filteredRequests = histFilter === 'alle' ? requests : requests.filter(r => r.status === histFilter)

  const completedCount = requests.filter(r => r.status === 'completed').length
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Bruker'
  const initials = userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const today = new Date().toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const todayCapital = today.charAt(0).toUpperCase() + today.slice(1)

  const navItems: { id: View; label: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'companies', label: 'Bedrifter', badge: companies.length },
    { id: 'library', label: 'Filbibliotek', badge: libraryFiles.length },
    { id: 'documents', label: 'Dokumenter', badge: documents.length },
    { id: 'history', label: 'Historikk', badge: requests.filter(r => r.status === 'error').length || undefined },
  ]

  if (loading) return (
    <div style={S.loadWrap}>
      <div style={S.spinner}></div>
      <p style={{ color: '#6b7280', marginTop: '1rem', fontSize: '0.9rem' }}>Laster dashboard...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={S.shell}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',system-ui,sans-serif}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:99px}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        .nav-item{transition:all 0.15s;border:none;background:none;width:100%;text-align:left;font-family:'DM Sans',system-ui,sans-serif;cursor:pointer}
        .nav-item:hover{background:#f3f4f6}
        .nav-item.active{background:#eff6ff;color:#2563eb}
        .card-hover{transition:all 0.15s}
        .card-hover:hover{box-shadow:0 4px 16px rgba(0,0,0,0.1);transform:translateY(-1px)}
        .row-hover{transition:background 0.1s}
        .row-hover:hover{background:#f9fafb}
        .btn-icon{background:none;border:0.5px solid transparent;border-radius:6px;padding:5px 7px;cursor:pointer;font-size:13px;transition:all 0.15s;line-height:1;font-family:'DM Sans',system-ui,sans-serif}
        .btn-icon:hover{background:#f3f4f6;border-color:#e5e7eb}
        .btn-del:hover{background:#fef2f2;border-color:#fecaca;color:#dc2626}
        .tab-btn{background:none;border:none;padding:7px 14px;font-size:13px;font-weight:500;cursor:pointer;border-bottom:2px solid transparent;color:#6b7280;font-family:'DM Sans',system-ui,sans-serif;transition:all 0.15s}
        .tab-btn.active{color:#2563eb;border-bottom-color:#2563eb}
        .tab-btn:hover:not(.active){color:#374151}
        .chip-btn{background:none;border:0.5px solid #e5e7eb;border-radius:99px;padding:5px 12px;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;color:#6b7280;font-family:'DM Sans',system-ui,sans-serif;transition:all 0.15s}
        .chip-btn:hover{background:#f3f4f6}
        .chip-btn.active{background:#eff6ff;color:#2563eb;border-color:transparent}
        .drag-row[draggable]:hover{cursor:grab}
        .drag-row.drag-over{background:#eff6ff;border-left:3px solid #2563eb}
        input,select,textarea{font-family:'DM Sans',system-ui,sans-serif}
        .qa-btn{background:none;border:0.5px solid #e5e7eb;border-radius:10px;padding:14px 10px;cursor:pointer;transition:all 0.15s;font-family:'DM Sans',system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;gap:7px;text-align:center}
        .qa-btn:hover{background:#f9fafb;border-color:#d1d5db;transform:translateY(-1px)}
      `}</style>

      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <div style={S.sidebarLogo}>
          <div style={S.logoMark}>AN</div>
          <span style={S.logoText}>Arbeidsnorsk</span>
        </div>

        <div style={{ padding: '8px', flex: 1 }}>
          <div style={S.navLabel}>Navigasjon</div>
          {navItems.map(item => (
            <button key={item.id} className={`nav-item${view === item.id ? ' active' : ''}`}
              style={S.navItem} onClick={() => setView(item.id)}>
              <NavIcon id={item.id} active={view === item.id} />
              <span style={{ flex: 1, fontSize: '13.5px', fontWeight: view === item.id ? '500' : '400' }}>{item.label}</span>
              {item.badge ? (
                <span style={{ ...S.badge, background: item.id === 'history' && item.badge > 0 ? '#fef2f2' : '#f3f4f6', color: item.id === 'history' && item.badge > 0 ? '#dc2626' : '#6b7280' }}>
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}

          <div style={{ ...S.navLabel, marginTop: '20px' }}>Handlinger</div>
          <Link href="/setup" style={{ textDecoration: 'none' }}>
            <button className="nav-item" style={S.navItem}>
              <span style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>+</span>
              <span style={{ fontSize: '13.5px' }}>Ny bedrift</span>
            </button>
          </Link>
          <button className="nav-item" style={S.navItem} onClick={() => { setView('library'); showToast('Gå til Generer for å lage nytt materiell') }}>
            <span style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>✨</span>
            <span style={{ fontSize: '13.5px' }}>Ny generering</span>
          </button>
        </div>

        <div style={S.sidebarFooter}>
          <div style={S.userChip}>
            <div style={S.avatar}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12.5px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Administrator</div>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#9ca3af', padding: '3px', flexShrink: 0 }} title="Logg ut">↩</button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={S.main}>
        {/* TOPBAR */}
        <div style={S.topbar}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              {navItems.find(n => n.id === view)?.label || 'Dashboard'}
            </div>
            <div style={{ fontSize: '12.5px', color: '#9ca3af', marginTop: '1px' }}>{todayCapital}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', alignItems: 'center' }}>
            <Link href="/generate" style={{ textDecoration: 'none' }}>
              <button style={S.btnPrimary}>+ Ny generering</button>
            </Link>
          </div>
        </div>

        {/* CONTENT */}
        <div style={S.content}>

          {/* ═══════════ DASHBOARD ═══════════ */}
          {view === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeUp 0.3s ease' }}>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                  { label: 'Bedrifter', value: companies.length, color: '#2563eb' },
                  { label: 'Genereringer', value: requests.length, color: '#059669' },
                  { label: 'Fullført', value: completedCount, color: '#7c3aed' },
                  { label: 'Filer i bibliotek', value: libraryFiles.length, color: '#d97706' },
                ].map((s, i) => (
                  <div key={i} style={S.statCard}>
                    <div style={{ fontSize: '11.5px', color: '#9ca3af', fontWeight: '500', marginBottom: '8px' }}>{s.label}</div>
                    <div style={{ fontSize: '28px', fontWeight: '600', color: '#111827', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ height: '3px', background: s.color, borderRadius: '99px', marginTop: '10px', opacity: 0.3, width: `${Math.min(100, (s.value / Math.max(1, requests.length)) * 100)}%`, minWidth: '20%' }}></div>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <Panel title="Hurtigvalg">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', padding: '12px' }}>
                  {[
                    { icon: '✨', label: 'Generer', href: '/generate' },
                    { icon: '🏢', label: 'Ny bedrift', href: '/setup' },
                    { icon: '📁', label: 'Filbibliotek', action: () => setView('library') },
                    { icon: '📄', label: 'Dokumenter', action: () => setView('documents') },
                    { icon: '🕐', label: 'Historikk', action: () => setView('history') },
                    { icon: '⚙️', label: 'Innstillinger', href: '#' },
                  ].map((qa, i) => qa.href ? (
                    <Link key={i} href={qa.href} style={{ textDecoration: 'none' }}>
                      <button className="qa-btn" style={{ width: '100%' }}>
                        <span style={{ fontSize: '20px' }}>{qa.icon}</span>
                        <span style={{ fontSize: '11.5px', fontWeight: '500', color: '#374151' }}>{qa.label}</span>
                      </button>
                    </Link>
                  ) : (
                    <button key={i} className="qa-btn" onClick={qa.action}>
                      <span style={{ fontSize: '20px' }}>{qa.icon}</span>
                      <span style={{ fontSize: '11.5px', fontWeight: '500', color: '#374151' }}>{qa.label}</span>
                    </button>
                  ))}
                </div>
              </Panel>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Companies */}
                <Panel title="Bedrifter" action={{ label: 'Se alle', onClick: () => setView('companies') }}>
                  {companies.length === 0 ? (
                    <EmptyState icon="🏢" text="Ingen bedrifter ennå">
                      <Link href="/setup"><button style={S.btnPrimary}>Legg til bedrift</button></Link>
                    </EmptyState>
                  ) : (
                    <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {companies.slice(0, 3).map(c => (
                        <div key={c.id} className="card-hover"
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: '0.5px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', bottom: 0, background: c.primary_color || '#2563eb', borderRadius: '0' }}></div>
                          <div style={{ marginLeft: '8px', width: '32px', height: '32px', borderRadius: '7px', background: c.primary_color || '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '13px', flexShrink: 0 }}>
                            {c.name.charAt(0)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{c.industry || 'Ingen bransje'}</div>
                          </div>
                          <Link href={`/generate?company=${c.id}`} style={{ textDecoration: 'none' }}>
                            <button style={{ ...S.btnPrimary, padding: '5px 10px', fontSize: '12px' }}>Generer</button>
                          </Link>
                        </div>
                      ))}
                      {companies.length > 3 && (
                        <button onClick={() => setView('companies')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12.5px', cursor: 'pointer', padding: '6px', textAlign: 'center', fontFamily: 'inherit' }}>
                          + {companies.length - 3} flere bedrifter
                        </button>
                      )}
                    </div>
                  )}
                </Panel>

                {/* Recent history */}
                <Panel title="Siste aktivitet" action={{ label: 'Se alt', onClick: () => setView('history') }}>
                  {requests.length === 0 ? (
                    <EmptyState icon="🕐" text="Ingen genereringer ennå" />
                  ) : (
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {requests.slice(0, 5).map(req => {
                        const co = companies.find(c => c.id === req.company_id)
                        const date = new Date(req.created_at).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
                        return (
                          <div key={req.id} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 12px', borderBottom: '0.5px solid #f3f4f6' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: req.status === 'completed' ? '#10b981' : req.status === 'error' ? '#ef4444' : '#f59e0b', flexShrink: 0 }}></div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '12.5px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {co?.name || 'Ukjent'} – {req.cefr_level}
                              </div>
                              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{date} · {req.mother_tongue}</div>
                            </div>
                            <button className="btn-icon btn-del" onClick={() => deleteRequest(req.id)}>✕</button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Panel>
              </div>
            </div>
          )}

          {/* ═══════════ COMPANIES ═══════════ */}
          {view === 'companies' && (
            <div style={{ animation: 'fadeUp 0.3s ease' }}>
              <Panel title={`Bedrifter (${companies.length})`} action={{ label: '+ Ny bedrift', href: '/setup' }}>
                {companies.length === 0 ? (
                  <EmptyState icon="🏢" text="Ingen bedrifter registrert ennå">
                    <Link href="/setup"><button style={S.btnPrimary}>Legg til første bedrift</button></Link>
                  </EmptyState>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', padding: '14px' }}>
                    {companies.map(c => (
                      <div key={c.id} className="card-hover" style={{ border: '0.5px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ height: '4px', background: c.primary_color || '#2563eb' }}></div>
                        <div style={{ padding: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: c.primary_color || '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '14px', flexShrink: 0 }}>
                              {c.name.charAt(0)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                              <div style={{ fontSize: '12px', color: '#9ca3af' }}>{c.industry || 'Ingen bransje'}</div>
                            </div>
                          </div>
                          {c.website_url && (
                            <div style={{ fontSize: '11.5px', color: '#9ca3af', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              🌐 {c.website_url}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <Link href={`/generate?company=${c.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                              <button style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center' }}>✨ Generer</button>
                            </Link>
                            <Link href={`/setup?edit=${c.id}`} style={{ textDecoration: 'none' }}>
                              <button style={{ ...S.btnGhost, padding: '6px 12px' }}>Rediger</button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Link href="/setup" style={{ textDecoration: 'none' }}>
                      <div style={{ border: '1.5px dashed #e5e7eb', borderRadius: '10px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.15s', color: '#9ca3af', minHeight: '140px', justifyContent: 'center' }}>
                        <span style={{ fontSize: '24px' }}>+</span>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>Ny bedrift</span>
                      </div>
                    </Link>
                  </div>
                )}
              </Panel>
            </div>
          )}

          {/* ═══════════ FILE LIBRARY ═══════════ */}
          {view === 'library' && (
            <div style={{ animation: 'fadeUp 0.3s ease' }}>
              <Panel title={`Filbibliotek (${libraryFiles.length} filer)`}>
                {/* Folder filter bar */}
                <div style={{ display: 'flex', gap: '6px', padding: '10px 14px', borderBottom: '0.5px solid #f3f4f6', overflowX: 'auto', flexShrink: 0 }}>
                  <button className={`chip-btn${folderFilter === 'alle' ? ' active' : ''}`} onClick={() => setFolderFilter('alle')}>Alle filer</button>
                  {companies.map(c => (
                    <button key={c.id} className={`chip-btn${folderFilter === c.id ? ' active' : ''}`} onClick={() => setFolderFilter(c.id)}>
                      {c.name}
                    </button>
                  ))}
                  {folders.map(f => (
                    <button key={f} className={`chip-btn${folderFilter === f ? ' active' : ''}`} onClick={() => setFolderFilter(f)}>
                      📁 {f}
                    </button>
                  ))}
                  {newFolderInput ? (
                    <input ref={folderInputRef} value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                      onBlur={confirmFolder} onKeyDown={e => e.key === 'Enter' && confirmFolder()}
                      placeholder="Mappenavn..." style={{ padding: '4px 10px', border: '0.5px solid #2563eb', borderRadius: '99px', fontSize: '12px', outline: 'none', width: '120px' }} />
                  ) : (
                    <button className="chip-btn" onClick={addFolder} style={{ borderStyle: 'dashed', color: '#9ca3af' }}>+ Ny mappe</button>
                  )}
                </div>

                {/* File list */}
                {filteredFiles.length === 0 ? (
                  <EmptyState icon="📁" text="Ingen filer i denne mappen ennå">
                    <Link href="/generate"><button style={S.btnPrimary}>Generer første fil</button></Link>
                  </EmptyState>
                ) : (
                  <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    {filteredFiles.map(file => (
                      <div key={file.id} className={`row-hover drag-row${dragOver === file.id ? ' drag-over' : ''}`}
                        draggable
                        onDragStart={e => { e.dataTransfer.setData('fileId', file.id) }}
                        onDragOver={e => { e.preventDefault(); setDragOver(file.id) }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={e => { e.preventDefault(); setDragOver(null); showToast('Fil omorganisert') }}
                        style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '9px 14px', borderBottom: '0.5px solid #f9fafb' }}>
                        <FileTypeIcon type={file.type} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{file.company} · {file.date}</div>
                        </div>
                        <LevelBadge level={file.level} />
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                          {file.url && (
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                              <button className="btn-icon" title="Last ned">↓</button>
                            </a>
                          )}
                          <button className="btn-icon btn-del" title="Slett" onClick={() => showToast('Slettet fra bibliotek')}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff' }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'transparent' }}
                  onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'transparent'; showToast('Fil flyttet') }}
                  style={{ margin: '10px 14px', border: '1.5px dashed #e5e7eb', borderRadius: '8px', padding: '14px', textAlign: 'center', fontSize: '12px', color: '#9ca3af', cursor: 'pointer', transition: 'all 0.2s' }}>
                  Dra filer hit for å flytte mellom mapper
                </div>
              </Panel>
            </div>
          )}

          {/* ═══════════ DOCUMENTS ═══════════ */}
          {view === 'documents' && (
            <div style={{ animation: 'fadeUp 0.3s ease' }}>
              <Panel title={`Opplastede dokumenter (${documents.length})`}>
                {documents.length === 0 ? (
                  <EmptyState icon="📄" text="Ingen dokumenter lastet opp ennå">
                    <p style={{ fontSize: '13px', color: '#9ca3af' }}>Last opp dokumenter fra genereringssiden</p>
                  </EmptyState>
                ) : (
                  <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    {documents.map(doc => (
                      <div key={doc.id} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '9px 14px', borderBottom: '0.5px solid #f9fafb' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '7px', background: doc.document_type === 'design' ? '#fce7f3' : doc.document_type === 'hms' ? '#fef3c7' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '600', color: '#374151', flexShrink: 0 }}>
                          {doc.file_type.toUpperCase().slice(0, 4)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.file_name}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                            {doc.document_type === 'design' ? '🎨 Designfil' : doc.document_type === 'hms' ? '⚠️ HMS' : doc.document_type === 'manual' ? '📖 Manual' : doc.document_type === 'instruction' ? '📋 Instruks' : '📄 Annet'}
                            · {new Date(doc.created_at).toLocaleDateString('nb-NO')}
                          </div>
                        </div>
                        <button className="btn-icon btn-del" onClick={() => deleteDocument(doc.id)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          )}

          {/* ═══════════ HISTORY ═══════════ */}
          {view === 'history' && (
            <div style={{ animation: 'fadeUp 0.3s ease' }}>
              <Panel title={`Historikk (${requests.length})`} action={{ label: 'Slett all historikk', onClick: clearAllHistory, danger: true }}>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '0.5px solid #f3f4f6', padding: '0 8px' }}>
                  {([['alle', 'Alle'], ['completed', 'Fullført'], ['error', 'Feil']] as const).map(([key, label]) => (
                    <button key={key} className={`tab-btn${histFilter === key ? ' active' : ''}`} onClick={() => setHistFilter(key)}>
                      {label}
                      {key === 'error' && requests.filter(r => r.status === 'error').length > 0 && (
                        <span style={{ marginLeft: '5px', background: '#fef2f2', color: '#dc2626', fontSize: '10px', fontWeight: '600', padding: '1px 5px', borderRadius: '99px' }}>
                          {requests.filter(r => r.status === 'error').length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {filteredRequests.length === 0 ? (
                  <EmptyState icon="🕐" text="Ingen oppføringer" />
                ) : (
                  <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    {filteredRequests.map(req => {
                      const co = companies.find(c => c.id === req.company_id)
                      const date = new Date(req.created_at).toLocaleString('nb-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      const filesCount = [req.output_docx_url, req.output_pptx_url, req.output_html_url].filter(Boolean).length
                      return (
                        <div key={req.id} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderBottom: '0.5px solid #f9fafb' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: req.status === 'completed' ? '#10b981' : req.status === 'error' ? '#ef4444' : '#f59e0b', flexShrink: 0 }}></div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500' }}>
                              {co?.name || 'Ukjent bedrift'} – {req.cefr_level}
                              <LevelBadge level={req.cefr_level} style={{ marginLeft: '6px' }} />
                            </div>
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                              {date} · {req.mother_tongue}
                              {filesCount > 0 && ` · ${filesCount} filer`}
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '99px', background: req.status === 'completed' ? '#d1fae5' : req.status === 'error' ? '#fee2e2' : '#fef3c7', color: req.status === 'completed' ? '#065f46' : req.status === 'error' ? '#991b1b' : '#92400e', flexShrink: 0 }}>
                            {req.status === 'completed' ? 'Fullført' : req.status === 'error' ? 'Feil' : 'Behandler'}
                          </span>
                          {req.status === 'completed' && (
                            <Link href={`/generate?company=${req.company_id}`}>
                              <button className="btn-icon" title="Generer på nytt">↻</button>
                            </Link>
                          )}
                          <button className="btn-icon btn-del" onClick={() => deleteRequest(req.id)} title="Slett">✕</button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Panel>
            </div>
          )}

        </div>
      </main>

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#111827', color: 'white', padding: '9px 20px', borderRadius: '99px', fontSize: '13px', fontWeight: '500', zIndex: 999, animation: 'toastIn 0.2s ease', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ── SUB-COMPONENTS ──

function Panel({ title, children, action }: {
  title: string
  children: React.ReactNode
  action?: { label: string; onClick?: () => void; href?: string; danger?: boolean }
}) {
  return (
    <div style={{ background: 'white', border: '0.5px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '0.5px solid #f3f4f6' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{title}</span>
        {action && (action.href ? (
          <Link href={action.href} style={{ textDecoration: 'none' }}>
            <button style={{ background: 'none', border: 'none', fontSize: '12.5px', color: '#2563eb', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500' }}>{action.label}</button>
          </Link>
        ) : (
          <button onClick={action.onClick} style={{ background: 'none', border: 'none', fontSize: '12.5px', color: action.danger ? '#dc2626' : '#2563eb', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500' }}>{action.label}</button>
        ))}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ icon, text, children }: { icon: string; text: string; children?: React.ReactNode }) {
  return (
    <div style={{ padding: '36px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '28px' }}>{icon}</span>
      <p style={{ fontSize: '13.5px', color: '#9ca3af' }}>{text}</p>
      {children}
    </div>
  )
}

function FileTypeIcon({ type }: { type: 'docx' | 'pptx' | 'html' }) {
  const config = {
    docx: { bg: '#dbeafe', color: '#1d4ed8', label: 'DOCX' },
    pptx: { bg: '#fce7f3', color: '#be185d', label: 'PPTX' },
    html: { bg: '#d1fae5', color: '#065f46', label: 'HTML' },
  }
  const c = config[type]
  return (
    <div style={{ width: '32px', height: '32px', borderRadius: '7px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '600', color: c.color, flexShrink: 0 }}>
      {c.label}
    </div>
  )
}

function LevelBadge({ level, style: extraStyle }: { level: string; style?: React.CSSProperties }) {
  const config: Record<string, { bg: string; color: string }> = {
    A1: { bg: '#d1fae5', color: '#065f46' },
    A2: { bg: '#dbeafe', color: '#1d4ed8' },
    B1: { bg: '#ede9fe', color: '#5b21b6' },
  }
  const c = config[level] || { bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '99px', background: c.bg, color: c.color, flexShrink: 0, ...extraStyle }}>
      {level}
    </span>
  )
}

function NavIcon({ id, active }: { id: View; active: boolean }) {
  const color = active ? '#2563eb' : '#9ca3af'
  const icons: Record<View, React.ReactNode> = {
    dashboard: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>,
    companies: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"><rect x="2" y="7" width="12" height="8" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>,
    library: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"><path d="M2 3h12M2 8h8M2 13h10"/></svg>,
    documents: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"><path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5L9 1z"/><path d="M9 1v4h4"/></svg>,
    history: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>,
  }
  return <span style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icons[id]}</span>
}

// ── STYLES ──
const S: Record<string, React.CSSProperties> = {
  shell: { display: 'flex', height: '100vh', background: '#f3f4f6', fontFamily: "'DM Sans', system-ui, sans-serif" },
  loadWrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' },
  spinner: { width: '32px', height: '32px', border: '2.5px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  sidebar: { width: '220px', background: 'white', borderRight: '0.5px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarLogo: { padding: '16px 14px 13px', display: 'flex', alignItems: 'center', gap: '9px', borderBottom: '0.5px solid #f3f4f6' },
  logoMark: { width: '28px', height: '28px', background: '#2563eb', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '600', letterSpacing: '-0.3px', flexShrink: 0 },
  logoText: { fontSize: '14px', fontWeight: '600', color: '#111827' },
  navLabel: { fontSize: '10px', fontWeight: '600', color: '#d1d5db', letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '0 8px 5px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '8px', marginBottom: '1px', color: '#4b5563' },
  badge: { fontSize: '10px', fontWeight: '600', padding: '1px 6px', borderRadius: '99px', flexShrink: 0 },
  sidebarFooter: { padding: '10px', borderTop: '0.5px solid #f3f4f6' },
  userChip: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px' },
  avatar: { width: '28px', height: '28px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topbar: { height: '56px', background: 'white', borderBottom: '0.5px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px', flexShrink: 0 },
  content: { flex: 1, overflowY: 'auto' as const, padding: '18px 20px' },
  statCard: { background: 'white', border: '0.5px solid #e5e7eb', borderRadius: '10px', padding: '14px 16px' },
  btnPrimary: { display: 'flex', alignItems: 'center', gap: '5px', background: '#2563eb', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'background 0.15s' },
  btnGhost: { display: 'flex', alignItems: 'center', gap: '5px', background: 'none', color: '#374151', border: '0.5px solid #e5e7eb', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
}
