import { DateTime } from 'luxon'
import { TRANSACTION_SEARCH_DATE_TIME_FORMAT, TRANSACTION_SEARCH_DATE_FORMAT } from '@utils/time/time-formats'

export function parseTransactionSearchDateTime(date: string, time: string, includeTime: boolean): DateTime {
  if (includeTime && time !== '') {
    const dateTime = `${date} ${time}`
    return DateTime.fromFormat(dateTime, TRANSACTION_SEARCH_DATE_TIME_FORMAT, { zone: 'Europe/London' })
  }
  return DateTime.fromFormat(date, TRANSACTION_SEARCH_DATE_FORMAT, { zone: 'Europe/London' })
}
