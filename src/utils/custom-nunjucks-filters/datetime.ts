import { DateTime } from 'luxon'

const shortTime = (dateString: string) => {
  const date = DateTime.fromISO(dateString)
  if (!date.isValid) {
    return ''
  }

  return date.toFormat('dd LLL yy')
}

const zonedDate = (dateString: string) => {
  const date = DateTime.fromISO(dateString)
  if (!date.isValid) {
    return ''
  }

  return date.toFormat('HH:MM:SS (ZZZZ)')
}

export = {
  shortTime,
  zonedDate,
}
