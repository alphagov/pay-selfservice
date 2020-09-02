'use strict'

const every = require('lodash/every')

// Polyfills introduced as a temporary fix to make Smoketests pass. See PP-3489
require('./polyfills')

const checks = require('./field-validation-checks')

// Global constants
const validationErrorsTemplate = require('../views/includes/validation-errors.njk')

const ERROR_MESSAGE_CLASS = '.govuk-error-message'
const ERROR_SUMMARY_CLASS = '.govuk-error-summary'
const FORM_GROUP = '.govuk-form-group'
const FORM_GROUP_WITH_ERROR = '.govuk-form-group--error'
const FORM_GROUP_ERROR_CLASSNAME = 'govuk-form-group--error'
const ERROR_LABEL_CLASSNAME = 'govuk-error-message'

exports.enableFieldValidation = function () {
  const allForms = Array.prototype.slice.call(document.getElementsByTagName('form'))

  allForms.filter(form => {
    return form.hasAttribute('data-validate')
  }).map(form => {
    return form.addEventListener('submit', initValidation, false)
  })
}

function initValidation (e) {
  const form = e.target
  e.preventDefault()
  clearPreviousErrors()

  const validatedFields = findFields(form)
    .map(field => validateField(form, field))

  if (every(validatedFields)) {
    form.submit()
  } else {
    populateErrorSummary(form)
  }
}

function clearPreviousErrors () {
  const previousErrorsMessages = Array.prototype.slice.call(document.querySelectorAll(`${ERROR_MESSAGE_CLASS}, ${ERROR_SUMMARY_CLASS}`))
  const previousErrorsFields = Array.prototype.slice.call(document.querySelectorAll(FORM_GROUP_WITH_ERROR))
  const previousErroredInputs = Array.prototype.slice.call(document.querySelectorAll('.govuk-input--error'))

  previousErroredInputs.map(errorField => errorField.classList.remove('govuk-input--error'))
  previousErrorsMessages.map(error => error.remove())
  previousErrorsFields.map(errorField => errorField.classList.remove(FORM_GROUP_ERROR_CLASSNAME))
}

function findFields (form) {
  const formFields = Array.prototype.slice.call(form.querySelectorAll('input, textarea, select'))

  return formFields.filter(field => {
    return field.hasAttribute('data-validate')
  })
}

function validateField (form, field) {
  let result
  const validationTypes = field.getAttribute('data-validate').split(' ')

  validationTypes.forEach(validationType => {
    switch (validationType) {
      case 'currency':
        result = checks.isCurrency(field.value)
        break
      case 'email':
        result = checks.isValidEmail(field.value)
        break
      case 'phone':
        result = checks.isPhoneNumber(field.value)
        break
      case 'https':
        result = checks.isHttps(field.value)
        break
      case 'belowMaxAmount':
        result = checks.isAboveMaxAmount(field.value)
        break
      case 'passwordLessThanTenChars':
        result = checks.isPasswordLessThanTenChars(field.value)
        break
      case 'isFieldGreaterThanMaxLengthChars':
        result = checks.isFieldGreaterThanMaxLengthChars(field.value, field.getAttribute('data-validate-max-length'))
        break
      case 'isNaxsiSafe':
        result = checks.isNaxsiSafe(field.value)
        break
      case 'accountNumber':
        result = checks.isNotAccountNumber(field.value)
        break
      case 'sortCode':
        result = checks.isNotSortCode(field.value)
        break
      case 'vatNumber':
        result = checks.isNotVatNumber(field.value)
        break
      default:
        result = checks.isEmpty(field.value)
        break
    }
    if (result) {
      applyErrorMessaging(form, field, result)
    }
  })

  return !field.closest(FORM_GROUP).classList.contains(FORM_GROUP_ERROR_CLASSNAME)
}

function applyErrorMessaging (form, field, result) {
  field.classList.add('govuk-input--error')
  const formGroup = field.closest(FORM_GROUP)
  if (!formGroup.classList.contains(FORM_GROUP_ERROR_CLASSNAME)) {
    formGroup.classList.add(FORM_GROUP_ERROR_CLASSNAME)
    document.querySelector('label[for="' + field.id + '"]').insertAdjacentHTML('beforeend',
      `<span class="${ERROR_LABEL_CLASSNAME}">${result}</span>`)
  }
}

function getLabel (field) {
  if (field.hasAttribute('data-validate-override-label')) {
    const overrideField = field.getAttribute('data-validate-override-label')
    const overrideLabel = document.querySelector('label[for="' + overrideField + '"]')
    if (overrideLabel) {
      return overrideLabel
    }
  }
  return field
}

function populateErrorSummary (form) {
  const erroringFieldLabels = Array.prototype.slice.call(form.querySelectorAll(`${FORM_GROUP_WITH_ERROR} label`))

  const erroringFieldLabelsAndIds = erroringFieldLabels.map(field => {
    const label = getLabel(field).innerHTML.split('<')[0].trim()
    const id = field.getAttribute('for')
    return { label, id }
  })

  const erroringFieldLabelsAndIdsDuplicateLabelsRemoved = erroringFieldLabelsAndIds.filter((field, index, fields) => {
    return fields.indexOf(fields.find(f => f.label === field.label)) >= index
  })

  const configuration = {
    fields: erroringFieldLabelsAndIdsDuplicateLabelsRemoved
  }

  form.parentNode.insertAdjacentHTML(
    'afterbegin',
    validationErrorsTemplate(configuration)
  )
  window.scroll(0, 0)
}
