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
        name: opts.serviceName,
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
  if (opts && opts.role) {
    stubOptions.service_roles[0].role = opts.role
  }

  return {
    name: 'getUserSuccess',
    opts: stubOptions
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

module.exports = {
  getUserSuccess,
  getUserSuccessWithServiceRole,
  getUserWithServiceRoleStubOpts
}
