import { NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType
} from "docx";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      phone,
      location,
      linkedin,
      headline,
      professionalSummary,
      keySkills,
      experienceBullets
    } = body;

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: name || "Ben Lynch",
                  bold: true,
                  size: 32
                })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: [
                    email || "",
                    phone || "",
                    location || "",
                    linkedin || ""
                  ]
                    .filter(Boolean)
                    .join(" | "),
                  size: 20
                })
              ]
            }),
            new Paragraph({
              spacing: { after: 220 },
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: headline || "",
                  bold: true,
                  size: 22
                })
              ]
            }),

            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun("Professional Summary")]
            }),
            new Paragraph({
              children: [new TextRun(professionalSummary || "")]
            }),

            new Paragraph({
              spacing: { before: 220 },
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun("Key Skills")]
            }),
            ...(Array.isArray(keySkills) ? keySkills : []).map(
              (skill) =>
                new Paragraph({
                  bullet: { level: 0 },
                  children: [new TextRun(String(skill))]
                })
            ),

            new Paragraph({
              spacing: { before: 220 },
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun("Selected Experience Highlights")]
            }),
            ...(Array.isArray(experienceBullets) ? experienceBullets : []).map(
              (bullet) =>
                new Paragraph({
                  bullet: { level: 0 },
                  children: [new TextRun(String(bullet))]
                })
            )
          ]
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="Ben_Lynch_Resume.docx"'
      }
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Failed to generate DOCX"
      },
      { status: 500 }
    );
  }
}
