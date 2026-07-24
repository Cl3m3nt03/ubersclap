import { Injectable } from '@nestjs/common';
import {
  AFRelationship,
  PDFDocument,
  PDFFont,
  StandardFonts,
  rgb,
} from 'pdf-lib';
import {
  formatEuros,
  formatShortDate,
  VAT_REGIME_LABEL,
} from '@ubersclap/shared';

import type { invoices, invoiceLines } from '../database/schema';
import { parseIssuerSnapshot } from './issuer-snapshot';
import { buildFacturXXml } from './factur-x';

type InvoiceRow = typeof invoices.$inferSelect;
type InvoiceLineRow = typeof invoiceLines.$inferSelect;

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 50;
const INK = rgb(0.09, 0.09, 0.16);
const MUTED = rgb(0.42, 0.45, 0.5);
const INDIGO = rgb(0.31, 0.27, 0.9);
const LINE = rgb(0.85, 0.86, 0.9);

/**
 * Rend une facture en PDF, avec le XML Factur-X en piece jointe.
 *
 * Le PDF est genere a la demande plutot que stocke : au MVP il n'y a pas encore
 * de bucket (R2 est commente dans l'env). Le jour ou l'on stocke, c'est ce meme
 * flux binaire qu'on televerse, et `pdfUrl` pointera dessus — le mobile, lui,
 * telecharge deja un fichier, que ce soit un flux ou une URL signee.
 *
 * Tout ce qui est affiche vient du snapshot fige a l'emission, pas des tables
 * vivantes : une facture doit rester identique a elle-meme meme si l'emetteur
 * change de raison sociale l'annee suivante.
 */
@Injectable()
export class InvoicePdfService {
  async generate(
    invoice: InvoiceRow,
    lines: InvoiceLineRow[],
  ): Promise<Uint8Array> {
    const snapshot = parseIssuerSnapshot(invoice.issuerSnapshot);
    const pdf = await PDFDocument.create();
    pdf.setTitle(`Facture ${invoice.invoiceNumber}`);
    pdf.setProducer("Uber's Clap");

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const page = pdf.addPage([A4.width, A4.height]);

    const issuer = snapshot?.issuer;
    const client = snapshot?.client;
    let y = A4.height - MARGIN;

    // -------------------------------------------------------------- En-tete
    page.drawText('FACTURE', { x: MARGIN, y: y - 6, size: 26, font: bold, color: INK });
    page.drawText(invoice.invoiceNumber, {
      x: A4.width - MARGIN - font.widthOfTextAtSize(invoice.invoiceNumber, 14),
      y: y - 2,
      size: 14,
      font: bold,
      color: INDIGO,
    });
    y -= 40;

    // -------------------------------------------------- Emetteur / client
    const issuerName = winAnsi(issuer?.companyName || issuer?.name || '');
    page.drawText(issuerName, { x: MARGIN, y, size: 12, font: bold, color: INK });

    const issuerLines = [
      issuer?.legalForm ?? undefined,
      issuer?.address ?? undefined,
      issuer?.siret ? `SIRET ${issuer.siret}` : undefined,
      issuer?.vtcRegistrationNumber
        ? `VTC ${issuer.vtcRegistrationNumber}`
        : undefined,
      issuer?.vatNumber ? `TVA ${issuer.vatNumber}` : undefined,
      issuer?.email ?? undefined,
      issuer?.phone ?? undefined,
    ]
      .filter((v): v is string => Boolean(v))
      .map(winAnsi);

    let issuerY = y - 16;
    for (const text of issuerLines) {
      page.drawText(text, { x: MARGIN, y: issuerY, size: 9, font, color: MUTED });
      issuerY -= 13;
    }

    // Bloc client, aligne a droite.
    const clientX = A4.width - MARGIN - 200;
    page.drawText('Facturé à', { x: clientX, y, size: 9, font, color: MUTED });
    page.drawText(winAnsi(client?.company || client?.name || ''), {
      x: clientX,
      y: y - 16,
      size: 12,
      font: bold,
      color: INK,
    });
    let clientY = y - 32;
    for (const text of [client?.address, client?.phone, client?.email]) {
      if (!text) continue;
      page.drawText(winAnsi(text), { x: clientX, y: clientY, size: 9, font, color: MUTED });
      clientY -= 13;
    }

    y = Math.min(issuerY, clientY) - 24;

    // ------------------------------------------------------------- Dates
    const issuedAt = invoice.issuedAt ?? invoice.createdAt;
    page.drawText(
      `Date d'émission : ${formatShortDate(issuedAt)}`,
      { x: MARGIN, y, size: 10, font, color: INK },
    );
    if (invoice.dueAt) {
      page.drawText(`Échéance : ${formatShortDate(invoice.dueAt)}`, {
        x: MARGIN,
        y: y - 15,
        size: 10,
        font,
        color: INK,
      });
    }
    y -= 40;

    // ------------------------------------------------------- Tableau lignes
    const cols = { desc: MARGIN, qty: 360, unit: 410, total: 500 };
    page.drawText('Description', { x: cols.desc, y, size: 9, font: bold, color: MUTED });
    page.drawText('Qté', { x: cols.qty, y, size: 9, font: bold, color: MUTED });
    page.drawText('P.U. HT', { x: cols.unit, y, size: 9, font: bold, color: MUTED });
    page.drawText('Total HT', {
      x: cols.total + (60 - font.widthOfTextAtSize('Total HT', 9)),
      y,
      size: 9,
      font: bold,
      color: MUTED,
    });
    y -= 8;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: A4.width - MARGIN, y },
      thickness: 1,
      color: LINE,
    });
    y -= 18;

    for (const line of lines) {
      const wrapped = wrapText(winAnsi(line.label), font, 9, cols.qty - cols.desc - 12);
      const lineTotal = line.unitPriceExclTaxCents * line.quantity;

      wrapped.forEach((segment, index) => {
        page.drawText(segment, {
          x: cols.desc,
          y: y - index * 12,
          size: 9,
          font,
          color: INK,
        });
      });
      page.drawText(String(line.quantity), { x: cols.qty, y, size: 9, font, color: INK });
      page.drawText(formatEuros(line.unitPriceExclTaxCents, { symbol: false }), {
        x: cols.unit,
        y,
        size: 9,
        font,
        color: INK,
      });
      drawRight(page, formatEuros(lineTotal, { symbol: false }), cols.total + 60, y, font, 9, INK);

      y -= Math.max(wrapped.length * 12, 16) + 6;
    }

    // ------------------------------------------------------------ Totaux
    y -= 6;
    page.drawLine({
      start: { x: 340, y },
      end: { x: A4.width - MARGIN, y },
      thickness: 1,
      color: LINE,
    });
    y -= 18;

    const regime = issuer?.vatRegime ?? 'FRANCHISE';
    drawTotal(page, 'Total HT', formatEuros(invoice.totalExclTaxCents), y, font, bold, false);
    y -= 16;
    drawTotal(
      page,
      regime === 'FRANCHISE' ? 'TVA' : 'TVA (10 %)',
      formatEuros(invoice.taxCents),
      y,
      font,
      bold,
      false,
    );
    y -= 20;
    drawTotal(page, 'Total TTC', formatEuros(invoice.totalInclTaxCents), y, font, bold, true);
    y -= 40;

    // ------------------------------------------------- Mentions legales
    const mentions: string[] = [];
    if (regime === 'FRANCHISE') {
      mentions.push('TVA non applicable, art. 293 B du CGI');
    }
    mentions.push(`Régime de TVA : ${VAT_REGIME_LABEL[regime]}`);
    mentions.push('Paiement à réception, sauf mention contraire.');

    for (const mention of mentions) {
      page.drawText(mention, { x: MARGIN, y, size: 8, font, color: MUTED });
      y -= 12;
    }

    // ------------------------------------------- Piece jointe Factur-X
    const xml = buildFacturXXml({
      invoiceNumber: invoice.invoiceNumber,
      issuedAt,
      totalExclTaxCents: invoice.totalExclTaxCents,
      taxCents: invoice.taxCents,
      totalInclTaxCents: invoice.totalInclTaxCents,
      snapshot: snapshot ?? emptySnapshot(),
    });

    await pdf.attach(new TextEncoder().encode(xml), 'factur-x.xml', {
      mimeType: 'application/xml',
      description: 'Factur-X CII (profil minimum)',
      afRelationship: AFRelationship.Alternative,
      creationDate: issuedAt,
      modificationDate: issuedAt,
    });

    // Sans object streams : le XML Factur-X reste une piece jointe lisible telle
    // quelle, et le conteneur se rapproche de ce qu'attend un validateur PDF/A-3
    // (la conformite PDF/A-3 complete — profil ICC, XMP — reste a ajouter).
    return pdf.save({ useObjectStreams: false });
  }
}

