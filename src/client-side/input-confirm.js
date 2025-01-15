import removeIndefiniteArticles from '@govuk-pay/pay-js-commons/lib/nunjucks-filters/remove-indefinite-articles'
import slugify from '@govuk-pay/pay-js-commons/lib/nunjucks-filters/slugify'

const confirmInput = (e) => {
  const input = e.target
  const value = input.dataset.confirmationFilter === 'slugify' ? slugify(removeIndefiniteArticles(input.value)) : input.value
  const confirmationId = `${input.id}-confirmation`
  const confirmationPrepend = input.dataset.confirmationPrepend || ''
  let confirmation = document.getElementById(confirmationId)

  if (!confirmation) {
    confirmation = document.createElement('div')
    confirmation.innerHTML = `
      <div id="${confirmationId}" class="govuk-inset-text input-confirm">
        <h3 class="govuk-heading-s govuk-!-margin-bottom-2">${input.dataset.confirmationTitle}</h3>
        <p class="govuk-body">
          ${input.dataset.confirmationLabel}<span class="input-confirmation"></span>
        </p>
      </div>`
    input.closest('.govuk-form-group').after(confirmation)
  }

  if (value === '') {
    confirmation.remove()
  } else {
    document
      .querySelector(`#${confirmationId} .input-confirmation`)
      .innerText = confirmationPrepend + value
  }
}

const initConfirmInput = () => {
  const inputs = Array.prototype.slice.call(document.querySelectorAll('[data-confirmation]'))

  inputs.forEach(input => {
    input.addEventListener('input', confirmInput, false)

    if (input.dataset.confirmationDisplay === 'onload') {
      confirmInput({ target: input })
    }
  })
}

export default initConfirmInput
