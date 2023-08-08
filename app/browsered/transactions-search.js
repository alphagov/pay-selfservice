'use strict'

const isAPotentialPan = require('../utils/is-a-potential-pan')

module.exports = () => {
  function checkIfReferenceSearchFilterIsAPan () {
    const referenceformGroup = document.querySelector('.transactions-search-reference-form-group')

    if (!referenceformGroup) {
      return
    }

    const FORM_GROUP_ERROR_CSS_CLASS = 'govuk-form-group--error'
    const ERROR_ELEMENT_ID = 'reference-is-potential-pan-error'

    function createErrorElement () {
      const errorElement = document.createElement('p')
      errorElement.id = ERROR_ELEMENT_ID
      errorElement.setAttribute('role', 'alert')
      errorElement.setAttribute('data-cy', 'pan-error')
      errorElement.classList.add('govuk-error-message', 'govuk-!-font-size-16')
      errorElement.innerHTML = 'Reference number must not be a card number'

      return errorElement
    }

    const referenceHintContainer = referenceformGroup.getElementsByClassName('govuk-hint')[0]
    const referenceInputField = referenceformGroup.getElementsByClassName('govuk-input')[0]
    const errorElement = createErrorElement()

    referenceInputField.addEventListener('blur', (event) => {
      if (isAPotentialPan(event.target.value)) {
        referenceformGroup.classList.add(FORM_GROUP_ERROR_CSS_CLASS)
        referenceHintContainer.insertAdjacentElement('afterend', errorElement)
      } else {
        const errorMessage = document.getElementById(ERROR_ELEMENT_ID)
        if (errorMessage) {
          referenceformGroup.classList.remove(FORM_GROUP_ERROR_CSS_CLASS)
          errorMessage.remove()
        }
      }
    }, false)
  }

  checkIfReferenceSearchFilterIsAPan()
}
