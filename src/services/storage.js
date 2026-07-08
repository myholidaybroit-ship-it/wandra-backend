import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { nanoid } from 'nanoid'

/**
 * S3 storage — uploads images/documents to the configured bucket and returns a
 * public URL. Everything (agency logos, destination/hotel photos, client docs,
 * payment proofs, story photos) is stored as a URL, so it maps everywhere the
 * app already reads that field.
 *
 * Env: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET,
 *      S3_PUBLIC_BASE_URL (optional), S3_UPLOAD_PREFIX (optional).
 */
const region = process.env.AWS_REGION
const bucket = process.env.S3_BUCKET
const prefix = (process.env.S3_UPLOAD_PREFIX || '').replace(/^\/+|\/+$/g, '')
const publicBase = (process.env.S3_PUBLIC_BASE_URL || '').replace(/\/+$/, '')

let client = null
function getClient() {
  if (!client) {
    client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  }
  return client
}

/** True when the bucket + credentials are configured. */
export function isConfigured() {
  return !!(region && bucket && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
}

const EXT = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/gif': 'gif', 'image/svg+xml': 'svg', 'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

/** Parse a `data:<mime>;base64,<data>` URL. */
function parseDataUrl(dataUrl) {
  const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl || '')
  if (!m) return null
  const contentType = m[1] || 'application/octet-stream'
  const buffer = m[2] ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3]), 'utf8')
  return { contentType, buffer }
}

const publicUrl = (key) => `${publicBase || `https://${bucket}.s3.${region}.amazonaws.com`}/${key}`

/**
 * Upload a base64 data-URL to S3 and return its public URL.
 *  - If it's already an http(s) URL, it's returned unchanged (idempotent).
 *  - If it's not a data-URL, it's returned as-is.
 *  - If S3 isn't configured, the data-URL is returned unchanged (dev fallback),
 *    so the app keeps working without cloud storage.
 */
export async function uploadDataUrl(dataUrl, { folder = 'uploads' } = {}) {
  if (typeof dataUrl !== 'string' || !dataUrl) return dataUrl
  if (/^https?:\/\//i.test(dataUrl)) return dataUrl
  const parsed = parseDataUrl(dataUrl)
  if (!parsed) return dataUrl
  if (!isConfigured()) return dataUrl

  const ext = EXT[parsed.contentType.toLowerCase()] || 'bin'
  const safeFolder = String(folder).replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+|\/+$/g, '')
  const key = [prefix, safeFolder, `${nanoid(16)}.${ext}`].filter(Boolean).join('/')

  await getClient().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: parsed.buffer,
    ContentType: parsed.contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }))
  return publicUrl(key)
}

/** Upload only if the value is a data-URL; otherwise return it untouched. */
export async function uploadIfDataUrl(value, opts) {
  if (typeof value === 'string' && value.startsWith('data:')) return uploadDataUrl(value, opts)
  return value
}

/**
 * Recursively walk an object/array and replace any base64 data-URL strings with
 * S3 URLs. Used on free-form payloads (e.g. the package builder) so a data-URL
 * can never be persisted raw, no matter how deeply nested.
 */
export async function uploadDeep(value, opts) {
  if (typeof value === 'string') return uploadIfDataUrl(value, opts)
  if (Array.isArray(value)) return Promise.all(value.map((v) => uploadDeep(v, opts)))
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = await uploadDeep(v, opts)
    return out
  }
  return value
}
