require('dotenv').config()
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { Upload } = require('@aws-sdk/lib-storage')

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET = process.env.R2_BUCKET_NAME || 'wanconnect-portal'
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '')

async function uploadToR2(buffer, key, contentType = 'application/octet-stream') {
  const upload = new Upload({
    client: R2,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    },
  })
  await upload.done()
  return `${PUBLIC_URL}/${key}`
}

async function deleteFromR2(key) {
  try {
    await R2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
  } catch (err) {
    console.warn('R2 delete failed:', err.message)
  }
}

// Extract R2 key from a full public URL
function urlToKey(url) {
  if (!url || !PUBLIC_URL) return url
  return url.replace(`${PUBLIC_URL}/`, '')
}

module.exports = { uploadToR2, deleteFromR2, urlToKey }
