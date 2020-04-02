const { expect } = require('chai')

const { userServicesContainsGatewayAccount } = require('./../../../app/utils/valid_account_id')
const { validUser } = require('./../../fixtures/user_fixtures')

describe('gateway account filter utiltiies', () => {
  describe('gateway account exists on users service roles', () => {
    it('returns valid for gateway account belonging to user', () => {
      const opts = {
        gateway_account_ids: ['1', '2', '3']
      }
      const user = validUser(opts).getAsObject()
      const valid = userServicesContainsGatewayAccount('2', user)
      expect(valid).to.equal(true)
    })
    it('returns invalid for gateway account not belonging to user', () => {
      const opts = {
        gateway_account_ids: ['1', '2', '3']
      }
      const user = validUser(opts).getAsObject()
      const valid = userServicesContainsGatewayAccount('4', user)
      expect(valid).to.equal(false)
    })
  })
})
