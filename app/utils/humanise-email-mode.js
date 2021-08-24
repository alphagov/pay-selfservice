'use strict'

module.exports = function humaniseEmailMode (mode) {
  if (mode === 'OFF') {
    return 'Off'
  }
  return `On (${mode.toLowerCase()})`
}
