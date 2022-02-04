const chai = require('chai')
const { expect } = chai
const { indexServiceNamesByGatewayAccountId } = require('../../../../app/controllers/payouts/user-services-names.controller')
const User = require('../../../../app/models/User.class')
const fixtures = require('../../../fixtures/user.fixtures')

describe('user services to gateway account id map utility', () => {
  it('indexes gateway accounts to service names given a valid user object', () => {
    const user = new User(fixtures.validUser({ gateway_account_ids: ['300'] }))
    const serviceNameMap = indexServiceNamesByGatewayAccountId(user)

    expect(serviceNameMap['300']).to.equal('System Generated')
  })

  it('invalid user object will return an empty map', () => {
    const serviceNameMap = indexServiceNamesByGatewayAccountId(null)
    expect(serviceNameMap).to.deep.equal({})
  })
})
