const { expect } = require('chai')

const { liveUserServicesGatewayAccounts } = require('./../../../app/utils/valid_account_id')
const { validUser } = require('./../../fixtures/user_fixtures')

describe('gateway account filter utiltiies', () => {
  describe('all live gateway accounts for a given user', () => {
    it('returns only live account ids from a valid list of user services', () => {
      const opts = {
        gateway_account_ids: ['1', '2', '3']
      }
      const user = validUser(opts).getAsObject()
      const parsed = liveUserServicesGatewayAccounts(user)
      expect(parsed).to.equal('1,2,3')
    })
  })
})
