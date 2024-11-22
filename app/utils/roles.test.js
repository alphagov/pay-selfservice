const chai = require('chai')
const roles = require('./roles')
const { getAvailableRolesForService } = require('@utils/roles')
const expect = chai.expect

describe('roles module', function () {
  it('should find get role by role id', () => {
    const role = roles.getRoleByExtId(200)

    expect(role).to.deep.equal({
      extId: 200,
      name: 'admin',
      description: 'Administrator',
      explanation: 'They can view transactions, refund payments and manage settings',
      agentInitiatedMotoServicesOnly: false
    })
  })

  it('should return undefined for unknown role id', () => {
    const role = roles.getRoleByExtId('999')

    expect(role).to.equal(undefined)
  })

  it('should return the correct roles for a service without agent-initiated moto', () => {
    const rolesForService = getAvailableRolesForService(false)

    expect(rolesForService).to.have.all.keys('admin', 'view-and-refund', 'view-only')
    expect(rolesForService).to.have.property('admin').to.deep.equal({
      description: 'Administrator',
      explanation: 'They can view transactions, refund payments and manage settings'
    })
  })

  it('should return the correct roles for a service with agent-initiated moto', () => {
    const rolesForService = getAvailableRolesForService(true)

    expect(rolesForService).to.have.all.keys('admin', 'view-and-refund', 'view-only', 'view-and-initiate-moto', 'view-refund-and-initiate-moto')
    expect(rolesForService).to.have.property('admin').to.deep.equal({
      description: 'Administrator',
      explanation: 'They can view transactions, refund payments, take telephone payments and manage settings'
    })
  })
})
