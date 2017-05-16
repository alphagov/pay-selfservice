let q = require('q');
let _ = require('lodash');
let commonPassword = require('common-password');

const MIN_PHONE_NUMBER_LENGTH = 11;
const MIN_PASSWORD_LENGTH = 10;
const NUMBERS_ONLY = new RegExp('^[0-9]+$');

let invalidTelephoneNumber = (telephoneNumber) => {
  if (!telephoneNumber) {
    return true;
  }
  let trimmedTelephoneNumber = telephoneNumber.replace(/\s/g, '');
  if (trimmedTelephoneNumber.length < MIN_PHONE_NUMBER_LENGTH || !NUMBERS_ONLY.test(trimmedTelephoneNumber)) {
    return true;
  }
};

module.exports = {
  shouldProceedWithRegistration: (registerInviteCookie) => {
    let hasValue = (param) => {
      return !_.isEmpty(_.trim(param));
    };
    let defer = q.defer();

    if (!registerInviteCookie) {
      defer.reject('request does not contain a cookie');
      return defer.promise;
    }

    if (hasValue(registerInviteCookie.email) && hasValue(registerInviteCookie.code)) {
      defer.resolve();
    } else {
      defer.reject('registration cookie does not contain the email and/or code');
    }

    return defer.promise;
  },

  validateRegistrationInputs: (telephoneNumber, password) => {
    let defer = q.defer();

    if (invalidTelephoneNumber(telephoneNumber)) {
      defer.reject('Invalid phone number');
      return defer.promise;
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH || commonPassword(password)) {
      defer.reject('Your password is too simple. Choose a password that is harder for people to guess');
    } else {
      defer.resolve();
    }

    return defer.promise;
  },

  validateRegistrationTelephoneNumber: (telephoneNumber) => {
    let defer = q.defer();

    if (invalidTelephoneNumber(telephoneNumber)) {
      defer.reject('Invalid phone number');
    } else {
      defer.resolve();
    }

    return defer.promise;
  },

  validateOtp: (otp) => {
    let defer = q.defer();

    if (!otp || !NUMBERS_ONLY.test(otp)) {
      defer.reject('Invalid verification code');
    } else {
      defer.resolve();
    }

    return defer.promise;
  }

};
