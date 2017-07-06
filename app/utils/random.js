'use strict'

function randomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomUuid () {
  // See:
  // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function key (length) {
  let buf = []
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const charlen = chars.length

  for (let i = 0; i < length; ++i) {
    buf.push(chars[randomInt(0, charlen - 1)])
  }

  return buf.join('')
}

module.exports = {
  randomInt: randomInt,
  randomUuid: randomUuid,
  key: key
}
