import { DateTime } from 'luxon'

export class TimeConstants {
  static get TWELVE_MONTHS_AGO(): DateTime<true> {
    return DateTime.now()
      .setLocale('en-GB')
      .setZone('Europe/London')
      .startOf('day')
      .minus({ years: 1 }) as DateTime<true>
  }

  static get YESTERDAY(): DateTime<true> {
    return DateTime.now()
      .setLocale('en-GB')
      .setZone('Europe/London')
      .startOf('day')
      .minus({ days: 1 }) as DateTime<true>
  }

  static get END_OF_YESTERDAY(): DateTime<true> {
    return DateTime.now().setLocale('en-GB').setZone('Europe/London').minus({ days: 1 }).endOf('day') as DateTime<true>
  }

  static get SEVEN_DAYS_AGO(): DateTime<true> {
    return DateTime.now()
      .setLocale('en-GB')
      .setZone('Europe/London')
      .startOf('day')
      .minus({ days: 7 }) as DateTime<true>
  }

  static get THIRTY_DAYS_AGO(): DateTime<true> {
    return DateTime.now()
      .setLocale('en-GB')
      .setZone('Europe/London')
      .startOf('day')
      .minus({ days: 30 }) as DateTime<true>
  }

  static get START_OF_LAST_MONTH(): DateTime<true> {
    return DateTime.now()
      .setLocale('en-GB')
      .setZone('Europe/London')
      .minus({ months: 1 })
      .startOf('month') as DateTime<true>
  }

  static get END_OF_LAST_MONTH(): DateTime<true> {
    return DateTime.now()
      .setLocale('en-GB')
      .setZone('Europe/London')
      .minus({ months: 1 })
      .endOf('month') as DateTime<true>
  }

  static get SEVEN_YEARS_AGO(): DateTime<true> {
    return DateTime.now()
      .setLocale('en-GB')
      .setZone('Europe/London')
      .minus({ years: 1 })
      .startOf('day') as DateTime<true>
  }
}
