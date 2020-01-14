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

module.exports = { getUserWithServiceRoleStubOpts }
