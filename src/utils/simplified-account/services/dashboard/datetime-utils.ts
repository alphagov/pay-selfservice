import { DateTime, DateTimeFormatOptions } from 'luxon'
import { TimeConstants } from '@utils/time/time-constants'

export const Period: Record<string, Period> = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  PREVIOUS_SEVEN_DAYS: 'previous-seven-days',
  PREVIOUS_THIRTY_DAYS: 'previous-thirty-days',
  PREVIOUS_MONTH: 'previous-month',
  LAST_12_MONTHS: 'last-12-months',
  ALL_TIME: 'all-time',
}

export type Period =
  | 'today'
  | 'yesterday'
  | 'previous-seven-days'
  | 'previous-thirty-days'
  | 'previous-month'
  | 'last-12-months'
  | 'all-time'

export const TRANSACTION_FILTER_PERIODS: Set<Period> = new Set<Period>([
  Period.TODAY,
  Period.YESTERDAY,
  Period.PREVIOUS_MONTH,
  Period.TODAY,
  Period.ALL_TIME,
])

interface DateTimeRange {
  start: DateTime<true> | undefined
  end: DateTime<true> | undefined
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

export function getPeriodUKDateTimeRange(period: Period | undefined): DateTimeRange {
  const now = DateTime.now().setLocale('en-GB').setZone('Europe/London') as DateTime<true>

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
        start: undefined,
        end: undefined,
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
