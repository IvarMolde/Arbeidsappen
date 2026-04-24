'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Company, GenerationRequest } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [companies, setCompanies] = useState<Company[]>([])
  const [requests, setRequests] = useState<GenerationRequest[]>([])
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string } } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      const { data: cos } = await supabase.from('companies').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setCompanies(cos || [])

      const { data: reqs } = await supabase.from('generation_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
      setRequests(reqs || [])

      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#1a56db', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}></div>
        <p style={{ color: '#64748b' }}>Laster dashboard...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top nav */}
      <nav style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🇳🇴</span>
          <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#0f172a' }}>Arbeidsnorsk</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
            👤 {user?.user_metadata?.full_name || user?.email}
          </span>
          <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '0.4rem 0.9rem', borderRadius: '8px', cursor: 'pointer', color: '#64748b', fontSize: '0.88rem' }}>
            Logg ut
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a' }}>Dashboard</h1>
            <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Administrer bedriftsprofiler og generer opplæringsmateriell</p>
          </div>
          <Link href="/setup" style={{ background: '#1a56db', color: 'white', textDecoration: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem' }}>
            + Ny bedrift
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Bedrifter', value: companies.length, icon: '🏢' },
            { label: 'Genereringer', value: requests.length, icon: '📄' },
            { label: 'Fullførte', value: requests.filter(r => r.status === 'completed').length, icon: '✅' },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>{stat.value}</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Companies */}
        <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem' }}>Dine bedrifter</h2>
        {companies.length === 0 ? (
          <div style={{ background: 'white', border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Du har ikke lagt til noen bedrifter ennå</p>
            <Link href="/setup" style={{ background: '#1a56db', color: 'white', textDecoration: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', fontWeight: '700' }}>
              Legg til bedrift
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {companies.map(company => (
              <div key={company.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s' }}>
                <div style={{ height: '6px', background: company.primary_color || '#1a56db' }}></div>
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    {company.logo_url ? (
                      <img src={company.logo_url} alt="logo" style={{ height: '36px', width: '36px', objectFit: 'contain', borderRadius: '6px' }} />
                    ) : (
                      <div style={{ width: '36px', height: '36px', background: company.primary_color || '#1a56db', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '1.1rem' }}>
                        {company.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{company.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.82rem' }}>{company.industry || 'Ingen bransje'}</div>
                    </div>
                  </div>
                  {company.website_url && (
                    <div style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      🌐 {company.website_url}
                    </div>
                  )}
                  <Link href={`/generate?company=${company.id}`}
                    style={{ display: 'block', background: '#1a56db', color: 'white', textDecoration: 'none', padding: '0.6rem', borderRadius: '8px', textAlign: 'center', fontWeight: '700', fontSize: '0.9rem' }}>
                    ✨ Generer materiell
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent generations */}
        {requests.length > 0 && (
          <>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem' }}>Siste genereringer</h2>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              {requests.map((req, i) => (
                <div key={req.id} style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < requests.length - 1 ? '1px solid #f1f5f9' : 'none', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{req.status === 'completed' ? '✅' : req.status === 'error' ? '❌' : '⏳'}</span>
                    <div>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Nivå {req.cefr_level}</span>
                      <span style={{ color: '#64748b', fontSize: '0.82rem', marginLeft: '0.5rem' }}>· {req.mother_tongue}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ background: req.status === 'completed' ? '#f0fdf4' : req.status === 'error' ? '#fef2f2' : '#fefce8', color: req.status === 'completed' ? '#16a34a' : req.status === 'error' ? '#dc2626' : '#ca8a04', padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.78rem', fontWeight: '600' }}>
                      {req.status === 'completed' ? 'Ferdig' : req.status === 'error' ? 'Feil' : 'Behandler'}
                    </span>
                    {req.output_html_url && (
                      <a href={req.output_html_url} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#1a56db', fontSize: '0.85rem', fontWeight: '600', textDecoration: 'none' }}>
                        Last ned HTML →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
