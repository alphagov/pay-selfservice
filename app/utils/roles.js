const _ = require('lodash')

const roles = {
  admin: {
    extId: 200,
    name: 'admin',
    description: 'Administrator',
    explanation: 'They can view transactions, refund payments and manage settings',
    agentInitiatedMotoServicesOnly: false
  },
  'view-refund-and-initiate-moto': {
    extId: 600,
    name: 'view-refund-and-initiate-moto',
    description: 'View, refund and take telephone payments',
    explanation: 'They can view transactions, refund payments, and take telephone payments',
    agentInitiatedMotoServicesOnly: true
  },
  'view-and-refund': {
    extId: 300,
    name: 'view-and-refund',
    description: 'View and refund',
    explanation: 'They can view transactions and refund payments',
    agentInitiatedMotoServicesOnly: false
  },
  'view-and-initiate-moto': {
    extId: 500,
    name: 'view-and-initiate-moto',
    description: 'View and take telephone payments',
    explanation: 'They can view transactions and take telephone payments',
    agentInitiatedMotoServicesOnly: true
  },
  'view-only': {
    extId: 400,
    name: 'view-only',
    description: 'View only',
    explanation: 'They can view transactions',
    agentInitiatedMotoServicesOnly: false
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
    const roleDisplayOrder = ['admin', 'view-refund-and-initiate-moto', 'view-and-refund', 'view-and-initiate-moto', 'view-only']

    return roleDisplayOrder.map(roleName => roles[roleName])
      .filter(role => serviceHasAgentInitiatedMotoEnabled || !role.agentInitiatedMotoServicesOnly)
      .map(role => _.pick(role, ['name', 'description', 'explanation']))
      .map(role => {
        // for agent-initiated moto services, add 'take telephone payments' to the explanation content for the admin role
        return (role.name === 'admin' && serviceHasAgentInitiatedMotoEnabled)
          ? { ...role, explanation: 'They can view transactions, refund payments, take telephone payments and manage settings' }
          : role
      })
  }
}
