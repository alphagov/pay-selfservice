import isAPotentialPan from '@utils/is-a-potential-pan'

const initReferenceSearchPanCheck = () => {
  const referenceFormGroup = document.querySelector('.transactions-search-reference-form-group')

  if (!referenceFormGroup) {
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

  const referenceHintContainer = referenceFormGroup.getElementsByClassName('govuk-hint')[0]
  /** @type {HTMLInputElement} */
  const referenceInputField = referenceFormGroup.getElementsByClassName('govuk-input')[0]
  const errorElement = createErrorElement()

  referenceInputField.addEventListener('blur', (event) => {
    if (isAPotentialPan(event.target.value)) {
      referenceFormGroup.classList.add(FORM_GROUP_ERROR_CSS_CLASS)
      referenceHintContainer.insertAdjacentElement('afterend', errorElement)
    } else {
      const errorMessage = document.getElementById(ERROR_ELEMENT_ID)
      if (errorMessage) {
        referenceFormGroup.classList.remove(FORM_GROUP_ERROR_CSS_CLASS)
        errorMessage.remove()
      }
    }
  }, false)
}

export default initReferenceSearchPanCheck
