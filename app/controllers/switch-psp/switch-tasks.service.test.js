const { expect } = require('chai')
const { getTaskList, isComplete } = require('./switch-tasks.service')
const { getSwitchingCredential } = require('../../utils/credentials')
const gatewayAccountFixtures = require('../../../test/fixtures/gateway-account.fixtures')

describe('Switching PSP service', () => {
  describe('parses a task list based on switching credential', () => {
    describe('for supported Worldpay payment provider', () => {
      it('gets an empty task list for an account with no progress', () => {
        const account = gatewayAccountFixtures.validGatewayAccount({
          gateway_account_credentials: [
            { state: 'CREATED', payment_provider: 'worldpay', id: 100 },
            { state: 'ACTIVE', payment_provider: 'smartpay', id: 100 }
          ]
        })
        const targetCredential = getSwitchingCredential(account)
        const taskList = getTaskList(targetCredential, account)
        expect(Object.keys(taskList)).to.have.length(2)
        expect(taskList.LINK_CREDENTIALS.enabled).to.equal(true)
        expect(taskList.LINK_CREDENTIALS.complete).to.equal(false)
      })
      it('gets an complete task list for an account with progress', () => {
        const account = gatewayAccountFixtures.validGatewayAccount({
          gateway_account_credentials: [
            { state: 'ENTERED', payment_provider: 'worldpay', id: 100 },
            { state: 'ACTIVE', payment_provider: 'smartpay', id: 100 }
          ]
        })
        const targetCredential = getSwitchingCredential(account)
        const taskList = getTaskList(targetCredential, account)
        expect(Object.keys(taskList)).to.have.length(2)
        expect(taskList.LINK_CREDENTIALS.enabled).to.equal(true)
        expect(taskList.LINK_CREDENTIALS.complete).to.equal(true)
        expect(taskList.VERIFY_PSP_INTEGRATION.enabled).to.equal(true)
        expect(taskList.VERIFY_PSP_INTEGRATION.complete).to.equal(false)
      })
    })
  })

  describe('reduces switch complete status', () => {
    it('correctly calculates all conditions being met for Worldpay', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'VERIFIED_WITH_LIVE_PAYMENT', payment_provider: 'worldpay', id: 100 },
          { state: 'ACTIVE', payment_provider: 'smartpay', id: 100 }
        ]
      })
      const targetCredential = getSwitchingCredential(account)
      const taskList = getTaskList(targetCredential, account)
      expect(isComplete(taskList)).to.equal(true)
    })

    it('correctly calculates progress required for Worldpay', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'CREATED', payment_provider: 'worldpay', id: 100 },
          { state: 'ACTIVE', payment_provider: 'smartpay', id: 100 }
        ]
      })
      const targetCredential = getSwitchingCredential(account)
      const taskList = getTaskList(targetCredential, account)
      expect(isComplete(taskList)).to.equal(false)
    })
  })
})
