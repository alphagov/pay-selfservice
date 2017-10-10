'use strict'
// NPM dependencies
const $ = require('jquery')
const multiSelects = require('./client-side-scripts/multi-select')
const fieldValidation = require('./browsered/field-validation')

// This adds jquery globally for non-browserified contexts
window.$ = window.jQuery = $

multiSelects.enableMultiSelects()
fieldValidation.enableFieldValidation()
