'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1a56db)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.75rem' }}>Sjekk e-posten din</h2>
          <p style={{ color: '#64748b' }}>Vi har sendt en bekreftelseslenke til <strong>{email}</strong>. Klikk lenken for å aktivere kontoen din.</p>
          <Link href="/auth/login" style={{ display: 'inline-block', marginTop: '1.5rem', color: '#1a56db', fontWeight: '600', textDecoration: 'none' }}>Tilbake til innlogging</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1a56db)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🇳🇴</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>Opprett konto</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.3rem' }}>Kom i gang med Arbeidsnorsk</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Navn</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ditt navn" required
              style={{ width: '100%', padding: '0.7rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.4rem' }}>E-post</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="din@epost.no" required
              style={{ width: '100%', padding: '0.7rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Passord</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minst 8 tegn" minLength={8} required
              style={{ width: '100%', padding: '0.7rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', outline: 'none' }} />
          </div>

          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.7rem', borderRadius: '8px', fontSize: '0.88rem' }}>{error}</div>}

          <button type="submit" disabled={loading}
            style={{ background: '#1a56db', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '0.5rem' }}>
            {loading ? 'Oppretter konto...' : 'Opprett konto'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
          Har du allerede konto?{' '}
          <Link href="/auth/login" style={{ color: '#1a56db', fontWeight: '600', textDecoration: 'none' }}>Logg inn</Link>
        </p>
      </div>
    </div>
  )
}
