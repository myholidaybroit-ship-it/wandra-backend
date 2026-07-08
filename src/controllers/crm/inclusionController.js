import { asyncHandler } from '../../utils/asyncHandler.js'
import InclusionPreset from '../../models/InclusionPreset.js'

async function getDoc(agencyId) {
  let doc = await InclusionPreset.findOne({ agency: agencyId })
  if (!doc) doc = await InclusionPreset.create({ agency: agencyId, byDest: {} })
  return doc
}

/** GET /api/inclusions — the whole byDest map. */
export const get = asyncHandler(async (req, res) => {
  const doc = await getDoc(req.agencyId)
  res.json({ byDest: doc.byDest || {} })
})

/** POST /api/inclusions  { dest, type, text } — add one preset. */
export const add = asyncHandler(async (req, res) => {
  const { dest, type, text } = req.body
  if (!dest || !['inclusions', 'exclusions'].includes(type) || !text) return res.status(400).json({ error: 'dest, type and text are required' })
  const doc = await getDoc(req.agencyId)
  const byDest = { ...(doc.byDest || {}) }
  const cur = byDest[dest] || { inclusions: [], exclusions: [] }
  if (!cur[type].includes(text)) cur[type] = [...cur[type], text]
  byDest[dest] = cur
  doc.byDest = byDest
  doc.markModified('byDest')
  await doc.save()
  res.json({ byDest: doc.byDest })
})

/** PATCH /api/inclusions  { dest, type, oldText, newText } — rename a preset. */
export const rename = asyncHandler(async (req, res) => {
  const { dest, type, oldText, newText } = req.body
  const t = (newText || '').trim()
  const doc = await getDoc(req.agencyId)
  const byDest = { ...(doc.byDest || {}) }
  const cur = byDest[dest]
  if (dest && t && cur?.[type]?.includes(oldText)) {
    cur[type] = cur[type].map((x) => (x === oldText ? t : x)).filter((x, i, a) => a.indexOf(x) === i)
    byDest[dest] = cur
    doc.byDest = byDest
    doc.markModified('byDest')
    await doc.save()
  }
  res.json({ byDest: doc.byDest })
})

/** DELETE /api/inclusions  { dest, type, text } — remove one; or { dest } to clear a destination. */
export const remove = asyncHandler(async (req, res) => {
  const { dest, type, text } = req.body
  const doc = await getDoc(req.agencyId)
  const byDest = { ...(doc.byDest || {}) }
  if (dest && !type) {
    delete byDest[dest]
  } else if (dest && type && byDest[dest]) {
    byDest[dest] = { ...byDest[dest], [type]: (byDest[dest][type] || []).filter((x) => x !== text) }
  }
  doc.byDest = byDest
  doc.markModified('byDest')
  await doc.save()
  res.json({ byDest: doc.byDest })
})
