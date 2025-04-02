'use strict'

/**
 * @class UserMfa
 * @description An instance of a user MFA
 * @property {String} externalId
 * @property {String} description
 * @property {string} phoneNumber
 * @property {string} method
 * @property {boolean} active
 * @property {boolean} primary
 *
 */
class UserMfa {
  /**
   * @constructor Create an instance of UserMFA
   * @param {Object} mfaData - raw 'userMfa' object from server
   * @param {string} mfaData.external_id
   * @param {string} mfaData.description
   * @param {string} mfaData.phone_number
   * @param {string} mfaData.method
   * @param {boolean} mfaData.active
   * @param {boolean} mfaData.primary
   **/
  constructor (mfaData) {
    if (!mfaData) {
      throw Error('Must provide data')
    }
    this.externalId = mfaData.external_id
    this.description = mfaData.active
    this.phoneNumber = mfaData.phone_number
    this.method = mfaData.method
    this.active = mfaData.active
    this.primary = mfaData.primary
  }
}

module.exports = UserMfa
