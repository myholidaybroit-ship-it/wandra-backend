/**
 * Shared Mongoose plugins.
 *  - toJSON transform: expose `id` (string) instead of `_id`, drop `__v`,
 *    and stringify nested ObjectIds so the React frontends get clean records.
 *  - tenantScoped: adds an indexed `agency` ref for multi-tenant models.
 */

// Reference fields the frontend still reads under their legacy `<name>Id` names
// (the mock data used packageId/clientId/bookingId/invoiceId). We emit both so
// existing components keep working without changes.
const REF_ALIASES = ['client', 'package', 'booking', 'invoice']

export function jsonTransform(schema) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform(doc, ret) {
      ret.id = ret._id?.toString?.() ?? ret._id
      delete ret._id
      // never leak password hashes
      delete ret.passwordHash
      delete ret.password
      // expose legacy `<ref>Id` aliases for ObjectId ref fields
      for (const k of REF_ALIASES) {
        if (ret[k] != null && ret[`${k}Id`] === undefined) ret[`${k}Id`] = ret[k]?.toString?.() ?? ret[k]
      }
      return ret
    },
  })
  schema.set('toObject', { virtuals: true })
}

export function tenantScoped(schema, { unique = false } = {}) {
  // when `unique`, the agency field is itself a unique index (singleton-per-tenant
  // models), so we must NOT also declare a second index on it elsewhere.
  schema.add({
    agency: { type: 'ObjectId', ref: 'Agency', required: true, index: true, unique: unique || undefined },
  })
}

/** Apply both transforms + timestamps in one call. */
export function baseModel(schema, { tenant = true, unique = false } = {}) {
  if (tenant) tenantScoped(schema, { unique })
  jsonTransform(schema)
  schema.set('timestamps', true)
}
