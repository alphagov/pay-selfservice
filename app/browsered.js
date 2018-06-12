'use strict'

// NPM dependencies
require('babel-polyfill')
const $ = window.$ = window.jQuery = require('jquery') // Put this on window for cross compatability

// Local dependencies
const multiSelects = require('./browsered/multi-select')
const {browsered} = require('@govuk-pay/pay-js-commons')
const dashboardActivity = require('./browsered/dashboard-activity')
const targetToShow = require('./browsered/target-to-show')
const analytics = require('gaap-analytics')
const inputConfirm = require('./browsered/input-confirm')
const niceURL = require('./browsered/nice-url')
const copyText = require('./browsered/copy-text')

// GOV.UK Frontend Toolkit dependencies
require('../govuk_modules/govuk_frontend_toolkit/javascripts/govuk/show-hide-content')

multiSelects.enableMultiSelects()
browsered.fieldValidation.enableFieldValidation()
dashboardActivity.init()
targetToShow.init()
analytics.eventTracking.init()
analytics.virtualPageview.init()
inputConfirm()
niceURL()
copyText()

$(document).ready($ => {
  const showHideContent = new window.GOVUK.ShowHideContent()
  showHideContent.init()
})
