let q = require('q');
let _ = require('lodash');
let commonPassword = require('common-password');

const MIN_PHONE_NUMBER_LENGTH = 11;
const NUMBERS_ONLY = new RegExp('^[0-9]+$');

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
      return defer.promise
    } else {
      defer.reject('registration cookie does not contain the email and/or code');
      return defer.promise;
    }
  },

  validateRegistrationInputs: (telephoneNumber, password) => {
    let defer = q.defer();

    if(!telephoneNumber || telephoneNumber.length < MIN_PHONE_NUMBER_LENGTH || !NUMBERS_ONLY.test(telephoneNumber)){
      defer.reject('Invalid phone number');
      return defer.promise;
    }

    if (commonPassword(password)) {
      defer.reject('Your password is too simple. Choose a password that is harder for people to guess');
      return defer.promise;
    }

    defer.resolve();
    return defer.promise;
  }
};
