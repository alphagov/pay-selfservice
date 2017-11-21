'use strict'
// NPM dependencies
require('babel-polyfill')
const $ = require('jquery')
const multiSelects = require('./browsered/multi-select')
const fieldValidation = require('./browsered/field-validation')

// This adds jquery globally for non-browserified contexts
window.$ = window.jQuery = $

multiSelects.enableMultiSelects()
fieldValidation.enableFieldValidation()
