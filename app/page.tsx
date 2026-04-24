import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1a56db 100%)' }}>
      <header style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🇳🇴</div>
          <span style={{ color: 'white', fontWeight: '800', fontSize: '1.2rem' }}>Arbeidsnorsk</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/auth/login" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: '500', padding: '0.5rem 1rem' }}>Logg inn</Link>
          <Link href="/auth/register" style={{ background: 'white', color: '#1a56db', textDecoration: 'none', fontWeight: '700', padding: '0.5rem 1.2rem', borderRadius: '8px' }}>Kom i gang</Link>
        </div>
      </header>
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', lineHeight: '1.15', marginBottom: '1.5rem' }}>
          Norskopplæring tilpasset<br />
          <span style={{ color: '#fbbf24' }}>din arbeidsplass</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: '1.7' }}>
          Generer profesjonelt norskopplæringsmateriell basert på bedriftens eget fagspråk, logo og profil. Word, PowerPoint og interaktiv HTML – presist kalibrert til CEFR A1–B1.
        </p>
        <Link href="/auth/register" style={{ display: 'inline-block', background: '#fbbf24', color: '#0f172a', textDecoration: 'none', fontWeight: '800', padding: '0.9rem 2.5rem', borderRadius: '12px', fontSize: '1.1rem' }}>
          Start gratis →
        </Link>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '4rem' }}>
          {[
            { icon: '🏢', title: 'Bedriftsprofil', desc: 'Henter logo, farger og fagtermer automatisk fra nettside' },
            { icon: '📊', title: 'CEFR-presist', desc: 'Nøyaktig kalibrert til A1, A2 og B1' },
            { icon: '📄', title: 'Word + PPT + HTML', desc: 'Tre formater generert automatisk – klar til bruk' },
            { icon: '🌍', title: 'Ordliste-oversettelse', desc: 'Fagord oversatt til deltakers morsmål av Gemini AI' },
          ].map((f, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '1.5rem', textAlign: 'left', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <div style={{ color: 'white', fontWeight: '700', marginBottom: '0.4rem' }}>{f.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