// ------------------------------------------------------------- helpers

function drawRight(
  page: ReturnType<PDFDocument['addPage']>,
  text: string,
  rightX: number,
  y: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
) {
  page.drawText(text, { x: rightX - font.widthOfTextAtSize(text, size), y, size, font, color });
}

function drawTotal(
  page: ReturnType<PDFDocument['addPage']>,
  label: string,
  value: string,
  y: number,
  font: PDFFont,
  bold: PDFFont,
  emphasize: boolean,
) {
  const size = emphasize ? 13 : 10;
  const labelFont = emphasize ? bold : font;
  const color = emphasize ? INDIGO : INK;
  page.drawText(label, { x: 360, y, size, font: labelFont, color });
  drawRight(page, value, A4.width - MARGIN, y, emphasize ? bold : font, size, color);
}

/**
 * Ramene un texte a ce que Helvetica standard sait encoder (WinAnsi).
 *
 * Les polices standard de pdf-lib ne couvrent pas l'Unicode : une fleche « → »
 * dans un libelle « depart → arrivee », un emoji dans un nom de contact, et la
 * generation echoue en pleine ecriture. On remplace la fleche par un chevron,
 * on garde le Latin-1 et les caracteres speciaux WinAnsi (€, accents, guillemets
 * typographiques), et tout le reste devient « ? » plutot que de tout casser.
 */
const WINANSI_EXTRAS = new Set(
  [
    0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030,
    0x0160, 0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022,
    0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
  ].map((code) => String.fromCharCode(code)),
);

function winAnsi(text: string): string {
  let out = '';
  for (const char of text.replace(/[→➔➡➙➜]/g, '>')) {
    if (char.charCodeAt(0) <= 0xff || WINANSI_EXTRAS.has(char)) out += char;
    else out += '?';
  }
  return out;
}

/** Coupe un libelle sur la largeur disponible, mot par mot. */
function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

function emptySnapshot() {
  return {
    issuer: {
      name: '',
      companyName: null,
      legalForm: null,
      siret: null,
      vatNumber: null,
      vtcRegistrationNumber: null,
      vatRegime: 'FRANCHISE' as const,
      address: null,
      email: '',
      phone: null,
    },
    client: {
      name: '',
      company: null,
      address: null,
      email: null,
      phone: '',
    },
  };
}
