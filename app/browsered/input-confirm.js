'use strict'

const slugify = require('../utils/nunjucks-filters/slugify')

module.exports = () => {
  const inputs = document.querySelectorAll('[data-confirmation]')

  inputs.forEach(input => {
    input.addEventListener('input', confirmInput, false)
  })

  function confirmInput (e) {
    const input = e.target
    // using slugify and also stripping out the (in)definite article (the/a/an)
    let value = input.dataset.confirmationFilter === 'slugify' ? slugify(input.value.replace(/\ba\s|\ban\s|\bthe\b/gi, '')) : input.value
    const confirmationId = `${input.id}-confirmation`
    const confirmationPrepend = input.dataset.confirmationPrepend || ''
    let confirmation = document.getElementById(confirmationId)

    if (!confirmation) {
      confirmation = document.createElement('div')
      confirmation.innerHTML = `
      <div id="${confirmationId}" class="form-group panel panel-border-wide input-confirm">
        <h3 class="heading-small">${input.dataset.confirmationTitle}</h3>
        <p class="">
          ${input.dataset.confirmationLabel}<span class="input-confirmation"></span>
        </p>
      </div>`
      input.closest('.form-group').after(confirmation)
    }

    if (value === '') {
      confirmation.remove()
    } else {
      document
        .querySelector(`#${confirmationId} .input-confirmation`)
        .innerText = confirmationPrepend + value
    }
  }
}
