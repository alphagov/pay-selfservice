const moment = require('moment-timezone')

module.exports = (function () {
  const DEFAULT_FORMAT = 'YYYY-MM-DD HH:mm:ss'
  const MAX_TIME = '23:59:59'

  const dateToDefaultFormat = function (date) {
    return moment(date).tz('Europe/London').format(DEFAULT_FORMAT)
  }

  const fromDateToApiFormat = function (date, time) {
    return (date) ? moment.tz(`${date} ${time}`, 'DD/M/YYYY HH:mm:ss', 'Europe/London').toISOString() : ''
  }

  const toDateToApiFormat = function (date, time) {
    let fixedTime = time

    // Increment needed to make the toDate inclusive
    const increment = 1

    if (!time) {
      fixedTime = MAX_TIME
    }

    return (date) ? moment.tz(`${date} ${fixedTime}`, 'DD/M/YYYY HH:mm:ss', 'Europe/London').add(increment, 'second').toISOString() : ''
  }

  const utcToDisplay = function (date) {
    return moment(date).tz('Europe/London').format('DD MMM YYYY — HH:mm:ss')
  }

  const utcToDate = function (date) {
    return moment(date).tz('Europe/London').format('DD MMM YYYY')
  }

  const utcToTime = function (date) {
    return moment(date).tz('Europe/London').format('HH:mm:ss')
  }

  return {
    dateToDefaultFormat,
    fromDateToApiFormat,
    toDateToApiFormat,
    utcToDisplay,
    utcToDate,
    utcToTime
  }
}())
