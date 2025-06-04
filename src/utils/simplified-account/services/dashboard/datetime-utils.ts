import { DateTime, DateTimeFormatOptions } from 'luxon'

export type Period = 'today' | 'yesterday' | 'previous-seven-days' | 'previous-thirty-days'

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
  hour12: true
} as DateTimeFormatOptions

export function getPeriodUKDateTimeRange(period: Period): DateTimeRange {
  const now = DateTime.now()
    .setLocale('en-GB')
    .setZone('Europe/London')
  const yesterday = now.minus({ days: 1 })

  switch (period) {
    case 'yesterday':
      return {
        start: yesterday.startOf('day'),
        end: yesterday.endOf('day'),
      }

    case 'previous-seven-days':
      return {
        start: yesterday.minus({ days: 6 }).startOf('day'),
        end: yesterday.endOf('day'),
      }

    case 'previous-thirty-days':
      return {
        start: yesterday.minus({ days: 29 }).startOf('day'),
        end: yesterday.endOf('day'),
      }

    default:
      // today
      return {
        start: now.startOf('day'),
        end: now,
      }
  }
}
