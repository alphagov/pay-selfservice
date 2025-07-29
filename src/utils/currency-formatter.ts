const AMOUNT_FORMAT = /^([0-9]+)(?:\.([0-9]{1,2}))?$/

const penceToPounds = (amount: number) => {
  return (amount / 100).toFixed(2)
}

const poundsToPence = (amount: number) => {
  return Math.floor(amount * 100)
}

const penceToPoundsWithCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-gb', {
    style: 'currency',
    currency: 'GBP',
  }).format(+penceToPounds(amount))
}

const safeConvertPoundsStringToPence = (amount: string) => {
  if (amount) {
    console.log(amount)
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

export { penceToPounds, poundsToPence, penceToPoundsWithCurrency, safeConvertPoundsStringToPence }
