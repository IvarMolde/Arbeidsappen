import PptxGenJS from 'pptxgenjs'
import type { GeneratedContent, DesignProfile } from '@/types'

function hex(color: string): string {
  return color.replace('#', '').toUpperCase()
}

export async function generatePptx(content: GeneratedContent, design: DesignProfile): Promise<Buffer> {
  const { fagTekster, wordList, company, level, motherTongue, pptSlides } = content
  const primary = hex(design.primaryColor)
  const secondary = hex(design.secondaryColor)
  const accent = hex(design.accentColor)
  const white = 'FFFFFF'
  const dark = '1E293B'
  const muted = '64748B'

  const pres = new PptxGenJS()
  pres.layout = 'LAYOUT_16x9'
  pres.title = `${company.name} – Norskopplæring Nivå ${level}`
  pres.author = 'Arbeidsnorsk'

  // ── SLIDE 1: TITTELSIDE ──
  const slide1 = pres.addSlide()
  slide1.background = { color: primary }

  // Large circle decoration
  slide1.addShape(pres.ShapeType.ellipse, {
    x: 7.5, y: -1.2, w: 5, h: 5,
    fill: { color: hex(design.accentColor), transparency: 80 },
    line: { color: hex(design.accentColor), transparency: 80 },
  })
  slide1.addShape(pres.ShapeType.ellipse, {
    x: -1.5, y: 2.5, w: 3.5, h: 3.5,
    fill: { color: white, transparency: 90 },
    line: { color: white, transparency: 90 },
  })

  // Company name
  slide1.addText(company.name.toUpperCase(), {
    x: 0.6, y: 0.8, w: 8.8, h: 0.7,
    fontSize: 14, bold: true, color: accent, fontFace: 'Calibri',
    charSpacing: 4,
  })

  // Title
  slide1.addText('Norskopplæring\npå arbeidsplassen', {
    x: 0.6, y: 1.5, w: 7, h: 2.2,
    fontSize: 44, bold: true, color: white, fontFace: 'Calibri Light',
  })

  // Level badge
  slide1.addShape(pres.ShapeType.roundRect, {
    x: 0.6, y: 3.9, w: 1.4, h: 0.55,
    fill: { color: accent },
    line: { color: accent },
    rectRadius: 0.1,
  })
  slide1.addText(`Nivå ${level}`, {
    x: 0.6, y: 3.9, w: 1.4, h: 0.55,
    fontSize: 16, bold: true, color: dark, fontFace: 'Calibri', align: 'center', margin: 0,
  })

  slide1.addText(`Morsmål: ${motherTongue}`, {
    x: 0.6, y: 4.6, w: 8, h: 0.4,
    fontSize: 13, color: white, fontFace: 'Calibri', italic: true,
  })

  // CEFR badge
  slide1.addText('CEFR', {
    x: 8.5, y: 4.6, w: 1.3, h: 0.4,
    fontSize: 11, color: white, fontFace: 'Calibri', align: 'right', italic: true,
  })

  // Speaker notes
  slide1.addNotes(`Tittelside for ${company.name}. Nivå ${level}. \nPresenter deg selv og introduser formålet med opplæringen.\nSpør deltakerne: Hva forventer du å lære i dag?`)

  // ── SLIDE 2: LÆRINGSMÅL ──
  const slide2 = pres.addSlide()
  slide2.background = { color: 'F8FAFC' }

  // Left accent bar
  slide2.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 0.12, h: 5.625,
    fill: { color: primary },
    line: { color: primary },
  })

  slide2.addText('Læringsmål', {
    x: 0.4, y: 0.35, w: 9, h: 0.65,
    fontSize: 30, bold: true, color: primary, fontFace: 'Calibri',
  })
  slide2.addShape(pres.ShapeType.line, {
    x: 0.4, y: 1.05, w: 9.2, h: 0,
    line: { color: secondary, width: 2 },
  })

  const levelGoals: Record<string, string[]> = {
    A1: [
      'Forstå og bruke enkle fagord fra arbeidsplassen',
      'Lese og forstå korte instrukser og beskjeder',
      'Svare på enkle spørsmål om deg selv og jobben din',
      'Kjenne til grunnleggende HMS-ord og -symboler',
    ],
    A2: [
      'Forstå og følge enkle arbeidsinstrukser',
      'Kommunisere med kolleger om hverdagslige arbeidsoppgaver',
      'Lese og fylle ut enkle skjemaer på arbeidsplassen',
      'Forstå HMS-regler og rapportere enkle avvik',
    ],
    B1: [
      'Forstå og forklare arbeidsprosedyrer selvstendig',
      'Delta i møter og samtaler om kjente arbeidsemner',
      'Lese og forstå relevante deler av fagmanualer og HMS-håndbøker',
      'Skrive enkle rapporter og beskjeder om arbeidsrelaterte temaer',
    ],
  }

  const goals = levelGoals[level] || levelGoals['A2']
  goals.forEach((goal, i) => {
    const yPos = 1.3 + i * 0.85

    slide2.addShape(pres.ShapeType.ellipse, {
      x: 0.4, y: yPos + 0.08, w: 0.38, h: 0.38,
      fill: { color: primary },
      line: { color: primary },
    })
    slide2.addText(`${i + 1}`, {
      x: 0.4, y: yPos + 0.08, w: 0.38, h: 0.38,
      fontSize: 13, bold: true, color: white, fontFace: 'Calibri', align: 'center', margin: 0,
    })
    slide2.addText(goal, {
      x: 0.95, y: yPos, w: 8.65, h: 0.55,
      fontSize: 15, color: dark, fontFace: 'Calibri',
    })
  })

  slide2.addNotes(`Gå gjennom læringsmålene med deltakerne.\nSørg for at de forstår hva de skal lære.\nDu kan spørre: "Kan du allerede noe av dette?"`)

  // ── SLIDE 3: ORDLISTE (delt i grupper av 8) ──
  const wordChunks: typeof wordList[] = []
  for (let i = 0; i < Math.min(wordList.length, 24); i += 8) {
    wordChunks.push(wordList.slice(i, i + 8))
  }

  wordChunks.forEach((chunk, chunkIdx) => {
    const wSlide = pres.addSlide()
    wSlide.background = { color: 'F8FAFC' }

    wSlide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 1.1,
      fill: { color: secondary },
      line: { color: secondary },
    })
    wSlide.addText(`📖  Ordliste${wordChunks.length > 1 ? ` (${chunkIdx + 1}/${wordChunks.length})` : ''}`, {
      x: 0.4, y: 0.2, w: 9, h: 0.65,
      fontSize: 26, bold: true, color: primary, fontFace: 'Calibri',
    })

    const col1 = chunk.slice(0, Math.ceil(chunk.length / 2))
    const col2 = chunk.slice(Math.ceil(chunk.length / 2))

    const renderCol = (words: typeof chunk, xStart: number) => {
      words.forEach((w, i) => {
        const yPos = 1.3 + i * 0.55
        wSlide.addShape(pres.ShapeType.rect, {
          x: xStart, y: yPos, w: 4.4, h: 0.48,
          fill: { color: i % 2 === 0 ? white : 'F1F5F9' },
          line: { color: 'E2E8F0', width: 0.5 },
          shadow: { type: 'outer', blur: 3, offset: 1, angle: 135, color: '000000', opacity: 0.06 },
        })
        wSlide.addText(w.norwegian, {
          x: xStart + 0.1, y: yPos + 0.03, w: 1.8, h: 0.4,
          fontSize: 13, bold: true, color: primary, fontFace: 'Calibri', margin: 4,
        })
        wSlide.addText(w.translation, {
          x: xStart + 1.95, y: yPos + 0.03, w: 1.5, h: 0.4,
          fontSize: 12, italic: true, color: muted, fontFace: 'Calibri', margin: 4,
        })
        wSlide.addText(w.explanation, {
          x: xStart + 3.5, y: yPos + 0.03, w: 0.9, h: 0.4,
          fontSize: 9, color: 'CBD5E1', fontFace: 'Calibri', margin: 4,
        })
      })
    }

    renderCol(col1, 0.2)
    renderCol(col2, 5.1)

    wSlide.addNotes(`Gå gjennom ordene med deltakerne. Pek på bildene eller gjenstander dersom mulig.\nBe deltakerne gjenta ordene. Bruk setningsstarter: "På jobben min bruker jeg..."\nSpør: "Kjenner du dette ordet fra før?"`)
  })

  // ── FAGTEKST-SLIDES ──
  fagTekster.forEach((tekst, tIdx) => {
    const fSlide = pres.addSlide()
    fSlide.background = { color: 'FFFFFF' }

    // Header bar
    fSlide.addShape(pres.ShapeType.rect, {
      x: 0, y: 0, w: 10, h: 1.15,
      fill: { color: primary },
      line: { color: primary },
    })
    fSlide.addText(`Fagtekst ${tIdx + 1}`, {
      x: 0.4, y: 0.05, w: 9, h: 0.45,
      fontSize: 11, color: white, fontFace: 'Calibri', italic: true,
      transparency: 30,
    })
    fSlide.addText(tekst.title, {
      x: 0.4, y: 0.45, w: 9, h: 0.6,
      fontSize: 24, bold: true, color: white, fontFace: 'Calibri',
    })

    // Text content (truncated for slide)
    const slideText = tekst.content.length > 500 ? tekst.content.slice(0, 500) + '...' : tekst.content
    fSlide.addText(slideText, {
      x: 0.4, y: 1.3, w: 5.8, h: 3.7,
      fontSize: 13, color: dark, fontFace: 'Calibri', valign: 'top',
    })

    // Key words panel on right
    if (tekst.vocabulary.length > 0) {
      fSlide.addShape(pres.ShapeType.rect, {
        x: 6.5, y: 1.2, w: 3.3, h: 3.9,
        fill: { color: secondary },
        line: { color: secondary },
      })
      fSlide.addText('🔑 Nøkkelord', {
        x: 6.6, y: 1.3, w: 3.1, h: 0.45,
        fontSize: 13, bold: true, color: primary, fontFace: 'Calibri',
      })

      tekst.vocabulary.slice(0, 6).forEach((v, vi) => {
        const yv = 1.85 + vi * 0.52
        fSlide.addText(v.norwegian, {
          x: 6.6, y: yv, w: 3.1, h: 0.28,
          fontSize: 12, bold: true, color: primary, fontFace: 'Calibri',
        })
        fSlide.addText(`→ ${v.translation}`, {
          x: 6.6, y: yv + 0.26, w: 3.1, h: 0.22,
          fontSize: 10, italic: true, color: muted, fontFace: 'Calibri',
        })
      })
    }

    fSlide.addNotes(`Fagtekst ${tIdx + 1}: ${tekst.title}\n\nLes teksten høyt for deltakeren, eller be dem lese stille.\nEtter lesing: Hva handlet teksten om? Kan du fortelle med egne ord?\n\nFokus på nøkkelordene i høyre kolonne.`)
  })

  // ── HMS-SLIDE (alltid inkludert) ──
  const hmsSlide = pres.addSlide()
  hmsSlide.background = { color: 'FFFBEB' }

  hmsSlide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 1.1,
    fill: { color: accent },
    line: { color: accent },
  })
  hmsSlide.addText('⚠️  HMS – Helse, Miljø og Sikkerhet', {
    x: 0.4, y: 0.2, w: 9, h: 0.65,
    fontSize: 24, bold: true, color: dark, fontFace: 'Calibri',
  })

  const hmsPoints = [
    ['Verneutstyr', 'Bruk alltid riktig verneutstyr på jobben'],
    ['Meld fra', 'Si ifra til leder om farlige situasjoner'],
    ['Rømningsveier', 'Kjenn rømningsveiene på arbeidsplassen'],
    ['Pauser', 'Ta pauser – det forebygger skader'],
  ]

  hmsPoints.forEach(([title, desc], i) => {
    const yPos = 1.4 + i * 0.95
    hmsSlide.addShape(pres.ShapeType.rect, {
      x: 0.4, y: yPos, w: 9.2, h: 0.82,
      fill: { color: i % 2 === 0 ? 'FFFEF0' : 'FFFFFF' },
      line: { color: 'FDE68A', width: 0.5 },
    })
    hmsSlide.addShape(pres.ShapeType.rect, {
      x: 0.4, y: yPos, w: 0.08, h: 0.82,
      fill: { color: accent },
      line: { color: accent },
    })
    hmsSlide.addText(title, {
      x: 0.65, y: yPos + 0.08, w: 2.5, h: 0.35,
      fontSize: 14, bold: true, color: dark, fontFace: 'Calibri',
    })
    hmsSlide.addText(desc, {
      x: 0.65, y: yPos + 0.42, w: 8.8, h: 0.32,
      fontSize: 12, color: muted, fontFace: 'Calibri',
    })
  })

  hmsSlide.addNotes('Gå gjennom HMS-punktene. Spør deltakeren: "Vet du hvor brannslukningsapparatet er? Vet du hva du skal gjøre ved brann?"\nBruk gjerne bilder eller vis rundt på arbeidsplassen.')

  // ── SAMTALEØVELSE-SLIDE ──
  const talkSlide = pres.addSlide()
  talkSlide.background = { color: 'F8FAFC' }

  talkSlide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 1.1,
    fill: { color: primary },
    line: { color: primary },
  })
  talkSlide.addText('🗣  Samtaleøvelse', {
    x: 0.4, y: 0.22, w: 9, h: 0.65,
    fontSize: 28, bold: true, color: white, fontFace: 'Calibri',
  })

  const talkPrompts = [
    'Beskriv en typisk arbeidsdag. Hva gjør du fra du kommer til du drar?',
    `Forklar en kollega hva ${fagTekster[0]?.title || 'en viktig arbeidsoppgave'} betyr.`,
    'Hva gjør du hvis du ser noe farlig på arbeidsplassen?',
    'Hvordan spør du en kollega om hjelp på norsk?',
  ]

  talkSlide.addShape(pres.ShapeType.rect, {
    x: 0.3, y: 1.2, w: 9.4, h: 3.9,
    fill: { color: 'FFFFF5' },
    line: { color: accent, width: 1.5 },
  })

  talkPrompts.forEach((prompt, i) => {
    const yPos = 1.4 + i * 0.85
    talkSlide.addShape(pres.ShapeType.ellipse, {
      x: 0.5, y: yPos + 0.06, w: 0.4, h: 0.4,
      fill: { color: accent },
      line: { color: accent },
    })
    talkSlide.addText(`${i + 1}`, {
      x: 0.5, y: yPos + 0.06, w: 0.4, h: 0.4,
      fontSize: 13, bold: true, color: dark, fontFace: 'Calibri', align: 'center', margin: 0,
    })
    talkSlide.addText(prompt, {
      x: 1.1, y: yPos, w: 8.4, h: 0.55,
      fontSize: 14, color: dark, fontFace: 'Calibri',
    })
  })

  talkSlide.addNotes('Samtaleøvelse: Bruk disse spørsmålene som utgangspunkt for samtale.\nLa deltakeren snakke fritt. Rett ikke alle feil – fokuser på kommunikasjon.\nEksempel: "Du sa det bra! Kan du prøve en gang til med dette ordet?"')

  // ── OPPSUMMERING ──
  const sumSlide = pres.addSlide()
  sumSlide.background = { color: primary }

  sumSlide.addShape(pres.ShapeType.ellipse, {
    x: 7.5, y: -1, w: 5, h: 5,
    fill: { color: white, transparency: 92 },
    line: { color: white, transparency: 92 },
  })

  sumSlide.addText('Oppsummering', {
    x: 0.6, y: 0.6, w: 8, h: 0.7,
    fontSize: 32, bold: true, color: white, fontFace: 'Calibri',
  })

  sumSlide.addText('I dag har vi lært:', {
    x: 0.6, y: 1.45, w: 8, h: 0.45,
    fontSize: 16, color: white, italic: true, fontFace: 'Calibri',
    transparency: 20,
  })

  const summaryItems = [
    `${wordList.length} nye fagord og uttrykk`,
    `${fagTekster.length} fagtekster om ${company.name}`,
    `Viktige HMS-regler på arbeidsplassen`,
    `Samtaleøvelser på norsk`,
  ]

  summaryItems.forEach((item, i) => {
    const yPos = 2.0 + i * 0.7
    sumSlide.addShape(pres.ShapeType.ellipse, {
      x: 0.6, y: yPos + 0.1, w: 0.35, h: 0.35,
      fill: { color: accent },
      line: { color: accent },
    })
    sumSlide.addText(item, {
      x: 1.1, y: yPos, w: 8, h: 0.55,
      fontSize: 15, color: white, fontFace: 'Calibri',
    })
  })

  sumSlide.addText(`Neste gang: Fortsett på nivå ${level}`, {
    x: 0.6, y: 5.1, w: 9, h: 0.38,
    fontSize: 13, italic: true, color: accent, fontFace: 'Calibri',
  })

  sumSlide.addNotes('Oppsummeringsslide.\nSpør deltakerne: "Hva lærte du i dag? Hva var vanskelig? Hva vil du øve mer på?"\nAvtal hva som skal øves til neste gang.')

  // Write to buffer
  const buffer = await pres.write({ outputType: 'nodebuffer' }) as Buffer
  return buffer
}
