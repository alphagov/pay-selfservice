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
    const originalLabelText = e.target.innerText

    const targetNotificationElement = e.target.dataset.notificationTarget
    const notificationElement = document.getElementsByClassName(targetNotificationElement)[0]

    temp.value = textToCopy
    temp.select()
    document.execCommand('copy')
    temp.remove()
    e.target.innerText = e.target.dataset.success

    if (notificationElement) {
      notificationElement.innerText = e.target.dataset.success
    }

    window.setTimeout(() => {
      e.target.innerText = originalLabelText
    }, 3000)
  }
}
