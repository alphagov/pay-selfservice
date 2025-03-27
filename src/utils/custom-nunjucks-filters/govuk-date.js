const { DateTime } = require('luxon')

module.exports = (string, kwargs) => {
  string = normalize(string, '')

  const options = {
    preserveTime: false,
    ...kwargs
  }

  try {
    if (string === 'today' || string === 'now') {
      string = DateTime.now().toString()
      return options.preserveTime
        ? DateTime.fromISO(string).toFormat('dd MMMM yyyy HH:mm')
        : DateTime.fromISO(string).toFormat('dd MMMM yyyy')
    }
    let date = DateTime.fromISO(string)
    if (!date.isValid) {
      date = DateTime.fromFormat(string, 'yyyy-M-d')
    }
    return options.preserveTime
      ? date.toFormat('dd MMMM yyyy HH:mm')
      : date.toFormat('dd MMMM yyyy')
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
