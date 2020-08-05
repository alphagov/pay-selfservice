'use strict'

// NPM dependencies
const _ = require('lodash')
const commonPassword = require('common-password')

// Local dependencies
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
  },

  validateUserRegistrationInputs: (telephoneNumber, password) => {
    return new Promise((resolve, reject) => {
      if (invalidTelephoneNumber(telephoneNumber)) {
        reject(new Error('Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192'))
      }

      if (!password || password.length < MIN_PASSWORD_LENGTH) {
        reject(new Error('Your password must be at least 10 characters.'))
      } else if (commonPassword(password)) {
        reject(new Error('The password you tried to create contains a common phrase or combination of characters. Choose something that’s harder to guess.'))
      } else {
        resolve()
      }
    })
  },

  validateRegistrationTelephoneNumber: (telephoneNumber) => {
    return new Promise((resolve, reject) => {
      if (invalidTelephoneNumber(telephoneNumber)) {
        reject(new Error('Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192'))
      } else {
        resolve()
      }
    })
  },

  validateOtp: (otp) => {
    return new Promise((resolve, reject) => {
      if (!otp || !NUMBERS_ONLY.test(otp)) {
        reject(new Error('Invalid verification code'))
      } else {
        resolve()
      }
    })
  },

  validateServiceRegistrationInputs: (email, telephoneNumber, password) => {
    return new Promise((resolve, reject) => {
      if (!emailValidator(email)) {
        reject(new Error('Invalid email'))
      }

      if (invalidTelephoneNumber(telephoneNumber)) {
        reject(new Error('Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192'))
      }

      if (!password || password.length < MIN_PASSWORD_LENGTH) {
        reject(new Error('Your password must be at least 10 characters.'))
      } else if (commonPassword(password)) {
        reject(new Error('The password you tried to create contains a common phrase or combination of characters. Choose something that’s harder to guess.'))
      } else {
        resolve()
      }
    })
  }
}
