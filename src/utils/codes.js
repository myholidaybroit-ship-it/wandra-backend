import { nextSeq } from '../models/Counter.js'

/** yyyymm token used in most CRM document codes (e.g. CLI-202606-001). */
export function ym(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}${m}`
}

const pad = (n, w) => String(n).padStart(w, '0')

/** CLI-YYYYMM-### */
export const clientCode = async (agency) => `CLI-${ym()}-${pad(await nextSeq('client', agency), 3)}`
/** PKG-YYYYMM-#### */
export const packageCode = async (agency) => `PKG-${ym()}-${pad(await nextSeq('package', agency), 4)}`
/** BKG-YYYYMM-#### */
export const bookingCode = async (agency) => `BKG-${ym()}-${pad(await nextSeq('booking', agency), 4)}`
/** INV-YYYYMM-#### (agency invoices) */
export const invoiceCode = async (agency) => `INV-${ym()}-${pad(await nextSeq('invoice', agency), 4)}`
/** VCH-#### */
export const voucherCode = async (agency) => `VCH-${pad(await nextSeq('voucher', agency), 4)}`
/** AGY-#### (global) */
export const agencyCode = async () => `AGY-${pad(await nextSeq('agency', null), 4)}`
/** INV-#### (global admin billing invoices) */
export const adminInvoiceCode = async () => `INV-${pad(await nextSeq('adminInvoice', null), 4)}`
