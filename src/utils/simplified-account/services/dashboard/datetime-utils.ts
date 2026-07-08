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

const VALID_PERIODS = new Set(Object.values(Period))

function isValidPeriod(period: unknown): period is Period {
  return VALID_PERIODS.has(period as Period)
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
  valid: boolean
  period: Period
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

export function getPeriodUKDateTimeRange(period: unknown): DateTimeRange {
  if (!isValidPeriod(period)) {
    // today
    return {
      start: TimeConstants.TODAY,
      end: TimeConstants.END_OF_TODAY,
      valid: false,
      period: Period.TODAY,
    }
  }

  switch (period) {
    case 'today':
      return {
        start: TimeConstants.TODAY,
        end: TimeConstants.END_OF_TODAY,
        valid: true,
        period: Period.TODAY,
      }

    case 'yesterday':
      return {
        start: TimeConstants.YESTERDAY,
        end: TimeConstants.YESTERDAY.endOf('day'),
        valid: true,
        period: Period.YESTERDAY,
      }

    case 'previous-seven-days':
      return {
        start: TimeConstants.SEVEN_DAYS_AGO,
        end: TimeConstants.END_OF_YESTERDAY,
        valid: true,
        period: Period.PREVIOUS_SEVEN_DAYS,
      }

    case 'previous-thirty-days':
      return {
        start: TimeConstants.THIRTY_DAYS_AGO,
        end: TimeConstants.END_OF_YESTERDAY,
        valid: true,
        period: Period.PREVIOUS_THIRTY_DAYS,
      }

    case 'previous-month': {
      return {
        start: TimeConstants.START_OF_LAST_MONTH,
        end: TimeConstants.END_OF_LAST_MONTH,
        valid: true,
        period: Period.PREVIOUS_MONTH,
      }
    }

    case 'last-12-months': {
      return {
        start: TimeConstants.TWELVE_MONTHS_AGO,
        end: TimeConstants.END_OF_TODAY,
        valid: true,
        period: Period.LAST_12_MONTHS,
      }
    }

    case 'all-time': {
      return {
        start: undefined,
        end: undefined,
        valid: true,
        period: Period.ALL_TIME,
      }
    }
  }
}

export function dateRangeAsPeriod(fromDate: string, toDate: string, dateFormat?: string): Period | undefined {
  const format = dateFormat ?? 'dd/LL/yyyy'

  const periods: Period[] = ['today', 'yesterday', 'previous-month', 'last-12-months', 'all-time']

  return periods.find((period) => {
    const range = getPeriodUKDateTimeRange(period)

    return range.start?.toFormat(format) === fromDate && range.end?.toFormat(format) === toDate
  })
}
