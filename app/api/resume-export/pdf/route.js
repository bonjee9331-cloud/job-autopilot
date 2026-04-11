import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function wrapText(text, maxChars = 95) {
  const words = String(text || "").split(" ");
  const lines = [];
  let current = "";

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

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    const left = 50;

    function drawLine(text, x, size = 11, bold = false, color = rgb(0.08, 0.11, 0.2)) {
      page.drawText(String(text || ""), {
        x,
        y,
        size,
        font: bold ? fontBold : font,
        color
      });
      y -= size + 6;
    }

    function drawSectionTitle(title) {
      y -= 8;
      drawLine(title, left, 14, true, rgb(0.13, 0.28, 0.8));
      y -= 2;
    }

    function drawWrappedParagraph(text, size = 11) {
      const lines = wrapText(text, 95);
      for (const line of lines) {
        drawLine(line, left, size, false, rgb(0.08, 0.11, 0.2));
      }
      y -= 4;
    }

    function drawBullets(items) {
      for (const item of items || []) {
        const lines = wrapText(item, 88);
        if (lines.length > 0) {
          drawLine(`• ${lines[0]}`, left, 11, false, rgb(0.08, 0.11, 0.2));
          for (let i = 1; i < lines.length; i++) {
            drawLine(lines[i], left + 14, 11, false, rgb(0.08, 0.11, 0.2));
          }
        }
      }
      y -= 4;
    }

    page.drawText(name || "Ben Lynch", {
      x: left,
      y,
      size: 22,
      font: fontBold,
      color: rgb(0.05, 0.1, 0.2)
    });
    y -= 28;

    drawLine(
      [email || "", phone || "", location || "", linkedin || ""]
        .filter(Boolean)
        .join(" | "),
      left,
      10,
      false,
      rgb(0.3, 0.34, 0.45)
    );

    y -= 8;
    drawLine(headline || "", left, 13, true, rgb(0.13, 0.28, 0.8));

    drawSectionTitle("Professional Summary");
    drawWrappedParagraph(professionalSummary || "");

    drawSectionTitle("Key Skills");
    drawBullets(Array.isArray(keySkills) ? keySkills : []);

    drawSectionTitle("Selected Experience Highlights");
    drawBullets(Array.isArray(experienceBullets) ? experienceBullets : []);

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Ben_Lynch_Resume.pdf"'
      }
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Failed to generate PDF"
      },
      { status: 500 }
    );
  }
}
