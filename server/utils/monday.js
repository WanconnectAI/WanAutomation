const MONDAY_API = 'https://api.monday.com/v2'

async function mondayRequest(apiToken, query) {
  const res = await fetch(MONDAY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': apiToken, 'API-Version': '2023-10' },
    body: JSON.stringify({ query })
  })
  if (!res.ok) throw new Error(`Monday.com API HTTP error: ${res.status}`)
  const data = await res.json()
  if (data.errors) throw new Error(data.errors.map(e => e.message).join(', '))
  return data
}

async function getBoardColumns(apiToken, boardId) {
  const query = `query { boards(ids: [${boardId}]) { name columns { id title type } } }`
  const data = await mondayRequest(apiToken, query)
  const board = data.data?.boards?.[0]
  if (!board) throw new Error('Board not found. Check your Board ID.')
  return { boardName: board.name, columns: board.columns }
}

function formatColumnValue(value, columnType) {
  if (value === null || value === undefined || value === '') return null
  const v = String(value)
  switch (columnType) {
    case 'email': return JSON.stringify({ email: v, text: v })
    case 'phone': return JSON.stringify({ phone: v, countryShortName: 'MY' })
    case 'date': return JSON.stringify({ date: v })
    case 'long_text': return JSON.stringify({ text: v })
    case 'numbers': return v
    case 'status': return JSON.stringify({ label: v })
    case 'text':
    default: return v
  }
}

async function createMondayItem(apiToken, boardId, itemName, formData, columnMappings, boardColumns) {
  const colTypeMap = {}
  boardColumns.forEach(c => { colTypeMap[c.id] = c.type })

  const columnValues = {}
  Object.entries(columnMappings).forEach(([fieldKey, colId]) => {
    if (!colId || !formData[fieldKey]) return
    const formatted = formatColumnValue(formData[fieldKey], colTypeMap[colId])
    if (formatted !== null) columnValues[colId] = formatted
  })

  const colValStr = JSON.stringify(JSON.stringify(columnValues))
  const safeName = String(itemName || 'New Submission').replace(/"/g, '\\"').slice(0, 255)

  const query = `mutation {
    create_item(
      board_id: ${boardId},
      item_name: "${safeName}",
      column_values: ${colValStr}
    ) { id name }
  }`

  const data = await mondayRequest(apiToken, query)
  return data.data?.create_item
}

module.exports = { getBoardColumns, createMondayItem }
