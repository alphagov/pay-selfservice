import { DateTime } from 'luxon'

export function parseDateTime(date: string, time: string, includeTime: boolean): DateTime {
  if (includeTime && time !== '') {
    const dateTime = `${date} ${time}`
    return DateTime.fromFormat(dateTime, 'dd/LL/yyyy H:mm:ss')
  }
  return DateTime.fromFormat(date, 'dd/LL/yyyy')
}
