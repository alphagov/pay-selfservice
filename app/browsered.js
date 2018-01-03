'use strict'
// NPM dependencies
require('babel-polyfill')
const $ = require('jquery')
const multiSelects = require('./browsered/multi-select')
const fieldValidation = require('./browsered/field-validation')
const dashboardActivity = require('./browsered/dashboard-activity')
const analytics = require('./browsered/analytics')

// This adds jquery globally for non-browserified contexts
window.$ = window.jQuery = $

multiSelects.enableMultiSelects()
fieldValidation.enableFieldValidation()
dashboardActivity.init()
dashboardActivity.init()
analytics.init()
