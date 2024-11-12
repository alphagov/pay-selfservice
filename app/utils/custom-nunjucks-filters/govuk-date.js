const { DateTime } = require('luxon')

module.exports = (string, format = false) => {
  string = normalize(string, '')

  try {
    if (string === 'today' || string === 'now') {
      string = DateTime.now().toString()
      return DateTime.fromISO(string).toFormat('dd MMMM yyyy')
    }
    let date = DateTime.fromISO(string)
    if (!date.isValid) {
      date = DateTime.fromFormat(string, 'yyyy-M-d')
    }
    return date.toFormat('dd MMMM yyyy')
  } catch (error) {
    return error.message.split(':')[0]
  }
}

function normalize (value, defaultValue) {
  if (value === null || value === undefined || value === false) {
    return defaultValue
  }

  return value
}
