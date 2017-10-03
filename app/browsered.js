'use strict'
// NPM dependencies
const $ = require('jquery')
const multiSelects = require('./client-side-scripts/multi-select')

// This adds jquery globally for non-browserified contexts
window.$ = window.jQuery = $

multiSelects.enableMultiSelects()
