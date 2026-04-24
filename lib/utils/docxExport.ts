import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  PageBreak,
  LevelFormat,
} from 'docx'
import type { GeneratedContent, DesignProfile } from '@/types'

// DXA helpers (A4 with 2.5cm margins = ~9000 DXA content width)
const PAGE_W = 11906
const MARGIN = 1418 // ~2.5cm
const CONTENT_W = PAGE_W - MARGIN * 2 // ~9070

function hexToDocxColor(hex: string): string {
  return hex.replace('#', '').toUpperCase()
}

function makeShading(color: string) {
  return { fill: hexToDocxColor(color), type: ShadingType.CLEAR }
}

function cellBorder(color: string) {
  const b = { style: BorderStyle.SINGLE, size: 4, color: hexToDocxColor(color) }
  return { top: b, bottom: b, left: b, right: b }
}

function headerBox(text: string, primaryColor: string): Table {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorder(primaryColor),
            shading: makeShading(primaryColor),
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            width: { size: CONTENT_W, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({ text, bold: true, size: 28, color: 'FFFFFF', font: 'Arial' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

function coloredBox(text: string, bgColor: string, textColor = '1e293b'): Table {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorder(bgColor),
            shading: makeShading(bgColor),
            margins: { top: 100, bottom: 100, left: 200, right: 200 },
            width: { size: CONTENT_W, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text, size: 22, color: hexToDocxColor(textColor), font: 'Arial' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

function sectionHeading(text: string, primaryColor: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: hexToDocxColor(primaryColor), space: 1 },
    },
    children: [
      new TextRun({ text, bold: true, size: 26, color: hexToDocxColor(primaryColor), font: 'Arial' }),
    ],
  })
}

function emptyLine(): Paragraph {
  return new Paragraph({ children: [new TextRun({ text: '', size: 22 })] })
}

function wordlistTable(words: { norwegian: string; translation: string; explanation: string }[], design: DesignProfile): Table {
  const headerColor = hexToDocxColor(design.primaryColor)
  const rowBg = hexToDocxColor(design.secondaryColor)
  const border = { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' }
  const borders = { top: border, bottom: border, left: border, right: border }
  const colW = [Math.floor(CONTENT_W / 3), Math.floor(CONTENT_W / 3), CONTENT_W - Math.floor(CONTENT_W / 3) * 2]

  const headerRow = new TableRow({
    tableHeader: true,
    children: ['Norsk', 'Oversettelse', 'Forklaring'].map((h, i) =>
      new TableCell({
        borders,
        shading: makeShading(design.primaryColor),
        width: { size: colW[i], type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 20, font: 'Arial' })] })],
      })
    ),
  })

  const dataRows = words.map((w, idx) =>
    new TableRow({
      children: [w.norwegian, w.translation, w.explanation].map((cell, i) =>
        new TableCell({
          borders,
          shading: idx % 2 === 0 ? makeShading(design.secondaryColor) : { fill: 'FFFFFF', type: ShadingType.CLEAR },
          width: { size: colW[i], type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20, font: 'Arial', bold: i === 0 })] })],
        })
      ),
    })
  )

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: colW,
    rows: [headerRow, ...dataRows],
  })
}

