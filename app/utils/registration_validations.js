'use strict'

// NPM dependencies
const q = require('q')
const _ = require('lodash')
const commonPassword = require('common-password')

// Local dependencies
const emailValidator = require('../utils/email_tools.js')

// Constants
const MIN_PHONE_NUMBER_LENGTH = 11
const MIN_PASSWORD_LENGTH = 10
const NUMBERS_ONLY = new RegExp('^[0-9]+$')

// Global functions
const invalidTelephoneNumber = (telephoneNumber) => {
  if (!telephoneNumber) {
    return true
  }
  const trimmedTelephoneNumber = telephoneNumber.replace(/\s/g, '')
  if (trimmedTelephoneNumber.length < MIN_PHONE_NUMBER_LENGTH || !NUMBERS_ONLY.test(trimmedTelephoneNumber)) {
    return true
  }
}

const hasValue = (param) => {
  return !_.isEmpty(_.trim(param))
}

module.exports = {
  shouldProceedWithRegistration: (registerInviteCookie) => {
    const defer = q.defer()

    if (!registerInviteCookie) {
      defer.reject('request does not contain a cookie')
      return defer.promise
    }

    if (hasValue(registerInviteCookie.email) && hasValue(registerInviteCookie.code)) {
      defer.resolve()
    } else {
      defer.reject('registration cookie does not contain the email and/or code')
    }

    return defer.promise
  },

  validateUserRegistrationInputs: (telephoneNumber, password) => {
    const defer = q.defer()

    if (invalidTelephoneNumber(telephoneNumber)) {
      defer.reject('Invalid phone number')
      return defer.promise
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      defer.reject('Your password must be at least 10 characters.')
    } else if (commonPassword(password)) {
      defer.reject('The password you tried to create contains a common phrase or combination of characters. Choose something that’s harder to guess.')
    } else {
      defer.resolve()
    }

    return defer.promise
  },

  validateRegistrationTelephoneNumber: (telephoneNumber) => {
    const defer = q.defer()

    if (invalidTelephoneNumber(telephoneNumber)) {
      defer.reject('Invalid phone number')
    } else {
      defer.resolve()
    }

    return defer.promise
  },

  validateOtp: (otp) => {
    const defer = q.defer()

    if (!otp || !NUMBERS_ONLY.test(otp)) {
      defer.reject('Invalid verification code')
    } else {
      defer.resolve()
    }

    return defer.promise
  },

  validateServiceRegistrationInputs: (email, telephoneNumber, password) => {
    const defer = q.defer()

    if (!emailValidator(email)) {
      defer.reject('Invalid email')
      return defer.promise
    }

    if (invalidTelephoneNumber(telephoneNumber)) {
      defer.reject('Invalid phone number')
      return defer.promise
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      defer.reject('Your password must be at least 10 characters.')
    } else if (commonPassword(password)) {
      defer.reject('The password you tried to create contains a common phrase or combination of characters. Choose something that’s harder to guess.')
    } else {
      defer.resolve()
    }

    return defer.promise
  },

  validateServiceNamingInputs: (serviceName) => {
    const defer = q.defer()

    if (hasValue(serviceName)) {
      defer.resolve()
    } else {
      defer.reject('Invalid service name')
    }

    return defer.promise
  }
}
