import { asyncHandler } from '../../utils/asyncHandler.js'
import Landing from '../../models/Landing.js'
import { landingDefault } from '../../config/crmDefaults.js'
import { uploadIfDataUrl } from '../../services/storage.js'
import { cleanLogo } from '../../utils/brand.js'

async function getDoc(agency) {
  let doc = await Landing.findOne({ agency: agency._id })
  if (!doc) doc = await Landing.create({ agency: agency._id, ...landingDefault(agency.name, cleanLogo(agency.logo)) })
  return doc
}

/** GET /api/landing */
export const get = asyncHandler(async (req, res) => {
  const doc = (await getDoc(req.agency)).toJSON()
  if (doc.header) doc.header.logo = cleanLogo(doc.header.logo)   // show the placeholder, not the Wandra logo, until a real one is set
  res.json(doc)
})

/** PATCH /api/landing — shallow-merge section patches. */
export const update = asyncHandler(async (req, res) => {
  const doc = await getDoc(req.agency)
  const patch = { ...req.body }
  delete patch.agency; delete patch.id
  // safety net: push any raw data-URL images (logo / hero / about) to S3
  const folder = `agencies/${req.agencyId}/landing`
  if (patch.header?.logo) patch.header = { ...patch.header, logo: await uploadIfDataUrl(patch.header.logo, { folder }) }
  if (patch.hero?.image) patch.hero = { ...patch.hero, image: await uploadIfDataUrl(patch.hero.image, { folder }) }
  if (patch.about?.image) patch.about = { ...patch.about, image: await uploadIfDataUrl(patch.about.image, { folder }) }
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && doc[k] && typeof doc[k] === 'object') {
      doc[k] = { ...doc[k], ...v }
      doc.markModified(k)
    } else {
      doc[k] = v
    }
  }
  await doc.save()
  res.json(doc)
})
