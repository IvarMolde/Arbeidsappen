import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import mammoth from 'mammoth'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const companyId = formData.get('companyId') as string
  const documentType = (formData.get('documentType') as string) || 'other'

  if (!file || !companyId) {
    return NextResponse.json({ error: 'File and companyId required' }, { status: 400 })
  }

  // Verify ownership
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('user_id', user.id)
    .single()

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Extract text based on file type
  let extractedText = ''
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'docx') {
    try {
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } catch {
      extractedText = ''
    }
  } else if (ext === 'txt') {
    extractedText = new TextDecoder('utf-8').decode(bytes)
  } else if (ext === 'pdf') {
    // PDF text extraction – basic approach (full PDFjs would need browser)
    // We store the file and note it as PDF; Gemini handles PDFs natively
    extractedText = '[PDF – innhold leses av AI]'
  }

  // Upload file to Supabase Storage
  const fileName = `${user.id}/${companyId}/${Date.now()}_${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('company-documents')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 })
  }

  const { data: urlData } = await supabase.storage
    .from('company-documents')
    .createSignedUrl(fileName, 86400 * 30) // 30 days

  // Save document record
  const { data: doc, error: dbError } = await supabase
    .from('company_documents')
    .insert({
      company_id: companyId,
      file_name: file.name,
      file_url: urlData?.signedUrl || fileName,
      file_type: ext || 'unknown',
      document_type: documentType,
      extracted_text: extractedText.slice(0, 50000), // max 50k chars
      file_size: file.size,
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: 'DB error: ' + dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, document: doc })
}
