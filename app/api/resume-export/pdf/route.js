import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

function wrapText(text, maxChars = 95) {
  const words = String(text || '').split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let y = 800;
    const left = 50;
    const draw = (text, x, size = 11, bold = false, color = rgb(0.08, 0.11, 0.2)) => {
      page.drawText(String(text || ''), { x, y, size, font: bold ? fontBold : font, color });
      y -= size + 6;
    };
    const section = (title) => { y -= 8; draw(title, left, 14, true, rgb(0.13, 0.28, 0.8)); y -= 4; };
    const bulletList = (items) => {
      for (const item of items || []) {
        const lines = wrapText(item, 88);
        if (lines[0]) draw(`• ${lines[0]}`, left, 11, false);
        for (let i = 1; i < lines.length; i++) draw(lines[i], left + 12, 11, false);
      }
      y -= 4;
    };
    page.drawText(body.name || 'Ben Lynch', { x: left, y, size: 22, font: fontBold, color: rgb(0.05, 0.1, 0.2) });
    y -= 28;
    draw([body.email, body.phone, body.location, body.linkedin].filter(Boolean).join(' | '), left, 10, false, rgb(0.3, 0.34, 0.45));
    y -= 8; draw(body.headline || '', left, 13, true, rgb(0.13, 0.28, 0.8));
    section('Professional Summary');
    for (const line of wrapText(body.professionalSummary || '')) draw(line, left, 11, false);
    section('Key Skills'); bulletList(body.keySkills || []);
    section('Selected Experience Highlights'); bulletList(body.experienceBullets || []);
    const bytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Ben_Lynch_Resume.pdf"'
      }
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Failed to generate PDF' }, { status: 500 });
  }
}
