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

  const formattedDate = date.toFormat('H:mm:ss (ZZZZ)')
  return formattedDate.replace('GMT+1', 'BST')
}

export = {
  shortTime,
  zonedDate,
}
