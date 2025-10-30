import moment from 'moment-timezone'

const TIMEZONE = 'Europe/London'
const DEFAULT_FORMAT = 'YYYY-MM-DD HH:mm:ss'
const API_INPUT_FORMAT = 'D/M/YYYY HH:mm:ss' // accept single-digit day/month
const MAX_TIME = '23:59:59'
const INCREMENT_SECONDS = 1

function dateToApiString(date: string | Date): string {
  return date instanceof Date ? moment(date).format('D/M/YYYY') : date
}

function safeMomentForFormatting(date: string | Date) {
  if (date instanceof Date) {
    return moment(date).tz(TIMEZONE)
  }
  return moment(date, moment.ISO_8601, true).tz(TIMEZONE)
}

export function dateToDefaultFormat(date: string | Date): string {
  return safeMomentForFormatting(date).format(DEFAULT_FORMAT)
}

export function fromDateToApiFormat(date?: string | Date, time?: string): string | null {
  if (!date) return ''
  const dateStr = dateToApiString(date)
  const timeStr = time ?? '00:00:00'
  const m = moment(`${dateStr} ${timeStr}`, API_INPUT_FORMAT, true).tz(TIMEZONE)
  return m.isValid() ? m.toISOString() : null
}

export function toDateToApiFormat(date?: string | Date, time?: string): string | null {
  if (!date) return ''
  const dateStr = dateToApiString(date)
  const fixedTime = time ?? MAX_TIME
  const m = moment(`${dateStr} ${fixedTime}`, API_INPUT_FORMAT, true).tz(TIMEZONE)
  if (!m.isValid()) return null
  m.add(INCREMENT_SECONDS, 'second')
  return m.toISOString()
}

export function utcToDisplay(date: string | Date): string {
  return safeMomentForFormatting(date).format('DD MMM YYYY — HH:mm:ss')
}

export function utcToDate(date: string | Date): string {
  return safeMomentForFormatting(date).format('DD MMM YYYY')
}

export function utcToTime(date: string | Date): string {
  return safeMomentForFormatting(date).format('HH:mm:ss')
}

export function isBritishSummerTime(): boolean {
  return moment().tz(TIMEZONE).isDST()
}
