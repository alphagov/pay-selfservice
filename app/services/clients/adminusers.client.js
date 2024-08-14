'use strict'

const lodash = require('lodash')

const { Client } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/axios-base-client')
const { configureClient } = require('./base/config')
const User = require('../../models/User.class')
const Service = require('../../models/Service.class')

// Constants
const SERVICE_NAME = 'adminusers'
const HEADER_USER_CONTEXT = 'GovUkPay-User-Context'
const ADMINUSERS_URL = process.env.ADMINUSERS_URL

/**
 * @private
 * @param body
 */
const responseBodyToUserTransformer = body => new User(body)
const responseBodyToUserListTransformer = body => body.map(userData => new User(userData))
const responseBodyToServiceTransformer = body => new Service(body)

module.exports = function (clientOptions = {}) {
  const baseUrl = clientOptions.baseUrl || ADMINUSERS_URL
  const userResource = `/v1/api/users`
  const forgottenPasswordResource = `/v1/api/forgotten-passwords`
  const resetPasswordResource = `/v1/api/reset-password`
  const serviceResource = `/v1/api/services`
  const client = new Client(SERVICE_NAME)

  /**
   * Get a User by external id
   *
   * @param {string} externalId
   * @return {Promise<User>} A promise of a User
   */
  async function getUserByExternalId (externalId) {
    const url = `${baseUrl}${userResource}/${externalId}`
    configureClient(client, url)
    const response = await client.get(url, 'find a user')
    return responseBodyToUserTransformer(response.data)
  }

  /**
   * Get a User by external id
   *
   * @return {Promise<User>} A promise of a User
   * @param externalIds
   */
  async function getUsersByExternalIds (externalIds = []) {
    const url = `${baseUrl}${userResource}?ids=${externalIds.join()}`
    configureClient(client, url)
    const response = await client.get(url, 'find a user')
    return responseBodyToUserListTransformer(response.data)
  }

  /**
   * @param email
   * @param password
   * @returns {Promise<User>}
   */
  async function authenticateUser (email, password) {
    const url = `${baseUrl}${userResource}/authenticate`
    configureClient(client, url)
    const response = await client.post(url, { email: email, password: password }, 'find a user')
    return responseBodyToUserTransformer(response.data)
  }

  /**
   *
   * @param externalId
   * @returns {Promise}
   */
  async function incrementSessionVersionForUser (externalId) {
    const url = `${baseUrl}${userResource}/${externalId}`
    configureClient(client, url)
    const body = {
      op: 'append',
      path: 'sessionVersion',
      value: 1
    }
    const response = await client.patch(url, body, 'increment session version for a user')
    return response.data
  }

  /**
   *
   * @param username
   * @returns {Promise<ForgottenPassword>}
   */
  async function createForgottenPassword (username) {
    const url = `${baseUrl}${forgottenPasswordResource}`
    configureClient(client, url)
    const response = await client.post(url, { username: username }, 'create a forgotten password for a user')
    return response.data
  }

  /**
   *
   * @param code
   * @returns {Promise<ForgottenPassword>}
   */
  async function getForgottenPassword (code) {
    const url = `${baseUrl}${forgottenPasswordResource}/${code}`
    configureClient(client, url)
    const response = await client.get(url, 'get a forgotten password')
    return response.data
  }

  /**
   *
   * @param token
   * @param newPassword
   * @returns {Promise}
   */
  async function updatePasswordForUser (token, newPassword) {
    const url = `${baseUrl}${resetPasswordResource}`
    configureClient(client, url)
    const response = await client.post(url, { forgotten_password_code: token, new_password: newPassword }, 'update a password for a user')
    return response.data
  }

  /**
   *
   * @param externalId
   * @param provisional
   * @returns {Promise}
   */
  async function sendSecondFactor (externalId, provisional) {
    const url = `${baseUrl}${userResource}/${externalId}/second-factor`
    configureClient(client, url)
    const response = await client.post(url, { provisional }, 'post a second factor auth token to the user')
    return response.data
  }

  /**
   *
   * @param externalId
   * @param code
   * @returns {Promise}
   */
  async function authenticateSecondFactor (externalId, code) {
    const url = `${baseUrl}${userResource}/${externalId}/second-factor/authenticate`
    configureClient(client, url)
    const response = await client.post(url, { code }, 'authenticate a second factor auth token entered by user')
    return responseBodyToUserTransformer(response.data)
  }

  async function getServiceUsers (serviceExternalId) {
    const url = `${baseUrl}${serviceResource}/${serviceExternalId}/users`
    configureClient(client, url)
    const response = await client.get(url, 'get a services users')
    return responseBodyToUserListTransformer(response.data)
  }

  /**
   *
   * @param userExternalId
   * @param serviceExternalId
   * @param roleName
   */
  async function assignServiceRole (userExternalId, serviceExternalId, roleName) {
    const url = `${baseUrl}${userResource}/${userExternalId}/services`
    configureClient(client, url)
    const response = await client.post(url, { service_external_id: serviceExternalId, role_name: roleName }, 'assigns user to a new service')
    return responseBodyToUserTransformer(response.data)
  }

  /**
   *
   * @param externalId
   * @param serviceExternalId
   * @param roleName
   * @returns {Promise<User>}
   */
  async function updateServiceRole (externalId, serviceExternalId, roleName) {
    const url = `${baseUrl}${userResource}/${externalId}/services/${serviceExternalId}`
    configureClient(client, url)
    const response = await client.put(url, { role_name: roleName }, 'update role of a service that currently belongs to a user')
    return responseBodyToUserTransformer(response.data)
  }

  /**
   *
   * @param invitee
   * @param senderId
   * @param serviceExternalId
   * @param roleName
   * @returns {Promise}
   */
  async function createInviteToJoinService (invitee, senderId, serviceExternalId, roleName) {
    const url = `${baseUrl}/v1/api/invites/create-invite-to-join-service`
    configureClient(client, url)
    const body = {
      email: invitee,
      sender: senderId,
      service_external_id: serviceExternalId,
      role_name: roleName
    }
    const response = await client.post(url, body, 'invite a user to join a service')
    return response.data
  }

  /**
   * Get a invited users for a given service
   * @param serviceExternalId
   */
  async function getInvitedUsersList (serviceExternalId) {
    const url = `${baseUrl}/v1/api/invites?serviceId=${serviceExternalId}`
    configureClient(client, url)
    const response = await client.get(url, 'get invited users for a service')
    return response.data
  }

  /**
   * Get a valid invite or error if it's expired
   * @param inviteCode
   */
  async function getValidatedInvite (inviteCode) {
    const url = `${baseUrl}/v1/api/invites/${inviteCode}`
    configureClient(client, url)
    const response = await client.get(url, 'find a validated invitation')
    return response.data
  }

  async function updateInvitePassword (inviteCode, password) {
    const url = `${baseUrl}/v1/api/invites/${inviteCode}`
    configureClient(client, url)
    const body = [{
      op: 'replace',
      path: 'password',
      value: password
    }]
    const response = await client.patch(url, body, 'update the password for an invite')
    return response.data
  }

  async function updateInvitePhoneNumber (inviteCode, phoneNumber) {
    const url = `${baseUrl}/v1/api/invites/${inviteCode}`
    configureClient(client, url)
    const body = [{
      op: 'replace',
      path: 'telephone_number',
      value: phoneNumber
    }]
    const response = await client.patch(url, body, 'update the phone number for an invite')
    return response.data
  }

  async function sendOtp (inviteCode) {
    const url = `${baseUrl}/v1/api/invites/${inviteCode}/send-otp`
    configureClient(client, url)
    const response = await client.post(url, 'send OTP code')
    return response.data
  }

  async function reprovisionOtp (inviteCode) {
    const url = `${baseUrl}/v1/api/invites/${inviteCode}/reprovision-otp`
    configureClient(client, url)
    const response = await client.post(url, 're-provision OTP key')
    return response.data
  }

  /**
   * Complete a service invite
   *
   * @param inviteCode
   * @param secondFactorMethod
   * @returns {*|promise|Constructor}
   */
  async function completeInvite (inviteCode, secondFactorMethod) {
    const url = `${baseUrl}/v1/api/invites/${inviteCode}/complete`
    configureClient(client, url)
    const body = secondFactorMethod ? { second_factor: secondFactorMethod } : {}
    const response = await client.post(url, body, 'complete invite')
    return response.data
  }

  async function verifyOtpForInvite (inviteCode, securityCode) {
    const url = `${baseUrl}/v2/api/invites/otp/validate`
    configureClient(client, url)
    const body = {
      code: inviteCode,
      otp: securityCode
    }
    const response = await client.post(url, body, 'submit invite otp code')
    return response.data
  }

  /**
   * Create self-signup invite
   *
   * @param email
   */
  async function createSelfSignupInvite (email) {
    const url = `${baseUrl}/v1/api/invites/create-self-registration-invite`
    configureClient(client, url)
    const response = await client.post(url, { email: email }, 'create self-registration invite')
    return response.data
  }

  async function deleteUser (serviceExternalId, removerExternalId, userExternalId) {
    let headers = {}
    headers[HEADER_USER_CONTEXT] = removerExternalId
    const config = {
      headers: headers,
      data: {
        userDelete: userExternalId,
        userRemover: removerExternalId
      }
    }
    const url = `${baseUrl}${serviceResource}/${serviceExternalId}/users/${userExternalId}`
    configureClient(client, url)
    const response = await client.delete(url, 'delete a user from a service', config)
    return response.data
  }

  /**
   * Create a service
   *
   * @param serviceName
   * @param serviceNameCy
   * @param gatewayAccountIds
   * @returns {*|promise|Constructor}
   */
  async function createService (serviceName, serviceNameCy) {
    const url = `${baseUrl}${serviceResource}`
    configureClient(client, url)
    const body = {}
    if (serviceName) {
      body.service_name = lodash.merge(body.service_name, { en: serviceName })
    }
    if (serviceNameCy) {
      body.service_name = lodash.merge(body.service_name, { cy: serviceNameCy })
    }
    const response = await client.post(url, body, 'create service')
    return responseBodyToServiceTransformer(response.data)
  }

  /**
   * Update service
   *
   * @param serviceExternalId
   * @param body
   * @returns {*|Constructor|promise}
   */
  async function updateService (serviceExternalId, body) {
    const url = `${baseUrl}${serviceResource}/${serviceExternalId}`
    configureClient(client, url)
    const response = await client.patch(url, body, 'update service')
    return responseBodyToServiceTransformer(response.data)
  }

  /**
   * Update service name
   *
   * @param serviceExternalId
   * @param serviceName
   * @param serviceNameCy
   * @returns {*|Constructor|promise}
   */
  async function updateServiceName (serviceExternalId, serviceName, serviceNameCy) {
    const url = `${baseUrl}${serviceResource}/${serviceExternalId}`
    configureClient(client, url)
    const body = [
      {
        op: 'replace',
        path: 'service_name/en',
        value: serviceName || 'System Generated'
      },
      {
        op: 'replace',
        path: 'service_name/cy',
        value: serviceNameCy || ''
      }
    ]
    const response = await client.patch(url, body, 'update service name')
    return response.data
  }

  /**
   * Update collect billing address setting
   *
   * @param serviceExternalId
   * @param collectBillingAddress
   * @returns {*|Constructor|promise}
   */
  async function updateCollectBillingAddress (serviceExternalId, collectBillingAddress) {
    const url = `${baseUrl}${serviceResource}/${serviceExternalId}`
    configureClient(client, url)
    const body = {
      op: 'replace',
      path: 'collect_billing_address',
      value: collectBillingAddress
    }
    const response = await client.patch(url, body, 'update collect billing address')
    return response.data
  }

  async function updateDefaultBillingAddressCountry (serviceExternalId, countryCode) {
    const url = `${baseUrl}${serviceResource}/${serviceExternalId}`
    configureClient(client, url)
    const body = {
      op: 'replace',
      path: 'default_billing_address_country',
      value: countryCode
    }
    const response = await client.patch(url, body, 'update default billing address country')
    return response.data
  }

  /**
   * Add gateway accounts to service
   *
   * @param serviceExternalId
   * @param gatewayAccountIds {String[]} a list of (unassigned) gateway account ids to add to the service
   * @returns {Promise<Service|Error>}
   */
  async function addGatewayAccountsToService (serviceExternalId, gatewayAccountIds) {
    const url = `${baseUrl}${serviceResource}/${serviceExternalId}`
    configureClient(client, url)
    const body = {
      op: 'add',
      path: 'gateway_account_ids',
      value: gatewayAccountIds
    }
    const response = await client.patch(url, body, 'add gateway accounts to service')
    return responseBodyToServiceTransformer(response.data)
  }

  /**
   *
   * @param externalId
   * @returns {Promise}
   */
  async function provisionNewOtpKey (externalId) {
    const url = `${baseUrl}${userResource}/${externalId}/second-factor/provision`
    configureClient(client, url)
    const response = await client.post(url, 'create a new 2FA provisional OTP key')
    return responseBodyToUserTransformer(response.data)
  }

  /**
   *
   * @param externalId
   * @param code
   * @param secondFactor {String} 'SMS' or 'APP'
   * @returns {Promise}
   */
  async function configureNewOtpKey (externalId, code, secondFactor) {
    const url = `${baseUrl}${userResource}/${externalId}/second-factor/activate`
    configureClient(client, url)
    const body = {
      code: code,
      second_factor: secondFactor
    }
    const response = await client.post(url, body, 'configure a new OTP key and method')
    return response.data
  }

  async function updateCurrentGoLiveStage (serviceExternalId, newStage) {
    const url = `${baseUrl}${serviceResource}/${serviceExternalId}`
    configureClient(client, url)
    const body = {
      op: 'replace',
      path: 'current_go_live_stage',
      value: newStage
    }
    const response = await client.patch(url, body, 'update current go live stage')
    return responseBodyToServiceTransformer(response.data)
  }

  async function updatePspTestAccountStage (serviceExternalId, newStage) {
    const url = `${baseUrl}${serviceResource}/${serviceExternalId}`
    configureClient(client, url)
    const body = {
      op: 'replace',
      path: 'current_psp_test_account_stage',
      value: newStage
    }
    const response = await client.patch(url, body, 'update PSP test account stage')
    return responseBodyToServiceTransformer(response.data)
  }

  async function addStripeAgreementIpAddress (serviceExternalId, ipAddress) {
    const url = `${baseUrl}${serviceResource}/${serviceExternalId}/stripe-agreement`
    configureClient(client, url)
    const response = await client.post(url, { ip_address: ipAddress }, 'post the ip address of the user who agreed to stripe terms')
    return response.data
  }

  async function addGovUkAgreementEmailAddress (serviceExternalId, userExternalId) {
    const url = `${baseUrl}${serviceResource}/${serviceExternalId}/govuk-pay-agreement`
    configureClient(client, url)
    const response = await client.post(url, { user_external_id: userExternalId }, 'post the external id of the user who agreed to GovUk Pay terms')
    return response.data
  }

  /**
   *
   * @param externalId
   * @param newPhoneNumber
   * @returns {Promise}
   */
  async function updatePhoneNumberForUser (externalId, newPhoneNumber) {
    const url = `${baseUrl}${userResource}/${externalId}`
    configureClient(client, url)
    const body = {
      op: 'replace',
      path: 'telephone_number',
      value: newPhoneNumber
    }
    const response = await client.patch(url, body, 'update a phone number for a user')
    return response.data
  }

  /**
   * @param {string} externalId - External ID of the User
   * @param {string} features - Comma separated list of features
   * @returns {Promise}
   */
  async function updateFeaturesForUser (externalId, features) {
    const url = `${baseUrl}${userResource}/${externalId}`
    configureClient(client, url)
    const body = {
      op: 'replace',
      path: 'features',
      value: features
    }
    const response = await client.patch(url, body, 'update features for a user')
    return response.data
  }

  return {
    // User-related Methods
    getForgottenPassword,
    createForgottenPassword,
    incrementSessionVersionForUser,
    getUserByExternalId,
    getUsersByExternalIds,
    authenticateUser,
    updatePasswordForUser,
    sendSecondFactor,
    authenticateSecondFactor,
    deleteUser,
    provisionNewOtpKey,
    configureNewOtpKey,
    updatePhoneNumberForUser,
    updateFeaturesForUser,

    // UserServiceRole-related Methods
    updateServiceRole,
    assignServiceRole,
    getServiceUsers,

    // Invite-related Methods
    createSelfSignupInvite,
    verifyOtpForInvite,
    createInviteToJoinService,
    getInvitedUsersList,
    getValidatedInvite,
    updateInvitePassword,
    updateInvitePhoneNumber,
    sendOtp,
    reprovisionOtp,
    completeInvite,

    // Service-related Methods
    createService,
    updateService,
    updateServiceName,
    updateCollectBillingAddress,
    updateDefaultBillingAddressCountry,
    addGatewayAccountsToService,
    updateCurrentGoLiveStage,
    addStripeAgreementIpAddress,
    addGovUkAgreementEmailAddress,
    updatePspTestAccountStage
  }
}
