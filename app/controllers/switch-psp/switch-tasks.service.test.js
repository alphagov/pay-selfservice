const {expect} = require('chai')
const {getTaskList, isComplete} = require('./switch-tasks.service')
const {getSwitchingCredential} = require('../../utils/credentials')
const gatewayAccountFixtures = require('../../../test/fixtures/gateway-account.fixtures')

describe('Switching PSP service', () => {
  describe('parses a task list based on switching credential', () => {
    describe('for supported Worldpay payment provider', () => {
      describe('when not a MOTO account', () => {
        it('gets an empty task list for an account with no progress', () => {
          const account = gatewayAccountFixtures.validGatewayAccount({
            gateway_account_credentials: [
              {state: 'CREATED', payment_provider: 'worldpay', id: 100},
              {state: 'ACTIVE', payment_provider: 'smartpay', id: 100}
            ],
            allow_moto: false
          })
          const targetCredential = getSwitchingCredential(account)
          const taskList = getTaskList(targetCredential, account)
          expect(Object.keys(taskList)).to.have.length(3)
          expect(taskList.LINK_CREDENTIALS.enabled).to.equal(true)
          expect(taskList.LINK_CREDENTIALS.complete).to.equal(false)
          expect(taskList.LINK_FLEX_CREDENTIALS.enabled).to.equal(true)
          expect(taskList.LINK_FLEX_CREDENTIALS.complete).to.equal(false)
          expect(taskList.VERIFY_PSP_INTEGRATION.enabled).to.equal(false)
          expect(taskList.VERIFY_PSP_INTEGRATION.complete).to.equal(false)
        })

        it('gets an complete task list for an account with progress', () => {
          const account = gatewayAccountFixtures.validGatewayAccount({
            gateway_account_credentials: [
              {state: 'ENTERED', payment_provider: 'worldpay', id: 100},
              {state: 'ACTIVE', payment_provider: 'smartpay', id: 100}
            ],
            requires3ds: true,
            integrationVersion3ds: 2,
            allow_moto: false
          })
          const targetCredential = getSwitchingCredential(account)
          const taskList = getTaskList(targetCredential, account)
          expect(Object.keys(taskList)).to.have.length(3)
          expect(taskList.LINK_CREDENTIALS.enabled).to.equal(true)
          expect(taskList.LINK_CREDENTIALS.complete).to.equal(true)
          expect(taskList.LINK_FLEX_CREDENTIALS.enabled).to.equal(true)
          expect(taskList.LINK_FLEX_CREDENTIALS.complete).to.equal(true)
          expect(taskList.VERIFY_PSP_INTEGRATION.enabled).to.equal(true)
          expect(taskList.VERIFY_PSP_INTEGRATION.complete).to.equal(false)
        })
      })

      describe('when it is a MOTO account', () => {
        it('should get an empty task list for an account with no progress', () => {
          const account = gatewayAccountFixtures.validGatewayAccount({
            gateway_account_credentials: [
              {state: 'CREATED', payment_provider: 'worldpay', id: 100},
              {state: 'ACTIVE', payment_provider: 'smartpay', id: 100}
            ],
            allow_moto: true
          })
          const targetCredential = getSwitchingCredential(account)
          const taskList = getTaskList(targetCredential, account)
          expect(Object.keys(taskList)).to.have.length(2)
          expect(taskList.LINK_CREDENTIALS.enabled).to.equal(true)
          expect(taskList.LINK_CREDENTIALS.complete).to.equal(false)
          expect(taskList.VERIFY_PSP_INTEGRATION.enabled).to.equal(false)
          expect(taskList.VERIFY_PSP_INTEGRATION.complete).to.equal(false)
        })

        it('should get complete task list for an account with progress', () => {
          const account = gatewayAccountFixtures.validGatewayAccount({
            gateway_account_credentials: [
              {state: 'ENTERED', payment_provider: 'worldpay', id: 100},
              {state: 'ACTIVE', payment_provider: 'smartpay', id: 100}
            ],
            allow_moto: true
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
  })

  describe('reduces switch complete status', () => {
    describe('for supported Worldpay payment provider', () => {
      describe(('not a MOTO account'), () => {
        it('correctly calculates all conditions being met for Worldpay', () => {
          const account = gatewayAccountFixtures.validGatewayAccount({
            gateway_account_credentials: [
              {state: 'VERIFIED_WITH_LIVE_PAYMENT', payment_provider: 'worldpay', id: 100},
              {state: 'ACTIVE', payment_provider: 'smartpay', id: 100}
            ],
            requires3ds: true,
            integrationVersion3ds: 2,
            allow_moto: false
          })
          const targetCredential = getSwitchingCredential(account)
          const taskList = getTaskList(targetCredential, account)
          expect(isComplete(taskList)).to.equal(true)
        })

        it('correctly calculates progress required for Worldpay', () => {
          const account = gatewayAccountFixtures.validGatewayAccount({
            gateway_account_credentials: [
              {state: 'CREATED', payment_provider: 'worldpay', id: 100},
              {state: 'ACTIVE', payment_provider: 'smartpay', id: 100}
            ],
            allow_moto: false
          })
          const targetCredential = getSwitchingCredential(account)
          const taskList = getTaskList(targetCredential, account)
          expect(isComplete(taskList)).to.equal(false)
        })

        it('should correctly calculate progress required for Worldpay when 3ds is not enabled', () => {
          const account = gatewayAccountFixtures.validGatewayAccount({
            gateway_account_credentials: [
              {state: 'ENTERED', payment_provider: 'worldpay', id: 100},
              {state: 'ACTIVE', payment_provider: 'smartpay', id: 100}
            ],
            requires3ds: false,
            integrationVersion3ds: 2,
            allow_moto: false
          })
          const targetCredential = getSwitchingCredential(account)
          const taskList = getTaskList(targetCredential, account)
          expect(isComplete(taskList)).to.equal(false)
        })

        it('should correctly calculate progress required for Worldpay when account 3ds version is 1', () => {
          const account = gatewayAccountFixtures.validGatewayAccount({
            gateway_account_credentials: [
              {state: 'ENTERED', payment_provider: 'worldpay', id: 100},
              {state: 'ACTIVE', payment_provider: 'smartpay', id: 100}
            ],
            requires3ds: true,
            integrationVersion3ds: 1,
            allow_moto: false
          })
          const targetCredential = getSwitchingCredential(account)
          const taskList = getTaskList(targetCredential, account)
          expect(isComplete(taskList)).to.equal(false)
        })
      })

      describe(('MOTO account'), () => {
        it('should correctly calculate all conditions being met for Worldpay', () => {
          const account = gatewayAccountFixtures.validGatewayAccount({
            gateway_account_credentials: [
              {state: 'VERIFIED_WITH_LIVE_PAYMENT', payment_provider: 'worldpay', id: 100},
              {state: 'ACTIVE', payment_provider: 'smartpay', id: 100}
            ],
            allow_moto: true
          })
          const targetCredential = getSwitchingCredential(account)
          const taskList = getTaskList(targetCredential, account)
          expect(isComplete(taskList)).to.equal(true)
        })

        it('should correctly calculate progress required for Worldpay', () => {
          const account = gatewayAccountFixtures.validGatewayAccount({
            gateway_account_credentials: [
              {state: 'CREATED', payment_provider: 'worldpay', id: 100},
              {state: 'ACTIVE', payment_provider: 'smartpay', id: 100}
            ],
            allow_moto: true
          })
          const targetCredential = getSwitchingCredential(account)
          const taskList = getTaskList(targetCredential, account)
          expect(isComplete(taskList)).to.equal(false)
        })
      })
    })

    describe(('for a supported Stripe payment provider'), () => {
      it('correctly calculates all conditions being met for Stripe', () => {
        const account = gatewayAccountFixtures.validGatewayAccount({
          gateway_account_credentials: [
            {state: 'VERIFIED_WITH_LIVE_PAYMENT', payment_provider: 'stripe', id: 100},
            {state: 'ACTIVE', payment_provider: 'worldpay', id: 100}
          ]
        })
        const service = {
          merchantDetails: {
            url: 'http://example.org'
          }
        }
        account.connectorGatewayAccountStripeProgress = {
          bankAccount: true,
          director: true,
          vatNumber: true,
          companyNumber: true,
          responsiblePerson: true,
          organisationDetails: true,
          governmentEntityDocument: true
        }
        const targetCredential = getSwitchingCredential(account)
        const taskList = getTaskList(targetCredential, account, service)
        expect(isComplete(taskList)).to.equal(true)
      })

      it('correctly calculates progress required for Stripe', () => {
        const account = gatewayAccountFixtures.validGatewayAccount({
          gateway_account_credentials: [
            {state: 'VERIFIED_WITH_LIVE_PAYMENT', payment_provider: 'stripe', id: 100},
            {state: 'ACTIVE', payment_provider: 'worldpay', id: 100}
          ]
        })
        const service = {
          merchantDetails: {}
        }
        account.connectorGatewayAccountStripeProgress = {
          bankAccount: true,
          director: true,
          vatNumber: true,
          companyNumber: true,
          responsiblePerson: true,
          organisationDetails: true,
          governmentEntityDocument: true
        }
        const targetCredential = getSwitchingCredential(account)
        const taskList = getTaskList(targetCredential, account, service)

        expect(isComplete(taskList)).to.equal(false)
        expect(taskList.ENTER_ORGANISATION_URL.complete).to.equal('')
      })
    })
  })
})
