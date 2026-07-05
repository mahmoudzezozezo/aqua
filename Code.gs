const scriptProp = PropertiesService.getScriptProperties()

function initialSetup() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  scriptProp.setProperty('key', activeSpreadsheet.getId())
}

function sanitizeValue(value) {
  if (typeof value !== 'string') return value
  const triggers = ['=', '+', '-', '@']
  if (triggers.some(t => value.startsWith(t))) {
    return "'" + value
  }
  return value
}

function doPost(e) {
  const lock = LockService.getScriptLock()
  lock.tryLock(10000)

  try {
    const sheetName = e.parameter.sheet_name || 'Sheet1'
    const doc = SpreadsheetApp.openById(scriptProp.getProperty('key'))
    const sheet = doc.getSheetByName(sheetName)
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    const nextRow = sheet.getLastRow() + 1

    const newRow = headers.map(function (header) {
      if (header === 'id') return Utilities.getUuid()
      if (header === 'timestamp') return new Date()
      const rawValue = e.parameter[header] || ''
      return sanitizeValue(rawValue)
    })

    const newRange = sheet.getRange(nextRow, 1, 1, newRow.length)
    newRange.setNumberFormat('@')
    newRange.setValues([newRow])

    return ContentService.createTextOutput(
      JSON.stringify({ result: 'success', row: nextRow }),
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (e) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: 'error', error: e.toString() }),
    ).setMimeType(ContentService.MimeType.JSON)
  } finally {
    lock.releaseLock()
  }
}
