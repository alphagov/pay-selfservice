'use strict'

require('@babel/polyfill')

const multiSelects = require('./browsered/multi-select')
const targetToShow = require('./browsered/target-to-show')
const analytics = require('gaap-analytics')
const inputConfirm = require('./browsered/input-confirm')
const niceURL = require('./browsered/nice-url')
const copyText = require('./browsered/copy-text')
const accessibleAutocomplete = require('./browsered/autocomplete')
const checkboxRowSelection = require('./browsered/checkbox-row-selection')
const cookieBanner = require('./browsered/cookie-banner')
const printButton = require('./browsered/print-button')
const transactionsSearch = require('./browsered/transactions-search')

// GOV.UK Frontend js bundle
const GOVUKFrontend = require('govuk-frontend')

GOVUKFrontend.initAll() // Needs to be first

multiSelects.enableMultiSelects()
targetToShow.init()
analytics.eventTracking.init()
analytics.virtualPageview.init()
inputConfirm()
niceURL()
copyText()
accessibleAutocomplete()
checkboxRowSelection()
cookieBanner.initCookieBanner()
printButton()
transactionsSearch()
