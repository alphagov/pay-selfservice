const currencyFormatter = require('currency-formatter')

module.exports = amountInPence => {
  return currencyFormatter.format((amountInPence / 100).toFixed(2), {code: 'GBP'})
}
