'use strict'

// NPM Dependencies
const lodash = require('lodash')

// Local Dependencies
const checks = require('./field-validation-checks')
const validationErrorsTemplate = require('../views/includes/validation-errors.html')

exports.enableFieldValidation = function () {
  const allForms = Array.prototype.slice.call(document.getElementsByTagName('form'))

  allForms.filter(form => {
    return form.hasAttribute('data-validate')
  }).map(form => {
    form.addEventListener('submit', initValidation, false)
  })
}

function initValidation (e) {
  let form = e.target
  e.preventDefault()
  clearPreviousErrors()

  let validatedFields = findFields(form)
  .map(field => validateField(form, field))

  if (lodash.every(validatedFields)) {
    form.submit()
  } else {
    populateErrorSummary(form)
  }
}

function clearPreviousErrors () {
  let previousErrorsMessages = Array.prototype.slice.call(document.querySelectorAll('.error-message, .error-summary'))
  let previousErrorsFields = Array.prototype.slice.call(document.querySelectorAll('.form-group.error'))

  previousErrorsMessages.map(error => error.remove())
  previousErrorsFields.map(errorField => errorField.classList.remove('error'))
}

function findFields (form) {
  const formFields = Array.prototype.slice.call(form.querySelectorAll('input, textarea, select'))

  return formFields.filter(field => {
    return field.hasAttribute('data-validate')
  })
}

function validateField (form, field) {
  let result
  let validationTypes = field.getAttribute('data-validate').split(' ')

  validationTypes.forEach(validationType => {
    switch (validationType) {
      case 'currency' :
        result = checks.isCurrency(field.value)
        break
      case 'email' :
        result = checks.isValidEmail(field.value)
        break
      case 'phone' :
        result = checks.isPhoneNumber(field.value)
        break
      case 'https' :
        result = checks.isHttps(field.value)
        break
      default :
        result = checks.isEmpty(field.value)
        break
    }
    if (result) {
      applyErrorMessaging(form, field, result)
    }
  })

  if (!result) {
    return true
  }
}

function applyErrorMessaging (form, field, result) {
  let formGroup = field.closest('.form-group')
  if (!formGroup.classList.contains('error')) {
    formGroup.classList.add('error')
    document.querySelector('label[for="' + field.name + '"]').insertAdjacentHTML('beforeend',
      '<span class="error-message">' + result + '</span>')
  }
}

function populateErrorSummary (form) {
  let erroringFields = Array.prototype.slice.call(form.querySelectorAll('.form-group.error label'))
  let configuration = {
    field: erroringFields.map(field => {
      let label = field.innerHTML.split('<')[0].trim()
      let id = field.getAttribute('for')
      return {label, id}
    })
  }

  form.parentNode.insertAdjacentHTML(
    'afterbegin',
    validationErrorsTemplate.render(configuration)
  )
  window.scroll(0, 0)
}
