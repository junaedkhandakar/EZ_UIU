/**
 * EZ_UIU - Cover Page PDF Generator & Merger
 * High-precision vector A4 PDF generation and seamless client-side PDF merging using pdf-lib.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { UIU_LOGO_BASE64 } from '../data/uiuLogoBase64.js';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

// Official UIU Theme Colors
const COLOR_ORANGE = rgb(0.976, 0.451, 0.086); // #f97316
const COLOR_DARK = rgb(0.07, 0.09, 0.15); // #111827
const COLOR_MUTED = rgb(0.35, 0.38, 0.44); // #5b6270
const COLOR_LIGHT_MUTED = rgb(0.55, 0.58, 0.63);
const COLOR_LINE = rgb(0.82, 0.84, 0.88);
const COLOR_LIGHT_BG = rgb(0.98, 0.98, 0.99);
const COLOR_ORANGE_TINT = rgb(0.996, 0.965, 0.94);
const COLOR_WHITE = rgb(1, 1, 1);

function formatSubDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function decodeBase64Logo() {
  const base64Data = UIU_LOGO_BASE64.replace(/^data:image\/png;base64,/, '');
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generates an A4 PDF Document for the cover page
 */
export async function generateCoverPagePdf(data) {
  const {
    template = 'classic',
    docType = 'assignment',
    docNumber = '01',
    topicTitle = '',
    submissionDate = '',
    courseCode = 'CSE 4451',
    courseTitle = 'Human Computer Interaction',
    courseSection = 'C',
    trimester = 'Fall 2026',
    facultyName = '',
    facultyDesignation = 'Professor',
    facultyDept = 'Department of Computer Science and Engineering',
    students = [],
  } = data;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // Embed Fonts
  const isTimes = template === 'classic' || template === 'elegant';
  const fontBold = await pdfDoc.embedFont(
    isTimes ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold
  );
  const fontRegular = await pdfDoc.embedFont(
    isTimes ? StandardFonts.TimesRoman : StandardFonts.Helvetica
  );
  const fontItalic = await pdfDoc.embedFont(
    isTimes ? StandardFonts.TimesRomanItalic : StandardFonts.HelveticaOblique
  );

  // Embed Official UIU Logo
  let logoImg = null;
  try {
    const logoBytes = decodeBase64Logo();
    logoImg = await pdfDoc.embedPng(logoBytes);
  } catch (err) {
    console.warn('Could not embed UIU logo in PDF', err);
  }

  const docTypeName =
    docType === 'lab'
      ? 'LAB REPORT'
      : docType === 'project'
      ? 'PROJECT REPORT'
      : 'ASSIGNMENT';

  const docNumLabel = docType === 'lab' ? 'Experiment No:' : 'Assignment No:';
  const effectiveFacultyName = facultyName?.trim() || 'Course Instructor';
  const effectiveSubmissionDate = formatSubDate(submissionDate);

  // Helper text drawing functions
  const drawTextCentered = (text, y, size, font, color) => {
    if (!text) return;
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (PAGE_WIDTH - textWidth) / 2,
      y,
      size,
      font,
      color,
    });
  };

  const drawLogo = (targetY, maxHeight = 56) => {
    if (!logoImg) return;
    const aspect = logoImg.width / logoImg.height;
    const height = Math.min(maxHeight, 60);
    const width = height * aspect;
    page.drawImage(logoImg, {
      x: (PAGE_WIDTH - width) / 2,
      y: targetY,
      width,
      height,
    });
  };

  // ================= TEMPLATE 1: CLASSIC =================
  if (template === 'classic') {
    // Logo
    drawLogo(PAGE_HEIGHT - 110, 54);

    // Document Type Banner
    drawTextCentered(docTypeName, PAGE_HEIGHT - 170, 24, fontBold, COLOR_ORANGE);

    // Course Title
    if (courseTitle || courseCode) {
      drawTextCentered(courseTitle || courseCode, PAGE_HEIGHT - 210, 16, fontBold, COLOR_DARK);
    }

    // Course Details Box
    const boxX = 110;
    let detailsY = PAGE_HEIGHT - 265;
    const lineSpacing = 20;

    const detailsList = [
      ...(courseCode ? [['Course Code:', courseCode]] : []),
      ...(courseSection ? [['Course Section:', courseSection]] : []),
      ...(docNumber ? [[docNumLabel, docNumber]] : []),
      ...(topicTitle?.trim() ? [['Topic:', topicTitle.trim()]] : []),
      ...(effectiveSubmissionDate ? [['Date of Submission:', effectiveSubmissionDate]] : []),
      ...(trimester ? [['Trimester:', trimester]] : []),
    ];

    page.drawRectangle({
      x: 90,
      y: detailsY - detailsList.length * lineSpacing - 4,
      width: PAGE_WIDTH - 180,
      height: detailsList.length * lineSpacing + 28,
      borderColor: COLOR_LINE,
      borderWidth: 1,
      color: COLOR_LIGHT_BG,
    });

    detailsY -= 4;
    detailsList.forEach(([label, val]) => {
      page.drawText(label, {
        x: boxX,
        y: detailsY,
        size: 11,
        font: fontBold,
        color: COLOR_MUTED,
      });
      page.drawText(String(val), {
        x: boxX + 130,
        y: detailsY,
        size: 11,
        font: fontBold,
        color: COLOR_DARK,
      });
      detailsY -= lineSpacing;
    });

    // Divider Line
    const dividerY = 250;
    page.drawLine({
      start: { x: 54, y: dividerY },
      end: { x: PAGE_WIDTH - 54, y: dividerY },
      thickness: 1.5,
      color: COLOR_DARK,
    });

    // Submitted By (Left Column)
    const leftColX = 54;
    page.drawText('SUBMITTED BY:', {
      x: leftColX,
      y: dividerY - 24,
      size: 12,
      font: fontBold,
      color: COLOR_ORANGE,
    });

    let studentY = dividerY - 48;
    students.forEach((st) => {
      if (st.name) {
        page.drawText(st.name, {
          x: leftColX,
          y: studentY,
          size: 11.5,
          font: fontBold,
          color: COLOR_DARK,
        });
      }
      if (st.id) {
        page.drawText(`Student ID: ${st.id}`, {
          x: leftColX,
          y: studentY - 14,
          size: 10,
          font: fontRegular,
          color: COLOR_MUTED,
        });
      }
      if (st.program) {
        page.drawText(st.program, {
          x: leftColX,
          y: studentY - 26,
          size: 9.5,
          font: fontRegular,
          color: COLOR_LIGHT_MUTED,
        });
      }
      studentY -= 42;
    });
    page.drawText('United International University', {
      x: leftColX,
      y: Math.min(studentY - 4, 70),
      size: 9.5,
      font: fontItalic,
      color: COLOR_LIGHT_MUTED,
    });

    // Submitted To (Right Column)
    const rightColX = 330;
    page.drawText('SUBMITTED TO:', {
      x: rightColX,
      y: dividerY - 24,
      size: 12,
      font: fontBold,
      color: COLOR_ORANGE,
    });

    page.drawText(effectiveFacultyName, {
      x: rightColX,
      y: dividerY - 48,
      size: 11.5,
      font: fontBold,
      color: COLOR_DARK,
    });
    page.drawText(facultyDesignation || 'Faculty', {
      x: rightColX,
      y: dividerY - 62,
      size: 10,
      font: fontRegular,
      color: COLOR_MUTED,
    });
    // Multiline department if long
    const deptLines = (facultyDept || 'Department of Computer Science and Engineering').match(
      /.{1,36}(\s|$)/g
    ) || [facultyDept];
    deptLines.forEach((l, idx) => {
      page.drawText(l.trim(), {
        x: rightColX,
        y: dividerY - 76 - idx * 12,
        size: 9.5,
        font: fontRegular,
        color: COLOR_LIGHT_MUTED,
      });
    });
    page.drawText('United International University', {
      x: rightColX,
      y: Math.min(dividerY - 80 - deptLines.length * 12, 70),
      size: 9.5,
      font: fontItalic,
      color: COLOR_LIGHT_MUTED,
    });
  }

  // ================= TEMPLATE 2: MODERN =================
  else if (template === 'modern') {
    // Top Solid Orange Header Bar
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 65,
      width: PAGE_WIDTH,
      height: 65,
      color: COLOR_ORANGE,
    });
    drawTextCentered(
      'UNITED INTERNATIONAL UNIVERSITY',
      PAGE_HEIGHT - 40,
      13,
      fontBold,
      COLOR_WHITE
    );

    // Logo
    drawLogo(PAGE_HEIGHT - 150, 52);

    // Document Title with underline
    drawTextCentered(docTypeName, PAGE_HEIGHT - 200, 22, fontBold, COLOR_ORANGE);
    page.drawLine({
      start: { x: 180, y: PAGE_HEIGHT - 208 },
      end: { x: PAGE_WIDTH - 180, y: PAGE_HEIGHT - 208 },
      thickness: 2,
      color: COLOR_ORANGE,
    });

    // Modern Centered Card
    page.drawRectangle({
      x: 70,
      y: PAGE_HEIGHT - 410,
      width: PAGE_WIDTH - 140,
      height: 180,
      borderColor: rgb(0.98, 0.75, 0.55),
      borderWidth: 1.5,
      color: COLOR_ORANGE_TINT,
    });

    if (courseTitle || courseCode) {
      drawTextCentered(courseTitle || courseCode, PAGE_HEIGHT - 250, 16, fontBold, COLOR_DARK);
    }
    const modernSubLine = [courseCode, courseSection ? `Section ${courseSection}` : '', trimester]
      .filter(Boolean)
      .join(' · ');
    if (modernSubLine) {
      drawTextCentered(modernSubLine, PAGE_HEIGHT - 275, 12, fontBold, COLOR_MUTED);
    }

    if (docNumber) {
      drawTextCentered(
        `${docNumLabel} ${docNumber}`,
        PAGE_HEIGHT - 302,
        11,
        fontRegular,
        COLOR_DARK
      );
    }
    if (topicTitle?.trim()) {
      drawTextCentered(`"${topicTitle.trim()}"`, PAGE_HEIGHT - 330, 11.5, fontItalic, COLOR_MUTED);
    }
    if (effectiveSubmissionDate) {
      drawTextCentered(
        `Date: ${effectiveSubmissionDate}`,
        PAGE_HEIGHT - 365,
        10,
        fontRegular,
        COLOR_LIGHT_MUTED
      );
    }

    // Two Bottom Boxes
    const bottomBoxY = 100;
    const boxWidth = 215;
    const boxHeight = 160;

    // Submitted By Box
    page.drawRectangle({
      x: 54,
      y: bottomBoxY,
      width: boxWidth,
      height: boxHeight,
      borderColor: COLOR_LINE,
      borderWidth: 1,
      color: COLOR_LIGHT_BG,
    });
    page.drawText('SUBMITTED BY', {
      x: 68,
      y: bottomBoxY + boxHeight - 24,
      size: 10,
      font: fontBold,
      color: COLOR_ORANGE,
    });
    let sY = bottomBoxY + boxHeight - 48;
    students.forEach((st) => {
      if (st.name) {
        page.drawText(st.name, {
          x: 68,
          y: sY,
          size: 11,
          font: fontBold,
          color: COLOR_DARK,
        });
      }
      if (st.id) {
        page.drawText(`ID: ${st.id}`, {
          x: 68,
          y: sY - 13,
          size: 9.5,
          font: fontRegular,
          color: COLOR_MUTED,
        });
      }
      sY -= 36;
    });
    page.drawText(students[0]?.program || 'B.Sc. in CSE', {
      x: 68,
      y: bottomBoxY + 14,
      size: 8.5,
      font: fontRegular,
      color: COLOR_LIGHT_MUTED,
    });

    // Submitted To Box
    page.drawRectangle({
      x: PAGE_WIDTH - 54 - boxWidth,
      y: bottomBoxY,
      width: boxWidth,
      height: boxHeight,
      borderColor: COLOR_LINE,
      borderWidth: 1,
      color: COLOR_LIGHT_BG,
    });
    const rightBoxX = PAGE_WIDTH - 54 - boxWidth + 14;
    page.drawText('SUBMITTED TO', {
      x: rightBoxX,
      y: bottomBoxY + boxHeight - 24,
      size: 10,
      font: fontBold,
      color: COLOR_ORANGE,
    });
    page.drawText(effectiveFacultyName, {
      x: rightBoxX,
      y: bottomBoxY + boxHeight - 48,
      size: 11,
      font: fontBold,
      color: COLOR_DARK,
    });
    page.drawText(facultyDesignation || 'Faculty', {
      x: rightBoxX,
      y: bottomBoxY + boxHeight - 62,
      size: 9.5,
      font: fontRegular,
      color: COLOR_MUTED,
    });
    const dLines = (facultyDept || '').match(/.{1,28}(\s|$)/g) || [facultyDept];
    dLines.forEach((l, idx) => {
      page.drawText(l.trim(), {
        x: rightBoxX,
        y: bottomBoxY + boxHeight - 76 - idx * 11,
        size: 8.5,
        font: fontRegular,
        color: COLOR_LIGHT_MUTED,
      });
    });
  }

  // ================= TEMPLATE 3 & 4: PROFESSIONAL & ELEGANT (Framed) =================
  else {
    const margin = template === 'elegant' ? 36 : 40;

    // Outer Frame
    page.drawRectangle({
      x: margin,
      y: margin,
      width: PAGE_WIDTH - margin * 2,
      height: PAGE_HEIGHT - margin * 2,
      borderColor: COLOR_ORANGE,
      borderWidth: template === 'elegant' ? 1.5 : 2,
    });

    // Second Inner Frame for Elegant
    if (template === 'elegant') {
      page.drawRectangle({
        x: margin + 4,
        y: margin + 4,
        width: PAGE_WIDTH - (margin + 4) * 2,
        height: PAGE_HEIGHT - (margin + 4) * 2,
        borderColor: rgb(0.98, 0.75, 0.55),
        borderWidth: 0.75,
      });
    }

    // Logo
    drawLogo(PAGE_HEIGHT - 130, 52);

    page.drawLine({
      start: { x: margin + 20, y: PAGE_HEIGHT - 146 },
      end: { x: PAGE_WIDTH - margin - 20, y: PAGE_HEIGHT - 146 },
      thickness: 1,
      color: COLOR_ORANGE,
    });

    // Document Title
    drawTextCentered(docTypeName, PAGE_HEIGHT - 210, 22, fontBold, COLOR_ORANGE);
    if (courseTitle || courseCode) {
      drawTextCentered(courseTitle || courseCode, PAGE_HEIGHT - 250, 16, fontBold, COLOR_DARK);
    }

    // Details Block
    const dBoxX = 140;
    let pY = PAGE_HEIGHT - 310;
    const pSpacing = 20;

    const pList = [
      ...(courseCode ? [['Course Code:', `${courseCode}${courseSection ? ` (Section ${courseSection})` : ''}`]] : []),
      ...(docNumber ? [[docNumLabel, docNumber]] : []),
      ...(topicTitle?.trim() ? [['Topic:', topicTitle.trim()]] : []),
      ...(effectiveSubmissionDate ? [['Date of Submission:', effectiveSubmissionDate]] : []),
      ...(trimester ? [['Trimester:', trimester]] : []),
    ];

    page.drawRectangle({
      x: 110,
      y: pY - pList.length * pSpacing - 6,
      width: PAGE_WIDTH - 220,
      height: pList.length * pSpacing + 26,
      borderColor: COLOR_LINE,
      borderWidth: 1,
      color: COLOR_LIGHT_BG,
    });

    pList.forEach(([lbl, val]) => {
      page.drawText(lbl, {
        x: dBoxX,
        y: pY,
        size: 10.5,
        font: fontBold,
        color: COLOR_MUTED,
      });
      page.drawText(String(val), {
        x: dBoxX + 130,
        y: pY,
        size: 10.5,
        font: fontBold,
        color: COLOR_DARK,
      });
      pY -= pSpacing;
    });

    // Footer Grid
    const footerY = 240;
    page.drawLine({
      start: { x: margin + 20, y: footerY },
      end: { x: PAGE_WIDTH - margin - 20, y: footerY },
      thickness: 1,
      color: COLOR_LINE,
    });

    // Left: Submitted By
    const leftX = margin + 24;
    page.drawText('SUBMITTED BY', {
      x: leftX,
      y: footerY - 24,
      size: 11,
      font: fontBold,
      color: COLOR_ORANGE,
    });
    let stY = footerY - 46;
    students.forEach((st) => {
      if (st.name) {
        page.drawText(st.name, {
          x: leftX,
          y: stY,
          size: 11,
          font: fontBold,
          color: COLOR_DARK,
        });
      }
      if (st.id) {
        page.drawText(`ID: ${st.id}`, {
          x: leftX,
          y: stY - 13,
          size: 9.5,
          font: fontRegular,
          color: COLOR_MUTED,
        });
      }
      stY -= 36;
    });
    page.drawText(students[0]?.program || 'B.Sc. in CSE', {
      x: leftX,
      y: margin + 24,
      size: 8.5,
      font: fontRegular,
      color: COLOR_LIGHT_MUTED,
    });

    // Right: Submitted To
    const rightX = PAGE_WIDTH - margin - 180;
    page.drawText('SUBMITTED TO', {
      x: rightX,
      y: footerY - 24,
      size: 11,
      font: fontBold,
      color: COLOR_ORANGE,
    });
    page.drawText(effectiveFacultyName, {
      x: rightX,
      y: footerY - 46,
      size: 11,
      font: fontBold,
      color: COLOR_DARK,
    });
    page.drawText(facultyDesignation || 'Faculty', {
      x: rightX,
      y: footerY - 60,
      size: 9.5,
      font: fontRegular,
      color: COLOR_MUTED,
    });
    page.drawText(facultyDept || '', {
      x: rightX,
      y: footerY - 74,
      size: 8.5,
      font: fontRegular,
      color: COLOR_LIGHT_MUTED,
    });
    page.drawText('United International University', {
      x: rightX,
      y: margin + 24,
      size: 8.5,
      font: fontItalic,
      color: COLOR_LIGHT_MUTED,
    });
  }

  return pdfDoc;
}

