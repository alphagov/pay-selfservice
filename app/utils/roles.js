const _ = require('lodash')

const roles = {
  admin: {
    extId: 200,
    name: 'admin',
    description: 'Administrator',
    explanation: 'They can view transactions, refund payments and manage settings',
    agentInitiatedMotoServicesOnly: false
  },
  'view-and-refund': {
    extId: 300,
    name: 'view-and-refund',
    description: 'View and refund',
    explanation: 'They can view transactions and refund payments',
    agentInitiatedMotoServicesOnly: false
  },
  'view-only': {
    extId: 400,
    name: 'view-only',
    description: 'View only',
    explanation: 'They can view transactions',
    agentInitiatedMotoServicesOnly: false
  },
  'view-and-initiate-moto': {
    extId: 500,
    name: 'view-and-initiate-moto',
    description: 'View and take telephone payments',
    explanation: 'They can view transactions and take telephone payments',
    agentInitiatedMotoServicesOnly: true
  },
  'view-refund-and-initiate-moto': {
    extId: 600,
    name: 'view-refund-and-initiate-moto',
    description: 'View, refund and take telephone payments',
    explanation: 'They can view transactions, refund payments, and take telephone payments',
    agentInitiatedMotoServicesOnly: true
  }
}

module.exports = {
  roles,
  getRoleByExtId: roleExtId => {
    let found
    _.toArray(roles).forEach(role => {
      if (role.extId === roleExtId) {
        found = role
      }
    })
    return found
  },
  getAvailableRolesForService: serviceHasAgentInitiatedMotoEnabled => {
    const availableRoles = {}
    for (const roleName in roles) {
      const role = roles[roleName]
      if (serviceHasAgentInitiatedMotoEnabled) {
        if (roleName === 'admin') {
          // for agent-initiated moto services, add 'take telephone payments' to the explanation content for the admin role
          availableRoles[roleName] = {
            description: role.description,
            explanation: 'They can view transactions, refund payments, take telephone payments and manage settings'
          }
        } else {
          availableRoles[roleName] = { description: role.description, explanation: role.explanation }
        }
      } else if (!role.agentInitiatedMotoServicesOnly) {
        availableRoles[roleName] = { description: role.description, explanation: role.explanation }
      }
    }
    return availableRoles
  }
}
