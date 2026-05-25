require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

pool.on('error', (err) => console.error('PostgreSQL pool error:', err.message))

// Convert SQLite ? placeholders to PostgreSQL $1, $2, ...
function toPositional(sql) {
  let i = 0
  return sql.replace(/\?/g, () => `$${++i}`)
}

const db = {
  // Returns single row or null
  async get(sql, params = []) {
    const { rows } = await pool.query(toPositional(sql), params)
    return rows[0] || null
  },

  // Returns array of rows
  async all(sql, params = []) {
    const { rows } = await pool.query(toPositional(sql), params)
    return rows
  },

  // For UPDATE / DELETE — returns { changes }
  async run(sql, params = []) {
    const { rowCount } = await pool.query(toPositional(sql), params)
    return { changes: rowCount }
  },

  // For INSERT — automatically appends RETURNING id, returns { lastInsertRowid }
  async insert(sql, params = []) {
    let pgSql = toPositional(sql)
    if (!pgSql.toUpperCase().includes('RETURNING')) pgSql += ' RETURNING id'
    const { rows } = await pool.query(pgSql, params)
    return { lastInsertRowid: rows[0]?.id }
  },

  // For raw DDL or multi-statement SQL
  async exec(sql) {
    await pool.query(sql)
  },

  pool,
}

module.exports = db
