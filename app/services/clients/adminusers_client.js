'use strict'

// Local dependencies
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
        body: {provisional},
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
        body: {code: code},
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
  const createService = (serviceName, gatewayAccountIds) => {
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
      postBody.body.name = serviceName
    }
    if (gatewayAccountIds) {
      postBody.body.gateway_account_ids = gatewayAccountIds
    }

    return baseClient.post(
      postBody
    )
  }

  /**
     * Update service name
     *
     * @param serviceExternalId
     * @param serviceName
     * @returns {*|Constructor|promise}
     */
  const updateServiceName = (serviceExternalId, serviceName) => {
    return baseClient.patch(
      {
        baseUrl,
        url: `${serviceResource}/${serviceExternalId}`,
        json: true,
        body: {
          op: 'replace',
          path: 'name',
          value: serviceName
        },
        correlationId: correlationId,
        description: 'update service name',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  }

  /**
     * Update merchant details
     *
     * @param serviceExternalId
     * @param merchantDetails
     * @returns {*|Constructor|promise}
     */
  const updateMerchantDetails = (serviceExternalId, merchantDetails) => {
    return baseClient.put(
      {
        baseUrl,
        url: `${serviceResource}/${serviceExternalId}/merchant-details`,
        json: true,
        body: merchantDetails,
        correlationId: correlationId,
        description: 'update merchant details',
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
    updateServiceName,
    updateMerchantDetails,
    addGatewayAccountsToService
  }
}
