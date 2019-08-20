'use strict'

module.exports = () => {
  const rows = document.querySelectorAll('.checkbox-row-selection tr')

  function clickRow (event) {
    if (event.target.type !== 'checkbox') {
      const checkbox = [...event.target.parentNode.querySelectorAll('.payment-types-checkbox')][0]
      if (checkbox) checkbox.click()
    }
  }

  rows.forEach(row => {
    row.addEventListener('click', clickRow, false)
  })
}
