import { DateTime } from 'luxon'

const shortDate = (date?: DateTime) => {
  if (!date?.isValid) {
    return ''
  }

  return date.toFormat('dd LLL yy')
}

const shortTime = (date?: DateTime) => {
  if (!date?.isValid) {
    return ''
  }

  return date.toFormat('H:mm:ss')
}

const europeanDate = (date?: DateTime) => {
  if (!date?.isValid) {
    return ''
  }

  return date?.toFormat('dd/LL/yyyy')
}

const zonedTime = (date?: DateTime) => {
  if (!date?.isValid) {
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
