import { DateTime } from 'luxon'
import { TRANSACTION_SEARCH_DATE_TIME_FORMAT, TRANSACTION_SEARCH_DATE_FORMAT } from '@utils/time/time-formats'

export function parseTransactionSearchDateTime(
  date: string,
  time: string,
  includeTime: boolean,
  defaultValue: DateTime<true>
): DateTime<true> {
  let parsed
  if (includeTime && time !== '') {
    const dateTime = `${date} ${time}`
    parsed = DateTime.fromFormat(dateTime, TRANSACTION_SEARCH_DATE_TIME_FORMAT, { zone: 'Europe/London' })
  } else {
    parsed = DateTime.fromFormat(date, TRANSACTION_SEARCH_DATE_FORMAT, { zone: 'Europe/London' })
  }

  return parsed.isValid ? parsed : defaultValue
}
