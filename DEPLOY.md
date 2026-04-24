# Arbeidsnorsk – Deploy-guide

## Forutsetninger

- Node.js 18+
- Konto på [Supabase](https://supabase.com) (gratis)
- Konto på [Vercel](https://vercel.com) (gratis)
- Google AI Studio API-nøkkel ([aistudio.google.com](https://aistudio.google.com))

---

## Steg 1: Supabase-oppsett

### 1a. Opprett prosjekt
1. Gå til [supabase.com](https://supabase.com) → New project
2. Velg navn, passord og region (EU West anbefalt)

### 1b. Kjør database-schema
1. Gå til **SQL Editor** i Supabase-dashboardet
2. Lim inn innholdet fra `lib/supabase/schema.sql`
3. Klikk **Run**

### 1c. Opprett Storage-buckets
Gå til **Storage** → New bucket, opprett disse tre:

| Bucket | Public |
|--------|--------|
| `company-documents` | Nei (private) |
| `company-logos` | Ja (public) |
| `generated-outputs` | Nei (private) |

### 1d. Hent API-nøkler
Gå til **Settings → API** og noter:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

---

## Steg 2: Google Gemini API-nøkkel

1. Gå til [aistudio.google.com](https://aistudio.google.com)
2. Klikk **Get API key** → Create API key
3. Kopier nøkkelen → `GEMINI_API_KEY`

---

## Steg 3: Lokal utvikling

```bash
# Klon/unzip prosjektet
cd arbeidsnorsk
npm install

# Kopier og fyll inn miljøvariabler
cp .env.local.example .env.local
# Rediger .env.local med dine nøkler

# Start lokalt
npm run dev
# Åpne http://localhost:3000
```

---

## Steg 4: Deploy til Vercel

### Alternativ A: Via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel deploy --prod
```

### Alternativ B: Via GitHub
1. Push koden til GitHub
2. Gå til [vercel.com](https://vercel.com) → Import Project
3. Velg ditt GitHub-repo
4. Legg til miljøvariablene (se under)
5. Klikk **Deploy**

### Miljøvariabler i Vercel
Gå til **Project Settings → Environment Variables** og legg til:

| Variabel | Verdi |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Fra Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Fra Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Fra Supabase |
| `GEMINI_API_KEY` | Fra Google AI Studio |

---

## Steg 5: Supabase Auth – tillat din domene

1. Gå til **Authentication → URL Configuration** i Supabase
2. Legg til din Vercel-URL under **Site URL**, f.eks. `https://arbeidsnorsk.vercel.app`
3. Legg til under **Redirect URLs**: `https://arbeidsnorsk.vercel.app/**`

---

## Timeouts (vercel.json)

`vercel.json` er allerede konfigurert med:
- Gemini-generering: 120 sekunder (store dokumenter kan ta tid)
- DOCX/PPTX-eksport: 60 sekunder
- Scraping: 30 sekunder

Vercel Pro-plan støtter opptil 300 sekunder. Gratis plan er begrenset til 60 sekunder – ved bruk av gratis plan, reduser `maxDuration` for generate til 60.

---

## Feilsøking

### "Supabase URL and API key are required"
→ Miljøvariabler mangler i `.env.local` eller Vercel-innstillinger

### Gemini timeout / "overloaded"
→ Appen prøver automatisk 3 ganger med exponential backoff. Hvis det fortsatt feiler, prøv et kortere dokument eller færre temaer.

### Storage-opplasting feiler
→ Sjekk at bucket-navnene er nøyaktig `company-documents`, `company-logos`, `generated-outputs`
→ Sjekk at RLS-policies er kjørt (de er i schema.sql)

### PPTX/DOCX åpnes ikke i Office
→ Filene er gyldige OOXML. Prøv å høyreklikk → Åpne med → Word/PowerPoint