/**
 * Merges a generated cover page PDF with an uploaded assignment PDF.
 * Cover page becomes Page 1, followed seamlessly by the user's assignment pages.
 */
export async function mergeCoverPageWithPdf(coverPdfDocOrBytes, assignmentPdfBytes) {
  let coverDoc = null;
  if (coverPdfDocOrBytes instanceof PDFDocument) {
    coverDoc = coverPdfDocOrBytes;
  } else {
    coverDoc = await PDFDocument.load(coverPdfDocOrBytes);
  }

  const assignmentDoc = await PDFDocument.load(assignmentPdfBytes);
  const mergedDoc = await PDFDocument.create();

  // 1. Copy Cover Page (Page 0)
  const [coverPage] = await mergedDoc.copyPages(coverDoc, [0]);
  mergedDoc.addPage(coverPage);

  // 2. Copy all pages of the assignment PDF
  const assignmentPages = await mergedDoc.copyPages(
    assignmentDoc,
    assignmentDoc.getPageIndices()
  );
  assignmentPages.forEach((p) => mergedDoc.addPage(p));

  const mergedPdfBytes = await mergedDoc.save();
  return {
    mergedPdfBytes,
    pageCount: mergedDoc.getPageCount(),
    assignmentPageCount: assignmentDoc.getPageCount(),
  };
}

/**
 * Reads page count of an uploaded assignment PDF
 */
export async function getAssignmentPageCount(arrayBuffer) {
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return doc.getPageCount();
}

/**
 * Initiates download of raw PDF bytes in the browser
 */
export function downloadPdfBlob(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
