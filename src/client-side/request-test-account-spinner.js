const disableButtonAndShowSpinner = () => {
  document.getElementById('submit-request-for-psp-test-account-form').hidden = true
  document.getElementById('spinner-container').hidden = false
  document.getElementById('spinner-container').setAttribute('aria-hidden', false)

  document.getElementById('submit-button').setAttribute('disabled', true)
  document.getElementById('submit-button').setAttribute('aria-disabled', true)
}

const requestTestAccountSpinner = () => {
  const requestTestAccountForm = document.getElementById('submit-request-for-psp-test-account-form')
  if (!requestTestAccountForm) return
  document.getElementById('submit-button').addEventListener('click', function () {
    disableButtonAndShowSpinner()
    document.getElementById('submit-request-for-psp-test-account-form').requestSubmit()
  })
}

export default requestTestAccountSpinner
