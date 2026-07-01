import crypto from 'node:crypto'
import { getCouchDb } from './couchdb.js'

const SERVICE_TYPES = new Set([
  'mowing',
  'graveyard_cleaning',
  'lot_maintenance',
  'banner_design',
  'video_editing',
  'other'
])

const INQUIRY_SOURCES = new Set([
  'Facebook',
  'Messenger',
  'referral',
  'walk-in',
  'other'
])

const URGENCIES = new Set(['low', 'normal', 'urgent'])

const STATUSES = new Set([
  'new',
  'contacted',
  'estimated',
  'approved',
  'scheduled',
  'completed',
  'rejected'
])

export function registerLeadRoutes(app) {
  app.get('/api/health', async (req, res, next) => {
    try {
      const db = getCouchDb()
      await db.info()
      res.json({ ok: true, app: 'eds', couchdb: 'ok' })
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/leads', async (req, res, next) => {
    try {
      const db = getCouchDb()
      const result = await db.list({ include_docs: true })
      const leads = result.rows
        .map((row) => row.doc)
        .filter((doc) => doc?.type === 'lead' && !doc._deleted)
        .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))

      res.json(leads)
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/leads/:id', async (req, res, next) => {
    try {
      const db = getCouchDb()
      const lead = await getLeadOrNull(db, req.params.id)

      if (!lead) {
        res.status(404).json({ error: 'Lead not found' })
        return
      }

      res.json(lead)
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/leads', async (req, res, next) => {
    try {
      const db = getCouchDb()
      const now = new Date().toISOString()
      const lead = {
        _id: `lead:${crypto.randomUUID()}`,
        type: 'lead',
        ...sanitizeLeadInput(req.body),
        createdAt: now,
        updatedAt: now
      }

      const result = await db.insert(lead)
      res.status(201).json({ ...lead, _rev: result.rev })
    } catch (error) {
      next(error)
    }
  })

  app.put('/api/leads/:id', async (req, res, next) => {
    try {
      const db = getCouchDb()
      const existing = await getLeadOrNull(db, req.params.id)

      if (!existing) {
        res.status(404).json({ error: 'Lead not found' })
        return
      }

      const nextLead = {
        ...existing,
        ...sanitizeLeadInput(req.body),
        _id: existing._id,
        _rev: existing._rev,
        type: 'lead',
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString()
      }

      const result = await db.insert(nextLead)
      res.json({ ...nextLead, _rev: result.rev })
    } catch (error) {
      next(error)
    }
  })

  app.delete('/api/leads/:id', async (req, res, next) => {
    try {
      const db = getCouchDb()
      const existing = await getLeadOrNull(db, req.params.id)

      if (!existing) {
        res.status(404).json({ error: 'Lead not found' })
        return
      }

      await db.destroy(existing._id, existing._rev)
      res.json({ ok: true, id: existing._id })
    } catch (error) {
      next(error)
    }
  })
}

function sanitizeLeadInput(input = {}) {
  return {
    customerName: stringValue(input.customerName),
    phoneNumber: stringValue(input.phoneNumber),
    facebookName: stringValue(input.facebookName),
    location: stringValue(input.location),
    serviceType: enumValue(input.serviceType, SERVICE_TYPES, 'mowing'),
    inquirySource: enumValue(input.inquirySource, INQUIRY_SOURCES, 'Facebook'),
    inquiryDate: stringValue(input.inquiryDate) || todayForInput(),
    description: stringValue(input.description),
    lotSize: stringValue(input.lotSize),
    grassHeight: stringValue(input.grassHeight),
    urgency: enumValue(input.urgency, URGENCIES, 'normal'),
    status: enumValue(input.status, STATUSES, 'new'),
    estimatedPrice: numberOrNull(input.estimatedPrice),
    finalPrice: numberOrNull(input.finalPrice),
    followUpDate: stringValue(input.followUpDate),
    notes: stringValue(input.notes)
  }
}

async function getLeadOrNull(db, id) {
  try {
    const doc = await db.get(id)
    return doc.type === 'lead' ? doc : null
  } catch (error) {
    if (error?.statusCode === 404) {
      return null
    }

    throw error
  }
}

function stringValue(value) {
  return value === null || value === undefined ? '' : String(value).trim()
}

function enumValue(value, allowedValues, fallback) {
  return allowedValues.has(value) ? value : fallback
}

function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function todayForInput() {
  return new Date().toISOString().slice(0, 10)
}
