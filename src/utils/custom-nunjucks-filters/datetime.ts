import { DateTime } from 'luxon'

const shortDate = (dateString: string) => {
  const date = DateTime.fromISO(dateString)
  if (!date.isValid) {
    return ''
  }

  return date.toFormat('dd LLL yy')
}

const shortTime = (dateString: string) => {
  const date = DateTime.fromISO(dateString)
  if (!date.isValid) {
    return ''
  }

  return date.toFormat('H:mm:ss')
}

const europeanDate = (dateString: string) => {
  const date = DateTime.fromISO(dateString)
  if (!date.isValid) {
    return ''
  }

  return date.toFormat('dd/LL/yyyy')
}

const zonedTime = (dateString: string) => {
  const date = DateTime.fromISO(dateString)
  if (!date.isValid) {
    return ''
  }

  const formattedDate = date.toFormat('H:mm:ss (ZZZZ)')
  return formattedDate.replace('GMT+1', 'BST')
}

export = {
  shortDate,
  shortTime,
  zonedTime,
  europeanDate,
}
