/**
 * The Wandra product logo (/brand/wandra-logo.png) is never an agency's own
 * brand — it was only ever a placeholder default. Treat it (and empty values)
 * as "no logo" so client-facing surfaces show a neutral placeholder instead of
 * Wandra's logo until the agency uploads their own.
 */
export const cleanLogo = (url) => (url && !String(url).includes('wandra-logo') ? url : '')
