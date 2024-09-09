(function () {
  if (document.getElementById('submit-button')) {
    document.getElementById('submit-button').addEventListener('click', function () {
      disableButtonAndShowSpinner()
      document.getElementById('submit-request-for-psp-test-account-form').requestSubmit()
    })
  }

  function disableButtonAndShowSpinner () {
    document.getElementById('submit-request-for-psp-test-account-form').hidden = true
    document.getElementById('spinner-container').hidden = false
    document.getElementById('spinner-container').setAttribute('aria-hidden', false)

    document.getElementById('submit-button').setAttribute('disabled', true)
    document.getElementById('submit-button').setAttribute('aria-disabled', true)
    document.getElementById('submit-button').setAttribute('class', 'govuk-button govuk-button--disabled')
  }
})()