export async function generateDocx(content: GeneratedContent, design: DesignProfile): Promise<Buffer> {
  const { fagTekster, oppgaver, wordList, company, level, motherTongue } = content
  const primary = design.primaryColor
  const secondary = design.secondaryColor
  const accent = design.accentColor

  const children: (Paragraph | Table)[] = []

  // ── TOPPSIDE ──
  children.push(
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [CONTENT_W],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorder(primary),
              shading: makeShading(primary),
              margins: { top: 180, bottom: 180, left: 280, right: 280 },
              width: { size: CONTENT_W, type: WidthType.DXA },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: company.name, bold: true, size: 40, color: 'FFFFFF', font: 'Arial' })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `Norskopplæring på arbeidsplassen · Nivå ${level}`, size: 24, color: 'FFFFFF', font: 'Arial' })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `Morsmål: ${motherTongue}`, size: 20, color: 'DDDDFF', font: 'Arial', italics: true })],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  )

  children.push(emptyLine())

  // Navn/dato felt
  children.push(
    new Paragraph({
      spacing: { before: 160 },
      children: [
        new TextRun({ text: 'Navn: ', bold: true, size: 22, font: 'Arial' }),
        new TextRun({ text: '_____________________________   ', size: 22, font: 'Arial' }),
        new TextRun({ text: 'Dato: ', bold: true, size: 22, font: 'Arial' }),
        new TextRun({ text: '______________', size: 22, font: 'Arial' }),
      ],
    })
  )

  children.push(emptyLine())

  // ── ORDLISTE ──
  children.push(sectionHeading('📖 Ordliste / Vocabulary', primary))
  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: `Lær disse ordene. Oversettelse til ${motherTongue}.`, size: 20, italics: true, color: '64748b', font: 'Arial' })],
    })
  )
  children.push(wordlistTable(wordList, design))
  children.push(emptyLine())
  children.push(emptyLine())

  // ── FAGTEKSTER MED OPPGAVER ──
  fagTekster.forEach((tekst, tIdx) => {
    // Sideskillle etter første seksjon
    if (tIdx > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }))
    }

    // Fagtekst header
    children.push(headerBox(`Fagtekst ${tIdx + 1}: ${tekst.title}`, primary))
    children.push(emptyLine())

    // Tekst body
    const paragraphs = tekst.content.split('\n').filter(Boolean)
    paragraphs.forEach((para) => {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: para, size: 22, font: 'Arial' })],
        })
      )
    })

    // Inline vocabulary for this text
    if (tekst.vocabulary.length > 0) {
      children.push(emptyLine())
      children.push(sectionHeading('🔑 Nøkkelord i teksten', accent))
      tekst.vocabulary.forEach((v) => {
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            numbering: { reference: 'bullets', level: 0 },
            children: [
              new TextRun({ text: `${v.norwegian}`, bold: true, size: 20, font: 'Arial' }),
              new TextRun({ text: ` → ${v.translation}`, size: 20, italics: true, color: '64748b', font: 'Arial' }),
              new TextRun({ text: `   (${v.explanation})`, size: 20, color: '94a3b8', font: 'Arial' }),
            ],
          })
        )
      })
    }

    children.push(emptyLine())

    // Oppgaver
    const tekOppgaver = oppgaver[tIdx] || []
    if (tekOppgaver.length > 0) {
      children.push(sectionHeading(`✏️ Oppgaver til Fagtekst ${tIdx + 1}`, primary))

      tekOppgaver.forEach((oppgave) => {
        // Oppgavenummer og tittel
        children.push(
          new Paragraph({
            spacing: { before: 240, after: 80 },
            children: [
              new TextRun({ text: `Oppgave ${oppgave.number}: `, bold: true, size: 24, color: hexToDocxColor(primary), font: 'Arial' }),
              new TextRun({ text: oppgave.title.replace(`Oppgave ${oppgave.number}: `, ''), bold: true, size: 24, font: 'Arial' }),
            ],
          })
        )

        children.push(
          new Paragraph({
            spacing: { after: 120 },
            children: [new TextRun({ text: oppgave.instruction, size: 20, italics: true, color: '64748b', font: 'Arial' })],
          })
        )

        // Deloppgaver
        oppgave.subTasks.forEach((sub) => {
          children.push(
            new Paragraph({
              spacing: { before: 120, after: 60 },
              children: [
                new TextRun({ text: `${sub.letter}) `, bold: true, size: 22, color: hexToDocxColor(accent), font: 'Arial' }),
                new TextRun({ text: sub.question, size: 22, font: 'Arial' }),
              ],
            })
          )

          // Options for multiple choice
          if (sub.options && sub.options.length > 0) {
            sub.options.forEach((opt, oi) => {
              children.push(
                new Paragraph({
                  spacing: { after: 40 },
                  indent: { left: 720 },
                  children: [
                    new TextRun({ text: `${['A', 'B', 'C', 'D'][oi]}. ${opt}`, size: 20, font: 'Arial' }),
                  ],
                })
              )
            })
          }

          // Answer blank for fill-in or short answer
          if (!sub.options || sub.options.length === 0) {
            children.push(
              new Paragraph({
                spacing: { after: 60 },
                indent: { left: 360 },
                children: [
                  new TextRun({ text: 'Svar: _______________________________________________', size: 20, color: 'BBBBBB', font: 'Arial' }),
                ],
              })
            )
          }
        })

        children.push(emptyLine())
      })
    }
  })

  // ── FASIT ──
  children.push(new Paragraph({ children: [new PageBreak()] }))
  children.push(
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [CONTENT_W],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorder('#374151'),
              shading: makeShading('#374151'),
              margins: { top: 100, bottom: 100, left: 200, right: 200 },
              width: { size: CONTENT_W, type: WidthType.DXA },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'FASIT', bold: true, size: 30, color: 'FFFFFF', font: 'Arial' })],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  )

  children.push(emptyLine())

  // Generate answer key
  fagTekster.forEach((_, tIdx) => {
    const tekOppgaver = oppgaver[tIdx] || []
    if (tekOppgaver.length === 0) return

    children.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: `Fagtekst ${tIdx + 1}`, bold: true, size: 22, color: hexToDocxColor(primary), font: 'Arial' })],
      })
    )

    tekOppgaver.forEach((oppgave) => {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [new TextRun({ text: `Oppgave ${oppgave.number}:`, bold: true, size: 20, font: 'Arial' })],
        })
      )
      oppgave.subTasks.forEach((sub) => {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            indent: { left: 360 },
            children: [
              new TextRun({ text: `${sub.letter}) `, bold: true, size: 20, color: hexToDocxColor(accent), font: 'Arial' }),
              new TextRun({ text: sub.answer, size: 20, font: 'Arial' }),
            ],
          })
        )
      })
    })
  })

  // Build document
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 22 } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: 16838 },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        children,
      },
    ],
  })

  return await Packer.toBuffer(doc)
}
