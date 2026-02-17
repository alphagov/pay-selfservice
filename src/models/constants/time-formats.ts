import { DateTime } from "luxon"

export const ZONED_DATE_TIME = 'dd LLL yy - HH:mm:ss (ZZZ)'
export const DATE_TIME = 'dd LLL yy - HH:mm:ss'
export const TITLE_FRIENDLY_DATE_TIME = 'dd LLL yyyy HH:mm:ss'

export const dateTimeWithOffset = (dateTime: DateTime): string => {
  const offset = dateTime.setZone('Europe/London').isInDST ? ' (BST)' : ' (GMT)'
  return dateTime.toFormat(DATE_TIME) + offset
}
