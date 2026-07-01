import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureDatabase } from './server/couchdb.js'
import { registerLeadRoutes } from './server/leads.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PORT = Number(process.env.PORT || 3306)
const HOST = process.env.HOST || '0.0.0.0'
const SPA_DIR = process.env.SPA_ROOT
  ? path.resolve(process.env.SPA_ROOT)
  : path.join(__dirname, 'dist', 'spa')

const app = express()

app.use(express.json({ limit: '1mb' }))

registerLeadRoutes(app)

app.use(express.static(SPA_DIR))

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API route not found' })
    return
  }

  res.sendFile(path.join(SPA_DIR, 'index.html'))
})

app.use((error, req, res, next) => {
  console.error(error)
  res.status(error?.statusCode || 500).json({
    error: error?.message || 'Server error'
  })
})

ensureDatabase()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`E.D.S. app listening on ${HOST}:${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Could not connect to CouchDB.')
    console.error(error)
    process.exit(1)
  })
