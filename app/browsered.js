'use strict'

// Include Sass root file so that Webpack makes it
require('./assets/sass/application.scss')

// NPM dependencies
require('babel-polyfill')
const $ = require('jquery')
const multiSelects = require('./browsered/multi-select')
const fieldValidation = require('./browsered/field-validation')
const dashboardActivity = require('./browsered/dashboard-activity')

// This adds jquery globally for non-browserified contexts
window.$ = window.jQuery = $

multiSelects.enableMultiSelects()
fieldValidation.enableFieldValidation()
dashboardActivity.init()

if (process.env.NODE_ENV !== 'production') {
  module.hot.accept()
}
