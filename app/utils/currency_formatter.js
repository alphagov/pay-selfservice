'use strict'

// if 10.50 is input result will equal
// ["10.50", "10", "50"]

const AMOUNT_FORMAT = /^([0-9]+)(?:\.([0-9]{1,2}))?$/

module.exports = (currencyString) => {
  if (currencyString) {
    const cleanedCurrencyString = currencyString.replace(/[^0-9.-]+/g, '')
    const result = AMOUNT_FORMAT.exec(cleanedCurrencyString)

    if (result) {
      const pounds = result[1]
      let pence = result[2]

      if (pence === undefined) {
        pence = '00'
      } else if (pence.length === 1) {
        pence = pence + '0'
      }
      return pounds + '.' + pence
    } else {
      return null
    }
  }
}
