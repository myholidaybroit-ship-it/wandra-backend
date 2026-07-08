import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { uploadIfDataUrl } from '../services/storage.js'

/**
 * Generate tenant-scoped CRUD handlers for a Mongoose model.
 * Every query is automatically scoped to `req.agencyId`, so agencies can only
 * ever see and touch their own records.
 *
 * options:
 *   sort         default sort (default '-createdAt')
 *   searchable   fields to match against ?q= (case-insensitive)
 *   filters      query params that map straight to equality filters
 *   uploadFields image/file fields (string or array) whose data-URL values are
 *                pushed to S3 on create/update (server-side safety net)
 *   uploadFolder S3 sub-folder for those uploads (default = model name)
 *   beforeCreate(req, doc)  mutate the payload before insert (e.g. add code)
 *   afterCreate(req, doc)   side effects after insert
 *   afterUpdate(req, doc)
 */
export function crudFactory(Model, options = {}) {
  const {
    sort = '-createdAt',
    searchable = [],
    filters = [],
    uploadFields = [],
    uploadFolder = Model.modelName.toLowerCase(),
    beforeCreate,
    afterCreate,
    afterUpdate,
    beforeDelete,
  } = options

  const scope = (req) => ({ agency: req.agencyId })

  // Push any data-URL values in `uploadFields` to S3 (arrays handled per-item).
  async function resolveUploads(req, payload) {
    if (!uploadFields.length) return
    const folder = `agencies/${req.agencyId}/${uploadFolder}`
    for (const f of uploadFields) {
      const val = payload[f]
      if (Array.isArray(val)) {
        payload[f] = await Promise.all(val.map((v) => uploadIfDataUrl(v, { folder })))
      } else if (val != null) {
        payload[f] = await uploadIfDataUrl(val, { folder })
      }
    }
  }

  const buildQuery = (req) => {
    const q = scope(req)
    for (const f of filters) {
      if (req.query[f] != null && req.query[f] !== '') q[f] = req.query[f]
    }
    if (req.query.q && searchable.length) {
      const rx = new RegExp(String(req.query.q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      q.$or = searchable.map((field) => ({ [field]: rx }))
    }
    return q
  }

  const list = asyncHandler(async (req, res) => {
    const query = buildQuery(req)
    const limit = Math.min(Number(req.query.limit) || 500, 2000)
    const page = Math.max(Number(req.query.page) || 1, 1)
    const [items, total] = await Promise.all([
      Model.find(query).sort(sort).skip((page - 1) * limit).limit(limit),
      Model.countDocuments(query),
    ])
    res.json({ items, total, page, limit })
  })

  const getOne = asyncHandler(async (req, res) => {
    const doc = await Model.findOne({ _id: req.params.id, ...scope(req) })
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`)
    res.json(doc)
  })

  const create = asyncHandler(async (req, res) => {
    const payload = { ...req.body, agency: req.agencyId }
    delete payload.id
    delete payload._id
    await resolveUploads(req, payload)
    if (beforeCreate) await beforeCreate(req, payload)
    const doc = await Model.create(payload)
    if (afterCreate) await afterCreate(req, doc)
    res.status(201).json(doc)
  })

  const update = asyncHandler(async (req, res) => {
    const payload = { ...req.body }
    delete payload.id
    delete payload._id
    delete payload.agency
    await resolveUploads(req, payload)
    const doc = await Model.findOneAndUpdate(
      { _id: req.params.id, ...scope(req) },
      payload,
      { new: true, runValidators: true },
    )
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`)
    if (afterUpdate) await afterUpdate(req, doc)
    res.json(doc)
  })

  const remove = asyncHandler(async (req, res) => {
    const doc = await Model.findOne({ _id: req.params.id, ...scope(req) })
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`)
    if (beforeDelete) await beforeDelete(req, doc)
    await doc.deleteOne()
    res.json({ ok: true, id: req.params.id })
  })

  return { list, getOne, create, update, remove, scope, buildQuery }
}

export default crudFactory
