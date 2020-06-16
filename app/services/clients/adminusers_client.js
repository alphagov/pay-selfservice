'use strict'

const lodash = require('lodash')

const baseClient = require('./base_client/base_client')
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
  const correlationId = clientOptions.correlationId || ''
  const userResource = `/v1/api/users`
  const forgottenPasswordResource = `/v1/api/forgotten-passwords`
  const resetPasswordResource = `/v1/api/reset-password`
  const serviceResource = `/v1/api/services`
  const inviteResource = `/v1/api/invites`

  /**
     * Get a User by external id
     *
     * @param {string} externalId
     * @return {Promise<User>} A promise of a User
     */
  const getUserByExternalId = (externalId, subSegment) => {
    return baseClient.get(
      {
        baseUrl,
        url: `${userResource}/${externalId}`,
        json: true,
        correlationId: correlationId,
        description: 'find a user',
        service: SERVICE_NAME,
        transform: responseBodyToUserTransformer,
        baseClientErrorHandler: 'old',
        subSegment: subSegment
      }
    )
  }

  /**
     * Get a User by external id
     *
     * @param {string} externalId
     * @return {Promise<User>} A promise of a User
     */
  const getUsersByExternalIds = (externalIds = []) => {
    return baseClient.get(
      {
        baseUrl,
        url: `${userResource}`,
        qs: {
          ids: externalIds.join()
        },
        json: true,
        correlationId: correlationId,
        description: 'find a user',
        service: SERVICE_NAME,
        transform: responseBodyToUserListTransformer,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     * @param username
     * @param password
     * @returns {Promise<User>}
     */
  const authenticateUser = (username, password) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${userResource}/authenticate`,
        json: true,
        body: {
          username: username,
          password: password
        },
        correlationId: correlationId,
        description: 'authenticate a user',
        service: SERVICE_NAME,
        transform: responseBodyToUserTransformer,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     *
     * @param externalId
     * @returns {Promise}
     */
  const incrementSessionVersionForUser = (externalId) => {
    return baseClient.patch(
      {
        baseUrl,
        url: `${userResource}/${externalId}`,
        json: true,
        body: {
          op: 'append',
          path: 'sessionVersion',
          value: 1
        },
        correlationId: correlationId,
        description: 'increment session version for a user',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     *
     * @param username
     * @returns {Promise<ForgottenPassword>}
     */
  const createForgottenPassword = (username) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${forgottenPasswordResource}`,
        json: true,
        body: {
          username: username
        },
        correlationId: correlationId,
        description: 'create a forgotten password for a user',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     *
     * @param code
     * @returns {Promise<ForgottenPassword>}
     */
  const getForgottenPassword = (code) => {
    return baseClient.get(
      {
        baseUrl,
        url: `${forgottenPasswordResource}/${code}`,
        json: true,
        correlationId: correlationId,
        description: 'get a forgotten password',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     *
     * @param token
     * @param newPassword
     * @returns {Promise}
     */
  const updatePasswordForUser = (token, newPassword) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${resetPasswordResource}`,
        json: true,
        body: {
          forgotten_password_code: token,
          new_password: newPassword
        },
        correlationId: correlationId,
        description: 'update a password for a user',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     *
     * @param externalId
     * @returns {Promise}
     */
  const sendSecondFactor = (externalId, provisional) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${userResource}/${externalId}/second-factor`,
        json: true,
        body: { provisional },
        correlationId: correlationId,
        description: 'post a second factor auth token to the user',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     *
     * @param externalId
     * @param code
     * @returns {Promise}
     */
  const authenticateSecondFactor = (externalId, code) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${userResource}/${externalId}/second-factor/authenticate`,
        json: true,
        body: { code },
        correlationId: correlationId,
        description: 'authenticate a second factor auth token entered by user',
        service: SERVICE_NAME,
        transform: responseBodyToUserTransformer,
        baseClientErrorHandler: 'old'
      }
    )
  }

  const getServiceUsers = (serviceExternalId) => {
    return baseClient.get(
      {
        baseUrl,
        url: `${serviceResource}/${serviceExternalId}/users`,
        json: true,
        correlationId: correlationId,
        description: 'get a services users',
        service: SERVICE_NAME,
        transform: responseBodyToUserListTransformer,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     *
     * @param userExternalId
     * @param serviceExternalId
     * @param roleName
     */
  const assignServiceRole = (userExternalId, serviceExternalId, roleName) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${userResource}/${userExternalId}/services`,
        json: true,
        body: {
          service_external_id: serviceExternalId,
          role_name: roleName
        },
        correlationId: correlationId,
        description: 'assigns user to a new service',
        service: SERVICE_NAME,
        transform: responseBodyToUserTransformer,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     *
     * @param externalId
     * @param serviceExternalId
     * @param roleName
     * @returns {Promise<User>}
     */
  const updateServiceRole = (externalId, serviceExternalId, roleName) => {
    return baseClient.put(
      {
        baseUrl,
        url: `${userResource}/${externalId}/services/${serviceExternalId}`,
        json: true,
        body: {
          role_name: roleName
        },
        correlationId: correlationId,
        description: 'update role of a service that currently belongs to a user',
        service: SERVICE_NAME,
        transform: responseBodyToUserTransformer,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     *
     * @param invitee
     * @param senderId
     * @param serviceExternalId
     * @param roleName
     * @returns {Promise}
     */
  const inviteUser = (invitee, senderId, serviceExternalId, roleName) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${inviteResource}/user`,
        json: true,
        body: {
          email: invitee,
          sender: senderId,
          service_external_id: serviceExternalId,
          role_name: roleName
        },
        correlationId: correlationId,
        description: 'invite a user to signup',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
   * Get a invited users for a given service
   * @param serviceExternalId
   */
  const getInvitedUsersList = (serviceExternalId) => {
    return baseClient.get(
      {
        baseUrl,
        url: `${inviteResource}`,
        qs: {
          serviceId: serviceExternalId
        },
        json: true,
        correlationId: correlationId,
        method: 'GET',
        description: 'get invited users for a service',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
   * Get a valid invite or error if it's expired
   * @param inviteCode
   */
  const getValidatedInvite = (inviteCode) => {
    return baseClient.get(
      {
        baseUrl,
        url: `${inviteResource}/${inviteCode}`,
        json: true,
        correlationId: correlationId,
        description: 'find a validated invitation',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     * Generate OTP code for an invite
     *
     * @param inviteCode
     * @param telephoneNumber
     * @param password
     * @returns {*|Constructor}
     */
  const generateInviteOtpCode = (inviteCode, telephoneNumber, password) => {
    let postData = {
      baseUrl,
      url: `${inviteResource}/${inviteCode}/otp/generate`,
      json: true,
      correlationId: correlationId,
      description: 'generate otp code for invite',
      service: SERVICE_NAME,
      baseClientErrorHandler: 'old'
    }

    if (telephoneNumber || password) {
      postData.body = {
        telephone_number: telephoneNumber,
        password: password
      }
    }

    return baseClient.post(
      postData
    )
  }

  /**
     * Complete a service invite
     *
     * @param inviteCode
     * @param gatewayAccountIds
     * @returns {*|promise|Constructor}
     */
  const completeInvite = (inviteCode, gatewayAccountIds) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${inviteResource}/${inviteCode}/complete`,
        json: true,
        body: {
          gateway_account_ids: gatewayAccountIds
        },
        correlationId: correlationId,
        description: 'complete invite',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  const verifyOtpAndCreateUser = (code, verificationCode) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${inviteResource}/otp/validate`,
        json: true,
        body: {
          code: code,
          otp: verificationCode
        },
        correlationId: correlationId,
        description: 'submit otp code',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  const verifyOtpForServiceInvite = (inviteCode, verificationCode) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${inviteResource}/otp/validate/service`,
        json: true,
        body: {
          code: inviteCode,
          otp: verificationCode
        },
        correlationId: correlationId,
        description: 'submit service invite otp code',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  const resendOtpCode = (code, phoneNumber) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${inviteResource}/otp/resend`,
        json: true,
        body: {
          code: code,
          telephone_number: phoneNumber
        },
        correlationId: correlationId,
        description: 'resend otp code',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     * Submit service registration details
     *
     * @param email
     * @param phoneNumber
     * @param password
     */
  const submitServiceRegistration = (email, phoneNumber, password) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${inviteResource}/service`,
        json: true,
        body: {
          email: email,
          telephone_number: phoneNumber,
          password: password
        },
        correlationId: correlationId,
        description: 'submit service registration details',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  const deleteUser = (serviceExternalId, removerExternalId, userExternalId) => {
    let headers = {}
    headers[HEADER_USER_CONTEXT] = removerExternalId

    return baseClient.delete(
      {
        baseUrl,
        url: `${serviceResource}/${serviceExternalId}/users/${userExternalId}`,
        json: true,
        body: {
          correlationId: correlationId,
          headers: {}
        },
        headers: headers,
        userDelete: userExternalId,
        userRemover: removerExternalId,
        correlationId: correlationId,
        description: 'delete a user from a service',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     * Create a service
     *
     * @param serviceName
     * @param gatewayAccountIds
     * @returns {*|promise|Constructor}
     */
  const createService = (serviceName, serviceNameCy, gatewayAccountIds) => {
    let postBody = {
      baseUrl,
      url: `${serviceResource}`,
      json: true,
      body: {},
      correlationId: correlationId,
      description: 'create service',
      service: SERVICE_NAME,
      baseClientErrorHandler: 'old'
    }

    if (serviceName) {
      postBody.body.service_name = lodash.merge(postBody.body.service_name, { en: serviceName })
    }
    if (serviceNameCy) {
      postBody.body.service_name = lodash.merge(postBody.body.service_name, { cy: serviceNameCy })
    }
    if (gatewayAccountIds) {
      postBody.body.gateway_account_ids = gatewayAccountIds
    }
    return baseClient.post(
      postBody
    )
  }

  /**
   * Update service
   *
   * @param serviceExternalId
   * @param body
   * @returns {*|Constructor|promise}
   */
  const updateService = (serviceExternalId, body) => {
    return baseClient.patch({
      baseUrl,
      url: `${serviceResource}/${serviceExternalId}`,
      json: true,
      body,
      correlationId: correlationId,
      description: 'update service',
      transform: responseBodyToServiceTransformer,
      service: SERVICE_NAME,
      baseClientErrorHandler: 'old'
    })
  }

  /**
     * Update service name
     *
     * @param serviceExternalId
     * @param serviceName
     * @returns {*|Constructor|promise}
     */
  const updateServiceName = (serviceExternalId, serviceName, serviceNameCy) => {
    return baseClient.patch(
      {
        baseUrl,
        url: `${serviceResource}/${serviceExternalId}`,
        json: true,
        body: [
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
        ],
        correlationId: correlationId,
        description: 'update service name',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
   * Update collect billing address setting
   *
   * @param serviceExternalId
   * @param collectBillingAddress
   * @returns {*|Constructor|promise}
   */
  const updateCollectBillingAddress = (serviceExternalId, collectBillingAddress) => {
    return baseClient.patch(
      {
        baseUrl,
        url: `${serviceResource}/${serviceExternalId}`,
        json: true,
        body:
          {
            op: 'replace',
            path: 'collect_billing_address',
            value: collectBillingAddress
          },
        correlationId: correlationId,
        description: 'update collect billing address',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     * Add gateway accounts to service
     *
     * @param serviceExternalId
     * @param gatewayAccountIds {String[]} a list of (unassigned) gateway account ids to add to the service
     * @returns {Promise<Service|Error>}
     */
  const addGatewayAccountsToService = (serviceExternalId, gatewayAccountIds) => {
    return baseClient.patch(
      {
        baseUrl,
        url: `${serviceResource}/${serviceExternalId}`,
        json: true,
        body: {
          op: 'add',
          path: 'gateway_account_ids',
          value: gatewayAccountIds
        },
        correlationId: correlationId,
        description: 'update service name',
        service: SERVICE_NAME,
        transform: responseBodyToServiceTransformer,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     *
     * @param externalId
     * @param code
     * @returns {Promise}
     */
  const provisionNewOtpKey = (externalId) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${userResource}/${externalId}/second-factor/provision`,
        json: true,
        correlationId: correlationId,
        description: 'create a new 2FA provisional OTP key',
        transform: responseBodyToUserTransformer,
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     *
     * @param externalId
     * @param code
     * @param secondFactor {String} 'SMS' or 'APP'
     * @returns {Promise}
     */
  const configureNewOtpKey = (externalId, code, secondFactor) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${userResource}/${externalId}/second-factor/activate`,
        json: true,
        body: {
          code: code,
          second_factor: secondFactor
        },
        correlationId: correlationId,
        description: 'configure a new OTP key and method',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  const updateCurrentGoLiveStage = (serviceExternalId, newStage) => {
    return baseClient.patch(
      {
        baseUrl,
        url: `${serviceResource}/${serviceExternalId}`,
        json: true,
        body: {
          op: 'replace',
          path: 'current_go_live_stage',
          value: newStage
        },
        correlationId: correlationId,
        description: 'update current go live stage',
        transform: responseBodyToServiceTransformer,
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  const addStripeAgreementIpAddress = (serviceExternalId, ipAddress) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${serviceResource}/${serviceExternalId}/stripe-agreement`,
        json: true,
        body: { ip_address: ipAddress },
        correlationId: correlationId,
        description: 'post the ip address of the user who agreed to stripe terms',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  const addGovUkAgreementEmailAddress = (serviceExternalId, userExternalId) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${serviceResource}/${serviceExternalId}/govuk-pay-agreement`,
        json: true,
        body: { user_external_id: userExternalId },
        correlationId: correlationId,
        description: 'post the external id of the user who agreed to GovUk Pay terms',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     *
     * @param externalId
     * @param newPhoneNumber
     * @returns {Promise}
     */
  const updatePhoneNumberForUser = (externalId, newPhoneNumber) => {
    return baseClient.patch(
      {
        baseUrl,
        url: `${userResource}/${externalId}`,
        json: true,
        body: {
          op: 'replace',
          path: 'telephone_number',
          value: newPhoneNumber
        },
        correlationId: correlationId,
        description: 'update a phone number for a user',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
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
    verifyOtpAndCreateUser,
    resendOtpCode,
    deleteUser,
    provisionNewOtpKey,
    configureNewOtpKey,
    updatePhoneNumberForUser,

    // UserServiceRole-related Methods
    updateServiceRole,
    assignServiceRole,
    getServiceUsers,

    // Invite-related Methods
    verifyOtpForServiceInvite,
    inviteUser,
    getInvitedUsersList,
    getValidatedInvite,
    generateInviteOtpCode,
    completeInvite,
    submitServiceRegistration,

    // Service-related Methods
    createService,
    updateService,
    updateServiceName,
    updateCollectBillingAddress,
    addGatewayAccountsToService,
    updateCurrentGoLiveStage,
    addStripeAgreementIpAddress,
    addGovUkAgreementEmailAddress
  }
}
