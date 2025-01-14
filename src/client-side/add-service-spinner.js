const disableButtonAndShowSpinner = () => {
  document.getElementById('add-service-form').hidden = true
  document.getElementById('spinner-container').hidden = false
  document.getElementById('spinner-container').setAttribute('aria-hidden', false)

  document.getElementById('submit-button').setAttribute('disabled', true)
  document.getElementById('submit-button').setAttribute('aria-disabled', true)
}

const addServiceSpinner = () => {
  const addServiceForm = document.getElementById('add-service-form')
  const submitButton = document.getElementById('submit-button')
  if (!addServiceForm || !submitButton) return
  submitButton.addEventListener('click', () => {
    if (document.getElementById('org-type-local')?.checked) {
      disableButtonAndShowSpinner()
    }
    addServiceForm.requestSubmit()
  })
}

export default addServiceSpinner
