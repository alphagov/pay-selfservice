'use strict'

// NPM dependencies
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
    return new Promise(function(resolve, reject){
      if (!registerInviteCookie) {
        reject('request does not contain a cookie')
      }

      if (hasValue(registerInviteCookie.email) && hasValue(registerInviteCookie.code)) {
        resolve()
      } else {
        reject('registration cookie does not contain the email and/or code')
      }
    })
  },

  validateUserRegistrationInputs: (telephoneNumber, password) => {
    return new Promise(function(resolve, reject){

      if (invalidTelephoneNumber(telephoneNumber)) {
        reject('Invalid phone number')
      }

      if (!password || password.length < MIN_PASSWORD_LENGTH) {
        reject('Your password must be at least 10 characters.')
      } else if (commonPassword(password)) {
        reject('The password you tried to create contains a common phrase or combination of characters. Choose something that’s harder to guess.')
      } else {
        resolve()
      }
    })
  },

  validateRegistrationTelephoneNumber: (telephoneNumber) => {
    return new Promise(function(resolve, reject){
      if (invalidTelephoneNumber(telephoneNumber)) {
        reject('Invalid phone number')
      } else {
        resolve()
      }
    })
  },

  validateOtp: (otp) => {
    return new Promise(function(resolve, reject){
      if (!otp || !NUMBERS_ONLY.test(otp)) {
        reject('Invalid verification code')
      } else {
        resolve()
      }
    })
  },

  validateServiceRegistrationInputs: (email, telephoneNumber, password) => {
    return new Promise(function(resolve, reject){
      if (!emailValidator(email)) {
        reject('Invalid email')
      }

      if (invalidTelephoneNumber(telephoneNumber)) {
        return defer.promise
      }

      if (!password || password.length < MIN_PASSWORD_LENGTH) {
        reject('Your password must be at least 10 characters.')
      } else if (commonPassword(password)) {
        reject('The password you tried to create contains a common phrase or combination of characters. Choose something that’s harder to guess.')
      } else {
        resolve()
      }
    })
  }
}
