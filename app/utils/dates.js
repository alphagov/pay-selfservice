var moment = require('moment-timezone')
const { DateTime } = require('luxon')

module.exports = (function () {
  var DEFAULT_FORMAT = 'YYYY-MM-DD HH:mm:ss'
  var MAX_TIME = '23:59:59'

  var dateToDefaultFormat = function (date) {
    return moment(date).tz('Europe/London').format(DEFAULT_FORMAT)
  }

  var fromDateToApiFormat = function (date, time) {
    return (date) ? moment.tz(`${date} ${time}`, 'DD/M/YYYY HH:mm:ss', 'Europe/London').toISOString() : ''
  }

  const fromDateInTimeZoneToUTCAndIsoFormat = function (date, time, timeZone) {
    return DateTime.fromFormat(`${date} ${time}`, 'dd/M/yyyy H:mm:ss').setZone(timeZone).toUTC().toISO()
  }

  var toDateInTimeZoneToUTCAndIsoFormat = function (date, time, timeZone) {
    var fixedTime = time

    // Increment needed to make the toDate inclusive
    var increment = 1

    if (!time) {
      fixedTime = MAX_TIME
    }

    return (date) ? DateTime.fromFormat(`${date} ${fixedTime}`, 'dd/M/yyyy H:mm:ss').setZone(timeZone).toUTC().plus({ second: increment }).toISO() : ''
  }

  var toDateToApiFormat = function (date, time) {
    var fixedTime = time

    // Increment needed to make the toDate inclusive
    var increment = 1

    if (!time) {
      fixedTime = MAX_TIME
    }

    return (date) ? moment.tz(`${date} ${fixedTime}`, 'DD/M/YYYY HH:mm:ss', 'Europe/London').add(increment, 'second').toISOString() : ''
  }

  var utcToDisplay = function (date) {
    return moment(date).tz('Europe/London').format('DD MMM YYYY — HH:mm:ss')
  }

  const utcToTimeZoneDisplay = function (date, timeZoneToReturnDatesIn) {
    if (date) {
      return DateTime.fromISO(date, { zone: 'UTC' }).setZone(timeZoneToReturnDatesIn).toFormat('dd MMM yyyy - HH:mm:ss')
    }
  }

  const utcToDate = function (date) {
    return moment(date).tz('Europe/London').format('DD MMM YYYY')
  }

  const utcToTime = function (date) {
    return moment(date).tz('Europe/London').format('HH:mm:ss')
  }

  return {
    dateToDefaultFormat: dateToDefaultFormat,
    fromDateToApiFormat: fromDateToApiFormat,
    fromDateInTimeZoneToUTCAndIsoFormat: fromDateInTimeZoneToUTCAndIsoFormat,
    toDateInTimeZoneToUTCAndIsoFormat: toDateInTimeZoneToUTCAndIsoFormat,
    toDateToApiFormat: toDateToApiFormat,
    utcToDisplay: utcToDisplay,
    utcToTimeZoneDisplay: utcToTimeZoneDisplay,
    utcToDate: utcToDate,
    utcToTime: utcToTime
  }
}())
