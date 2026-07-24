import type { IssuerSnapshot } from './issuer-snapshot';

/**
 * XML Factur-X (CII, profil MINIMUM).
 *
 * La facturation electronique francaise repose sur un PDF/A-3 portant en piece
 * jointe un XML CrossIndustryInvoice. On genere ici le profil MINIMUM — les
 * seuls totaux d'en-tete — qui suffit a rendre la facture lisible par une
 * machine : numero, dates, emetteur, montants HT/TVA/TTC.
 *
 * Ce qui reste a faire pour une conformite complete est volontairement hors de
 * ce premier jet : profils BASIC/EN 16931 (lignes detaillees), et surtout la
 * conformite PDF/A-3 du conteneur (profil ICC, metadonnees XMP), a valider avec
 * un outil dedie (Mustangproject, FNFE). Le XML est deja correctement structure
 * pour cette montee en profil.
 */
export interface FacturXData {
  invoiceNumber: string;
  issuedAt: Date;
  totalExclTaxCents: number;
  taxCents: number;
  totalInclTaxCents: number;
  snapshot: IssuerSnapshot;
}

export function buildFacturXXml(data: FacturXData): string {
  const { snapshot } = data;
  const seller = snapshot.issuer;
  const buyer = snapshot.client;

  const sellerName = seller.companyName || seller.name;
  const buyerName = buyer.company || buyer.name;

  const vatRegistration = seller.vatNumber
    ? `
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${esc(seller.vatNumber)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`
    : '';

  const legalOrganization = seller.siret
    ? `
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${esc(seller.siret)}</ram:ID>
        </ram:SpecifiedLegalOrganization>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:minimum</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${esc(data.invoiceNumber)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${yyyymmdd(data.issuedAt)}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${esc(sellerName)}</ram:Name>${legalOrganization}
        <ram:PostalTradeAddress>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>${vatRegistration}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${esc(buyerName)}</ram:Name>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:TaxBasisTotalAmount>${amount(data.totalExclTaxCents)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${amount(data.taxCents)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${amount(data.totalInclTaxCents)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${amount(data.totalInclTaxCents)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

/** Centimes -> montant decimal a point, ex. 4250 -> "42.50". */
function amount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Date -> AAAAMMJJ (format CII 102). */
function yyyymmdd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
