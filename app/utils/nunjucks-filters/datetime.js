const moment = require('moment-timezone')

module.exports = (isoTimeString, format) => {
  let formatString = 'D MMMM YYYY h:mm:ssa z'
  if (format === 'date') {
    formatString = 'DD/MM/YYYY'
  } else if (format === 'time') {
    formatString = 'HH:mm:ss'
  }
  return moment(isoTimeString).tz('Europe/London').format(formatString)
}
