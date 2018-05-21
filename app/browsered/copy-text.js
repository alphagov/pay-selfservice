'use strict'

module.exports = () => {
  const buttons = Array.prototype.slice.call(document.querySelectorAll('[data-copy-text]'))

  buttons.forEach(button => {
    button.addEventListener('click', copyText, false)
  })

  function copyText (e) {
    const temp = document.createElement('input')
    document.body.appendChild(temp)
    const targetElement = e.target.dataset.target
    const textToCopy = document.getElementsByClassName(targetElement)[0].innerText

    temp.value = textToCopy
    temp.select()
    document.execCommand('copy')
    temp.remove()
    e.target.innerText = e.target.dataset.success
  }
}
