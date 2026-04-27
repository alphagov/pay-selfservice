import { DateTime } from 'luxon'

export class TimeConstants {
  static get TWELVE_MONTHS_AGO(): DateTime<true> {
    return DateTime.now()
      .setLocale('en-GB')
      .setZone('Europe/London')
      .startOf('day')
      .minus({ years: 1 }) as DateTime<true>
  }
}
