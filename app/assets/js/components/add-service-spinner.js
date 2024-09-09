
(function () {
  document.getElementById('submit-button').addEventListener('click', function () {
    if (document.getElementById('org-type-local').checked) {
      disableButtonAndShowSpinner()
    }
    document.getElementById('add-service-form').requestSubmit()
  })

  function disableButtonAndShowSpinner () {
    document.getElementById('add-service-form').hidden = true
    document.getElementById('spinner-container').hidden = false
    document.getElementById('spinner-container').setAttribute('aria-hidden', false)

    document.getElementById('submit-button').setAttribute('disabled', true)
    document.getElementById('submit-button').setAttribute('aria-disabled', true)
    document.getElementById('submit-button').setAttribute('class', 'govuk-button govuk-button--disabled')
  }
})()
