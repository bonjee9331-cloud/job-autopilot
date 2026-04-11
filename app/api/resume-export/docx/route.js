import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

export async function POST(req) {
  try {
    const body = await req.json();
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: body.name || 'Ben Lynch', bold: true, size: 32 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: [body.email, body.phone, body.location, body.linkedin].filter(Boolean).join(' | '), size: 20 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 220 }, children: [new TextRun({ text: body.headline || '', bold: true, size: 22 })] }),
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Professional Summary')] }),
          new Paragraph({ children: [new TextRun(body.professionalSummary || '')] }),
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Key Skills')] }),
          ...(body.keySkills || []).map((skill) => new Paragraph({ bullet: { level: 0 }, children: [new TextRun(String(skill))] })),
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Selected Experience Highlights')] }),
          ...(body.experienceBullets || []).map((bullet) => new Paragraph({ bullet: { level: 0 }, children: [new TextRun(String(bullet))] }))
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Ben_Lynch_Resume.docx"'
      }
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Failed to generate DOCX' }, { status: 500 });
  }
}
