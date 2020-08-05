'use strict'

// Local contants
const AMOUNT_FORMAT = /^([0-9]+)(?:\.([0-9]{1,2}))?$/

const penceToPounds = amount => {
  return (amount / 100).toFixed(2)
}

const poundsToPence = amount => {
  return (amount * 100).toFixed(0)
}

const penceToPoundsWithCurrency = amount => {
  return new Intl.NumberFormat('en-gb', { style: 'currency', currency: 'GBP' }).format(penceToPounds(amount))
}

const sanitisePoundsAndPenceInput = amount => {
  if (amount) {
    const cleanedCurrencyString = amount.replace(/[^0-9.-]+/g, '')
    const result = AMOUNT_FORMAT.exec(cleanedCurrencyString)

    if (result) {
      const pounds = result[1]
      let pence = result[2]

      if (pence === undefined) {
        pence = '00'
      } else if (pence.length === 1) {
        pence = pence + '0'
      }
      return parseInt(pounds + pence)
    } else {
      return null
    }
  }
}

module.exports = {
  penceToPounds,
  poundsToPence,
  penceToPoundsWithCurrency,
  sanitisePoundsAndPenceInput
}
