const _ = require('lodash')

const roles = {
  admin: { extId: 200, name: 'admin', description: 'Administrator' },
  'view-and-refund': { extId: 300, name: 'view-and-refund', description: 'View and refund' },
  'view-only': { extId: 400, name: 'view-only', description: 'View only' },
  'view-and-initiate-moto': { extId: 500, name: 'view-and-initiate-moto', description: 'View and take telephone payments' },
  'view-refund-and-initiate-moto': { extId: 600, name: 'view-refund-and-initiate-moto', description: 'View, refund and take telephone payments' }
}

module.exports = {

  roles: roles,

  getRoleByExtId: roleExtId => {
    let found
    _.toArray(roles).forEach(role => {
      if (role.extId === roleExtId) {
        found = role
      }
    })
    return found
  }
}
