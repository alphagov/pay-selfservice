'use strict'

module.exports = () => {
  const buttons = Array.prototype.slice.call(document.querySelectorAll('[data-print-button]'))

  buttons.forEach(button => {
    button.addEventListener('click', printPolicy, false)
  })

  function printPolicy () {
    window.print()
  }
}
