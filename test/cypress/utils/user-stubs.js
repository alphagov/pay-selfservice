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
  let stubOptions = {
    external_id: opts.userExternalId,
    service_roles: [{
      service: {
        gateway_account_ids: [opts.gatewayAccountId]
      }
    }],
    username: opts.email,
    email: opts.email,
    telephone_number: opts.telephoneNumber
  }

  if (opts.serviceExternalId) {
    stubOptions.service_roles[0].service.external_id = opts.serviceExternalId
  }
  if (opts.serviceName) {
    stubOptions.service_roles[0].service.name = opts.serviceName
    stubOptions.service_roles[0].service.service_name = opts.serviceName
  }
  if (opts.goLiveStage) {
    stubOptions.service_roles[0].service.current_go_live_stage = opts.goLiveStage
  }
  if (opts && opts.role) {
    stubOptions.service_roles[0].role = opts.role
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

const getUserSuccessRepeatFirstResponseNTimes = function (opts) {
  return {
    name: 'getUserSuccessRepeatFirstResponseNTimes',
    opts: [{
      external_id: opts[0].userExternalId,
      service_roles: [opts[0].serviceRoles],
      repeat: 2
    }, {
      external_id: opts[1].userExternalId,
      service_roles: [opts[1].serviceRoles],
      repeat: 2
    }]
  }
}

module.exports = {
  getUserSuccess,
  getUsersSuccess,
  getUserWithNoPermissions,
  getUserSuccessWithServiceRole,
  getUserWithServiceRoleStubOpts,
  getUserSuccessRepeatFirstResponseNTimes,
  getServiceUsersSuccess,
  postAssignServiceRoleSuccess,
  postUserAuthenticateSuccess,
  postUserAuthenticateInvalidPassword,
  postSecondFactorSuccess,
  putUpdateServiceRoleSuccess
}
