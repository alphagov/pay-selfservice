'use strict'

const userFixtures = require('../../fixtures/user.fixtures')
const { stubBuilder } = require('./stub-builder')

function getUserWithServiceRoleStubOpts (userExternalId, email, serviceExternalId, roleName) {
  return {
    userExternalId,
    email,
    serviceExternalId,
    role: {
      name: roleName
    }
  }
}

function buildGetUserSuccessStub (userExternalId, fixtureOpts) {
  const path = '/v1/api/users/' + userExternalId
  return stubBuilder('GET', path, 200, {
    response: userFixtures.validUserResponse(fixtureOpts)
  })
}

function getUserSuccess (opts) {
  const fixtureOpts = buildUserWithServiceRoleOpts(opts)
  return buildGetUserSuccessStub(opts.userExternalId, fixtureOpts)
}

function getUserSuccessWithNoServices (externalId) {
  return buildGetUserSuccessStub(externalId, { service_roles: [] })
}

function getUserSuccessWithMultipleServices (externalId, serviceRoles) {
  const serviceRoleFixtureOpts = serviceRoles.map(buildServiceRoleOpts)
  const fixtureOpts = {
    external_id: externalId,
    service_roles: serviceRoleFixtureOpts
  }
  return buildGetUserSuccessStub(externalId, fixtureOpts)
}

function getUsersSuccess () {
  const path = '/v1/api/users'
  return stubBuilder('GET', path, 200, {
    query: {
      ids: ''
    },
    response: userFixtures.validUsersResponse()
  })
}

function getUserSuccessWithServiceRole (opts) {
  const fixtureOpts = {
    external_id: opts.userExternalId,
    service_roles: [opts.serviceRole]
  }
  return buildGetUserSuccessStub(opts.userExternalId, fixtureOpts)
}

function getUserWithNoPermissions (userExternalId, gatewayAccountId) {
  return getUserSuccess({ userExternalId, gatewayAccountId, goLiveStage: 'NOT_STARTED', role: { permissions: [] } })
}

function postUserAuthenticateSuccess (userExternalId, email, password) {
  const fixtureOpts = {
    external_id: userExternalId,
    email: email,
    password: password
  }
  const path = '/v1/api/users/authenticate'
  return stubBuilder('POST', path, 200, {
    request: userFixtures.validAuthenticateRequest(fixtureOpts),
    response: userFixtures.validUserResponse(fixtureOpts)
  })
}

function postUserAuthenticateInvalidPassword (username, password) {
  const fixtureOpts = {
    username: username,
    password: password
  }
  const path = '/v1/api/users/authenticate'
  return stubBuilder('POST', path, 401, {
    request: userFixtures.validAuthenticateRequest(fixtureOpts),
    response: userFixtures.invalidPasswordAuthenticateResponse()
  })
}

function postSecondFactorSuccess (userExternalId) {
  const path = `/v1/api/users/${userExternalId}/second-factor`
  return stubBuilder('POST', path, 200)
}

function postActivateSecondFactorSuccess (userExternalId) {
  const path = `/v1/api/users/${userExternalId}/second-factor/activate`
  return stubBuilder('POST', path, 200)
}

function postAuthenticateSecondFactorSuccess (userExternalId, code) {
  const path = `/v1/api/users/${userExternalId}/second-factor/authenticate`
  return stubBuilder('POST', path, 200, {
    request: userFixtures.validAuthenticateSecondFactorRequest(code),
    response: userFixtures.validUserResponse({ external_id: userExternalId })
  })
}

function postAuthenticateSecondFactorInvalidCode (userExternalId, code) {
  const path = `/v1/api/users/${userExternalId}/second-factor/authenticate`
  return stubBuilder('POST', path, 401, {
    request: userFixtures.validAuthenticateSecondFactorRequest(code)
  })
}

function postProvisionSecondFactorSuccess (userExternalId) {
  const path = `/v1/api/users/${userExternalId}/second-factor/provision`
  return stubBuilder('POST', path, 200, {
    response: userFixtures.validUserResponse()
  })
}

function getServiceUsersSuccess (opts) {
  const path = `/v1/api/services/${opts.serviceExternalId}/users`
  const fixtureOpts = opts.users.map(buildUserWithServiceRoleOpts)
  return stubBuilder('GET', path, 200, {
    response: userFixtures.validUsersResponse(fixtureOpts)
  })
}

function putUpdateServiceRoleSuccess (opts) {
  const path = `/v1/api/users/${opts.userExternalId}/services/${opts.serviceExternalId}`
  return stubBuilder('PUT', path, 200, {
    request: userFixtures.validUpdateServiceRoleRequest(opts.role),
    response: userFixtures.validUserResponse({
      role: opts.role,
      external_id: opts.userExternalId,
      serviceExternalId: opts.serviceExternalId
    })
  })
}

