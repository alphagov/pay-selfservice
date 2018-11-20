'use strict'

// NPM dependencies
const $ = window.$ = window.jQuery = require('jquery') // Put this on window for cross compatability

// Local dependencies
const multiSelects = require('./browsered/multi-select')
const fieldValidation = require('./browsered/field-validation')
const dashboardActivity = require('./browsered/dashboard-activity')
const targetToShow = require('./browsered/target-to-show')
const analytics = require('gaap-analytics')
const inputConfirm = require('./browsered/input-confirm')
const niceURL = require('./browsered/nice-url')
const copyText = require('./browsered/copy-text')
const accessibleAutocomplete = require('./browsered/autocomplete')

// GOV.UK Frontend js bundle
const GOVUKFrontend = require('govuk-frontend')

multiSelects.enableMultiSelects()
fieldValidation.enableFieldValidation()
dashboardActivity.init()
targetToShow.init()
analytics.eventTracking.init()
analytics.virtualPageview.init()
inputConfirm()
niceURL()
copyText()
accessibleAutocomplete()
GOVUKFrontend.initAll()
