import nano from 'nano'

const DEFAULT_COUCHDB_URL = 'http://127.0.0.1:5984'
const DEFAULT_DATABASE = 'eds_leads'

export function getCouchConfig() {
  return {
    url: process.env.COUCHDB_URL || DEFAULT_COUCHDB_URL,
    database: process.env.COUCHDB_DATABASE || DEFAULT_DATABASE,
    username: process.env.COUCHDB_USERNAME || '',
    password: process.env.COUCHDB_PASSWORD || ''
  }
}

export function getCouchDb() {
  const config = getCouchConfig()
  const couch = nano(withCredentials(config))

  return couch.db.use(config.database)
}

export async function ensureDatabase() {
  const config = getCouchConfig()
  const couch = nano(withCredentials(config))

  try {
    await couch.db.get(config.database)
  } catch (error) {
    if (error?.statusCode !== 404) {
      throw error
    }

    await couch.db.create(config.database)
  }

  return couch.db.use(config.database)
}

function withCredentials(config) {
  if (!config.username || !config.password) {
    return config.url
  }

  const url = new URL(config.url)
  url.username = config.username
  url.password = config.password

  return url.toString()
}
