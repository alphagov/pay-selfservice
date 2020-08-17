'use strict'

const getUserWithServiceRoleStubOpts = function (userExternalId, email, serviceExternalId, roleName, roleDescription) {
  return {
    external_id: userExternalId,
    username: email,
    email: email,
    service_roles: [
      {
        service: {
          external_id: serviceExternalId
        },
        role: {
          name: roleName
        }
      }
    ]
  }
}

const getUserSuccess = function (opts) {
  const serviceRole = buildServiceRoleOpts(opts)

  const stubOptions = {
    external_id: opts.userExternalId,
    service_roles: [serviceRole],
    username: opts.email,
    email: opts.email,
    telephone_number: opts.telephoneNumber
  }

  return {
    name: 'getUserSuccess',
    opts: stubOptions
  }
}

const getUsersSuccess = function () {
  return {
    name: 'getUsersSuccess',
    opts: {
      users: []
    }
  }
}

const getUserSuccessWithServiceRole = function (opts) {
  return {
    name: 'getUserSuccess',
    opts: {
      external_id: opts.userExternalId,
      service_roles: [opts.serviceRole]
    }
  }
}

const getUserWithNoPermissions = function (userExternalId, gatewayAccountIds) {
  return getUserSuccess({ userExternalId, gatewayAccountIds, goLiveStage: 'NOT_STARTED', role: { permissions: [] } })
}

const postUserAuthenticateSuccess = function (userExternalId, username, password) {
  return {
    name: 'postUserAuthenticateSuccess',
    opts: {
      external_id: userExternalId,
      username: username,
      password: password
    }
  }
}

const postUserAuthenticateInvalidPassword = function (username, password) {
  return {
    name: 'postUserAuthenticateInvalidPassword',
    opts: {
      username: username,
      password: password
    }
  }
}

const postSecondFactorSuccess = function (userExternalId) {
  return {
    name: 'postSecondFactorSuccess',
    opts:
    {
      external_id: userExternalId
    }
  }
}

const getServiceUsersSuccess = function (opts) {
  return {
    name: 'getServiceUsersSuccess',
    opts: {
      serviceExternalId: opts.serviceExternalId,
      users: opts.users
    }
  }
}

const putUpdateServiceRoleSuccess = function (opts) {
  return {
    name: 'putUpdateServiceRoleSuccess',
    opts: {
      role: opts.role,
      external_id: opts.userExternalId,
      serviceExternalId: opts.serviceExternalId
    }
  }
}

const postAssignServiceRoleSuccess = function (opts) {
  return {
    name: 'postAssignServiceRoleSuccess',
    opts: {
      external_id: opts.userExternalId,
      service_external_id: opts.serviceExternalId,
      role_name: 'admin',
      verifyCalledTimes: 1
    }
  }
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
const getUserSuccessRespondDifferentlySecondTime = function (userExternalId, firstResponseOpts, secondResponseOpts) {
  return {
    name: 'getUserSuccessRespondDifferentlySecondTime',
    opts: {
      firstResponseOpts: {
        external_id: userExternalId,
        service_roles: [buildServiceRoleOpts(firstResponseOpts)]
      },
      secondResponseOpts: {
        external_id: userExternalId,
        service_roles: [buildServiceRoleOpts(secondResponseOpts)]
      }
    }
  }
}

function buildServiceRoleOpts (opts) {
  const serviceRole = {
    service: {
      gateway_account_ids: [opts.gatewayAccountId]
    }
  }

  if (opts.serviceExternalId) {
    serviceRole.service.external_id = opts.serviceExternalId
  }
  if (opts.serviceName) {
    serviceRole.service.name = opts.serviceName
    serviceRole.service.service_name = opts.serviceName
  }
  if (opts.goLiveStage) {
    serviceRole.service.current_go_live_stage = opts.goLiveStage
  }
  if (opts.merchantName) {
    serviceRole.service.merchant_details = {
      name: opts.merchantName
    }
  }
  if (opts.role) {
    serviceRole.role = opts.role
  }

  return serviceRole
}

module.exports = {
  getUserSuccess,
  getUsersSuccess,
  getUserWithNoPermissions,
  getUserSuccessWithServiceRole,
  getUserWithServiceRoleStubOpts,
  getUserSuccessRespondDifferentlySecondTime,
  getServiceUsersSuccess,
  postAssignServiceRoleSuccess,
  postUserAuthenticateSuccess,
  postUserAuthenticateInvalidPassword,
  postSecondFactorSuccess,
  putUpdateServiceRoleSuccess
}
