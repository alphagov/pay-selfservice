'use strict'

const lodash = require('lodash')

const baseClient = require('./base-client/base.client')
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

  /**
   * Get a User by external id
   *
   * @param {string} externalId
   * @param correlationId
   * @return {Promise<User>} A promise of a User
   */
  const getUserByExternalId = (externalId, correlationId) => {
    return baseClient.get(
      {
        baseUrl,
        url: `${userResource}/${externalId}`,
        json: true,
        correlationId: correlationId,
        description: 'find a user',
        service: SERVICE_NAME,
        transform: responseBodyToUserTransformer
      }
    )
  }

  /**
   * Get a User by external id
   *
   * @return {Promise<User>} A promise of a User
   * @param externalIds
   * @param correlationId
   */
  const getUsersByExternalIds = (externalIds = [], correlationId) => {
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
        transform: responseBodyToUserListTransformer
      }
    )
  }

  /**
   * @param username
   * @param password
   * @param correlationId
   * @returns {Promise<User>}
   */
  const authenticateUser = (username, password, correlationId) => {
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
        transform: responseBodyToUserTransformer
      }
    )
  }

  /**
   *
   * @param externalId
   * @param correlationId
   * @returns {Promise}
   */
  const incrementSessionVersionForUser = (externalId, correlationId) => {
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
        service: SERVICE_NAME
      }
    )
  }

  /**
   *
   * @param username
   * @param correlationId
   * @returns {Promise<ForgottenPassword>}
   */
  const createForgottenPassword = (username, correlationId) => {
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
        service: SERVICE_NAME
      }
    )
  }

  /**
   *
   * @param code
   * @param correlationId
   * @returns {Promise<ForgottenPassword>}
   */
  const getForgottenPassword = (code, correlationId) => {
    return baseClient.get(
      {
        baseUrl,
        url: `${forgottenPasswordResource}/${code}`,
        json: true,
        correlationId: correlationId,
        description: 'get a forgotten password',
        service: SERVICE_NAME
      }
    )
  }

  /**
   *
   * @param token
   * @param newPassword
   * @param correlationId
   * @returns {Promise}
   */
  const updatePasswordForUser = (token, newPassword, correlationId) => {
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
        service: SERVICE_NAME
      }
    )
  }

  /**
   *
   * @param externalId
   * @param provisional
   * @param correlationId
   * @returns {Promise}
   */
  const sendSecondFactor = (externalId, provisional, correlationId) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${userResource}/${externalId}/second-factor`,
        json: true,
        body: { provisional },
        correlationId: correlationId,
        description: 'post a second factor auth token to the user',
        service: SERVICE_NAME
      }
    )
  }

  /**
   *
   * @param externalId
   * @param code
   * @param correlationId
   * @returns {Promise}
   */
  const authenticateSecondFactor = (externalId, code, correlationId) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${userResource}/${externalId}/second-factor/authenticate`,
        json: true,
        body: { code },
        correlationId: correlationId,
        description: 'authenticate a second factor auth token entered by user',
        service: SERVICE_NAME,
        transform: responseBodyToUserTransformer
      }
    )
  }

  const getServiceUsers = (serviceExternalId, correlationId) => {
    return baseClient.get(
      {
        baseUrl,
        url: `${serviceResource}/${serviceExternalId}/users`,
        json: true,
        correlationId: correlationId,
        description: 'get a services users',
        service: SERVICE_NAME,
        transform: responseBodyToUserListTransformer
      }
    )
  }

  /**
   *
   * @param userExternalId
   * @param serviceExternalId
   * @param roleName
   * @param correlationId
   */
  const assignServiceRole = (userExternalId, serviceExternalId, roleName, correlationId) => {
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
        transform: responseBodyToUserTransformer
      }
    )
  }

  /**
   *
   * @param externalId
   * @param serviceExternalId
   * @param roleName
   * @param correlationId
   * @returns {Promise<User>}
   */
  const updateServiceRole = (externalId, serviceExternalId, roleName, correlationId) => {
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
        transform: responseBodyToUserTransformer
      }
    )
  }

  /**
   *
   * @param invitee
   * @param senderId
   * @param serviceExternalId
   * @param roleName
   * @param correlationId
   * @returns {Promise}
   */
  const inviteUser = (invitee, senderId, serviceExternalId, roleName, correlationId) => {
    return baseClient.post(
      {
        baseUrl,
        url: `/v1/api/invites/user`,
        json: true,
        body: {
          email: invitee,
          sender: senderId,
          service_external_id: serviceExternalId,
          role_name: roleName
        },
        correlationId: correlationId,
        description: 'invite a user to signup',
        service: SERVICE_NAME
      }
    )
  }

  /**
   * Get a invited users for a given service
   * @param serviceExternalId
   * @param correlationId
   */
  const getInvitedUsersList = (serviceExternalId, correlationId) => {
    return baseClient.get(
      {
        baseUrl,
        url: `/v1/api/invites`,
        qs: {
          serviceId: serviceExternalId
        },
        json: true,
        correlationId: correlationId,
        method: 'GET',
        description: 'get invited users for a service',
        service: SERVICE_NAME
      }
    )
  }

  /**
   * Get a valid invite or error if it's expired
   * @param inviteCode
   * @param correlationId
   */
  const getValidatedInvite = (inviteCode, correlationId) => {
    return baseClient.get(
      {
        baseUrl,
        url: `/v1/api/invites/${inviteCode}`,
        json: true,
        correlationId: correlationId,
        description: 'find a validated invitation',
        service: SERVICE_NAME
      }
    )
  }

  /**
   * Generate OTP code for an invite
   *
   * @param inviteCode
   * @param telephoneNumber
   * @param password
   * @param correlationId
   * @returns {*|Constructor}
   */
  const generateInviteOtpCode = (inviteCode, telephoneNumber, password, correlationId) => {
    let postData = {
      baseUrl,
      url: `/v1/api/invites/${inviteCode}/otp/generate`,
      json: true,
      correlationId: correlationId,
      description: 'generate otp code for invite',
      service: SERVICE_NAME
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
   * @param correlationId
   * @param inviteCode
   * @param gatewayAccountIds
   * @returns {*|promise|Constructor}
   */
  const completeInvite = (correlationId, inviteCode) => {
    return baseClient.post(
      {
        baseUrl,
        url: `/v1/api/invites/${inviteCode}/complete`,
        json: true,
        body: {},
        correlationId: correlationId,
        description: 'complete invite',
        service: SERVICE_NAME
      }
    )
  }

  const verifyOtpForInvite = (inviteCode, verificationCode, correlationId) => {
    return baseClient.post(
      {
        baseUrl,
        url: `/v2/api/invites/otp/validate`,
        json: true,
        body: {
          code: inviteCode,
          otp: verificationCode
        },
        correlationId: correlationId,
        description: 'submit invite otp code',
        service: SERVICE_NAME
      }
    )
  }

  const resendOtpCode = (code, phoneNumber, correlationId) => {
    return baseClient.post(
      {
        baseUrl,
        url: `/v1/api/invites/otp/resend`,
        json: true,
        body: {
          code: code,
          telephone_number: phoneNumber
        },
        correlationId: correlationId,
        description: 'resend otp code',
        service: SERVICE_NAME
      }
    )
  }

  /**
   * Submit service registration details
   *
   * @param email
   * @param phoneNumber
   * @param password
   * @param correlationId
   */
  const submitServiceRegistration = (email, phoneNumber, password, correlationId) => {
    return baseClient.post(
      {
        baseUrl,
        url: `/v1/api/invites/service`,
        json: true,
        body: {
          email: email,
          telephone_number: phoneNumber,
          password: password
        },
        correlationId: correlationId,
        description: 'submit service registration details',
        service: SERVICE_NAME
      }
    )
  }

  const deleteUser = (serviceExternalId, removerExternalId, userExternalId, correlationId) => {
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
        service: SERVICE_NAME
      }
    )
  }

  /**
   * Create a service
   *
   * @param serviceName
   * @param serviceNameCy
   * @param gatewayAccountIds
   * @param correlationId
   * @returns {*|promise|Constructor}
   */
  const createService = (serviceName, serviceNameCy, correlationId) => {
    let postBody = {
      baseUrl,
      url: `${serviceResource}`,
      json: true,
      body: {},
      correlationId: correlationId,
      description: 'create service',
      transform: responseBodyToServiceTransformer,
      service: SERVICE_NAME
    }

    if (serviceName) {
      postBody.body.service_name = lodash.merge(postBody.body.service_name, { en: serviceName })
    }
    if (serviceNameCy) {
      postBody.body.service_name = lodash.merge(postBody.body.service_name, { cy: serviceNameCy })
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
   * @param correlationId
   * @returns {*|Constructor|promise}
   */
  const updateService = (serviceExternalId, body, correlationId) => {
    return baseClient.patch({
      baseUrl,
      url: `${serviceResource}/${serviceExternalId}`,
      json: true,
      body,
      correlationId: correlationId,
      description: 'update service',
      transform: responseBodyToServiceTransformer,
      service: SERVICE_NAME
    })
  }

  /**
   * Update service name
   *
   * @param serviceExternalId
   * @param serviceName
   * @param serviceNameCy
   * @param correlationId
   * @returns {*|Constructor|promise}
   */
  const updateServiceName = (serviceExternalId, serviceName, serviceNameCy, correlationId) => {
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
        service: SERVICE_NAME
      }
    )
  }

  /**
   * Update collect billing address setting
   *
   * @param serviceExternalId
   * @param collectBillingAddress
   * @param correlationId
   * @returns {*|Constructor|promise}
   */
  const updateCollectBillingAddress = (serviceExternalId, collectBillingAddress, correlationId) => {
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
        service: SERVICE_NAME
      }
    )
  }

  const updateDefaultBillingAddressCountry = (serviceExternalId, countryCode, correlationId) => {
    return baseClient.patch(
      {
        baseUrl,
        url: `${serviceResource}/${serviceExternalId}`,
        json: true,
        body:
        {
          op: 'replace',
          path: 'default_billing_address_country',
          value: countryCode
        },
        correlationId: correlationId,
        description: 'update default billing address country',
        service: SERVICE_NAME
      }
    )
  }

  /**
   * Add gateway accounts to service
   *
   * @param serviceExternalId
   * @param gatewayAccountIds {String[]} a list of (unassigned) gateway account ids to add to the service
   * @param correlationId
   * @returns {Promise<Service|Error>}
   */
  const addGatewayAccountsToService = (serviceExternalId, gatewayAccountIds, correlationId) => {
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
        transform: responseBodyToServiceTransformer
      }
    )
  }

  /**
   *
   * @param externalId
   * @param correlationId
   * @returns {Promise}
   */
  const provisionNewOtpKey = (externalId, correlationId) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${userResource}/${externalId}/second-factor/provision`,
        json: true,
        correlationId: correlationId,
        description: 'create a new 2FA provisional OTP key',
        transform: responseBodyToUserTransformer,
        service: SERVICE_NAME
      }
    )
  }

  /**
   *
   * @param externalId
   * @param code
   * @param secondFactor {String} 'SMS' or 'APP'
   * @param correlationId
   * @returns {Promise}
   */
  const configureNewOtpKey = (externalId, code, secondFactor, correlationId) => {
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
        service: SERVICE_NAME
      }
    )
  }

  const updateCurrentGoLiveStage = (serviceExternalId, newStage, correlationId) => {
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
        service: SERVICE_NAME
      }
    )
  }

  const updatePspTestAccountStage = (serviceExternalId, newStage, correlationId) => {
    return baseClient.patch(
      {
        baseUrl,
        url: `${serviceResource}/${serviceExternalId}`,
        json: true,
        body: {
          op: 'replace',
          path: 'current_psp_test_account_stage',
          value: newStage
        },
        correlationId: correlationId,
        description: 'update PSP test account stage',
        transform: responseBodyToServiceTransformer,
        service: SERVICE_NAME
      }
    )
  }

  const addStripeAgreementIpAddress = (serviceExternalId, ipAddress, correlationId) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${serviceResource}/${serviceExternalId}/stripe-agreement`,
        json: true,
        body: { ip_address: ipAddress },
        correlationId: correlationId,
        description: 'post the ip address of the user who agreed to stripe terms',
        service: SERVICE_NAME
      }
    )
  }

  const addGovUkAgreementEmailAddress = (serviceExternalId, userExternalId, correlationId) => {
    return baseClient.post(
      {
        baseUrl,
        url: `${serviceResource}/${serviceExternalId}/govuk-pay-agreement`,
        json: true,
        body: { user_external_id: userExternalId },
        correlationId: correlationId,
        description: 'post the external id of the user who agreed to GovUk Pay terms',
        service: SERVICE_NAME
      }
    )
  }

  /**
   *
   * @param externalId
   * @param newPhoneNumber
   * @param correlationId
   * @returns {Promise}
   */
  const updatePhoneNumberForUser = (externalId, newPhoneNumber, correlationId) => {
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
        service: SERVICE_NAME
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
    verifyOtpForInvite,
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
    updateDefaultBillingAddressCountry,
    addGatewayAccountsToService,
    updateCurrentGoLiveStage,
    addStripeAgreementIpAddress,
    addGovUkAgreementEmailAddress,
    updatePspTestAccountStage
  }
}