function postAssignServiceRoleSuccess (opts) {
  const fixtureOpts = {
    external_id: opts.userExternalId,
    service_external_id: opts.serviceExternalId,
    role_name: 'admin'
  }
  const path = `/v1/api/users/${opts.userExternalId}/services`
  return stubBuilder('POST', path, 200, {
    request: userFixtures.validAssignServiceRoleRequest(fixtureOpts),
    response: userFixtures.validUserResponse(fixtureOpts)
  })
}

function patchUpdateUserPhoneNumberSuccess (userExternalId, telephoneNumber) {
  const path = `/v1/api/users/${userExternalId}`
  return stubBuilder('PATCH', path, 200, {
    request: userFixtures.validUpdateTelephoneNumberRequest(telephoneNumber)
  })
}

/**
 * This is used when calling a route expects a user to be in a certain state to proceed, and then
 * performs a redirect to another route which expects the user to have changed.
 *
 * An example of this is in the request to go live flow, where the service must have a particular
 * value of `current_go_live_stage` to be able to navigate to a page in the flow, and then when the
 * page is submitted it will continue to the next page in the flow which expects a different value
 * of `current_go_live_stage` for the page to load successfully.
 * @param {*} firstResponseOpts the user options for the first response
 * @param {*} secondResponseOpts  the user options for the second response
 */
function getUserSuccessRespondDifferentlySecondTime (userExternalId, firstResponseOpts, secondResponseOpts) {
  const aValidUserResponse = userFixtures.validUserResponse({
    external_id: userExternalId,
    service_roles: [buildServiceRoleOpts(firstResponseOpts)]
  })
  const aSecondValidUserResponse = userFixtures.validUserResponse({
    external_id: userExternalId,
    service_roles: [buildServiceRoleOpts(secondResponseOpts)]
  })

  return {
    predicates: [{
      equals: {
        method: 'GET',
        path: `/v1/api/users/${userExternalId}`,
        headers: {
          'Accept': 'application/json'
        }
      }
    }],
    responses: [{
      is: {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: aValidUserResponse
      },
      _behaviors: {
        repeat: 1
      }
    }, {
      is: {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: aSecondValidUserResponse
      },
      _behaviors: {
        repeat: 1
      }
    }
    ]
  }
}

function buildServiceRoleOpts (opts) {
  const service = {
    default_billing_address_country: opts.defaultBillingAddressCountry
  }

  if (opts.gatewayAccountId) {
    service.gateway_account_ids = [String(opts.gatewayAccountId)]
  } else if (opts.gatewayAccountIds) {
    service.gateway_account_ids = opts.gatewayAccountIds.map(String)
  }

  if (opts.pspTestAccountStage) {
    service.current_psp_test_account_stage = opts.pspTestAccountStage
  }

  if (opts.serviceExternalId) {
    service.external_id = opts.serviceExternalId
  }
  if (opts.serviceName) {
    service.name = opts.serviceName.en || opts.serviceName
    service.service_name = opts.serviceName
  }
  if (opts.goLiveStage) {
    service.current_go_live_stage = opts.goLiveStage
  }
  if (opts.merchantName) {
    service.merchant_details = {
      name: opts.merchantName
    }
  }
  if (opts.merchantDetails) {
    service.merchant_details = opts.merchantDetails
  }

  const serviceRole = {
    service
  }

  if (opts.role) {
    serviceRole.role = opts.role
  }

  return serviceRole
}

function buildUserWithServiceRoleOpts (opts) {
  const serviceRole = buildServiceRoleOpts(opts)
  return {
    external_id: opts.userExternalId,
    service_roles: [serviceRole],
    email: opts.email,
    telephone_number: opts.telephoneNumber,
    second_factor: opts.secondFactor,
    provisional_otp_key: opts.provisionalOtpKey
  }
}

module.exports = {
  getUserSuccess,
  getUsersSuccess,
  getUserSuccessWithNoServices,
  getUserWithNoPermissions,
  getUserSuccessWithServiceRole,
  getUserWithServiceRoleStubOpts,
  getUserSuccessRespondDifferentlySecondTime,
  getServiceUsersSuccess,
  postAssignServiceRoleSuccess,
  postUserAuthenticateSuccess,
  postUserAuthenticateInvalidPassword,
  postSecondFactorSuccess,
  postActivateSecondFactorSuccess,
  postAuthenticateSecondFactorSuccess,
  postAuthenticateSecondFactorInvalidCode,
  postProvisionSecondFactorSuccess,
  putUpdateServiceRoleSuccess,
  getUserSuccessWithMultipleServices,
  patchUpdateUserPhoneNumberSuccess
}
