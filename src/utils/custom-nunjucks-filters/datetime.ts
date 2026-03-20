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
  const date = DateTime.fromISO(dateString).setZone('Europe/London')
  if (!date.isValid) {
    return ''
  }

  const offset = date.isInDST ? 'BST' : 'GMT'
  return `${date.toFormat('H:mm:ss')} (${offset})`
}

export = {
  shortDate,
  shortTime,
  zonedTime,
  europeanDate,
}
