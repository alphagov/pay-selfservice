'use strict'

const _ = require('lodash')
const commonPassword = require('common-password')

const emailValidator = require('./email-tools.js')
const { invalidTelephoneNumber } = require('../utils/validation/telephone-number-validation')

// Constants
const MIN_PASSWORD_LENGTH = 10
const NUMBERS_ONLY = new RegExp('^[0-9]+$')

// Global functions

const hasValue = param => {
  return !_.isEmpty(_.trim(param))
}

module.exports = {
  shouldProceedWithRegistration: registerInviteCookie => {
    return new Promise((resolve, reject) => {
      if (!registerInviteCookie) {
        reject(new Error('request does not contain a cookie'))
      }

      if (hasValue(registerInviteCookie.email) && hasValue(registerInviteCookie.code)) {
        resolve()
      } else {
        reject(new Error('registration cookie does not contain the email and/or code'))
      }
    })
  }
}
