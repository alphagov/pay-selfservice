import { DateTime, DateTimeFormatOptions } from 'luxon'
import { TimeConstants } from '@utils/time/time-constants'

export type Period =
  | 'today'
  | 'yesterday'
  | 'previous-seven-days'
  | 'previous-thirty-days'
  | 'previous-month'
  | 'last-12-months'
  | 'all-time'

interface DateTimeRange {
  start: DateTime
  end: DateTime
}

export const DT_FULL = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: undefined,
  timeZoneName: 'short',
  hour12: true,
} as DateTimeFormatOptions

export function getPeriodUKDateTimeRange(period: Period): DateTimeRange {
  const now = DateTime.now().setLocale('en-GB').setZone('Europe/London')

  switch (period) {
    case 'yesterday':
      return {
        start: TimeConstants.YESTERDAY,
        end: TimeConstants.YESTERDAY.endOf('day'),
      }

    case 'previous-seven-days':
      return {
        start: TimeConstants.SEVEN_DAYS_AGO,
        end: TimeConstants.END_OF_YESTERDAY,
      }

    case 'previous-thirty-days':
      return {
        start: TimeConstants.THIRTY_DAYS_AGO,
        end: TimeConstants.END_OF_YESTERDAY,
      }

    case 'previous-month': {
      return {
        start: TimeConstants.START_OF_LAST_MONTH,
        end: TimeConstants.END_OF_LAST_MONTH,
      }
    }

    case 'last-12-months': {
      return {
        start: TimeConstants.TWELVE_MONTHS_AGO,
        end: now,
      }
    }

    case 'all-time': {
      return {
        start: TimeConstants.SEVEN_YEARS_AGO,
        end: now,
      }
    }

    default:
      // today
      return {
        start: now.startOf('day'),
        end: now,
      }
  }
}
