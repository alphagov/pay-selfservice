const { expect } = require('chai')
const gatewayAccountFixtures = require('../../test/fixtures/gateway-account.fixtures')
const { yourPSPNavigationItems } = require('./nav-builder')

describe('navigation builder', () => {
  describe('build links to psp pages', () => {
    describe('single credentials', () => {
      afterEach(() => {
        process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = undefined
      })

      it('correctly labels ids and names and returns valid schema when there is only a smartpay credential', () => {
        const account = gatewayAccountFixtures.validGatewayAccount({
          gateway_account_credentials: [
            { payment_provider: 'smartpay', state: 'ACTIVE', external_id: 'a-valid-credential-id-smartpay' }
          ]
        })

        const links = yourPSPNavigationItems(account, '/your-psp/a-valid-credential-id-smartpay')
        expect(links).to.have.length(1)
        expect(links[0].id).to.equal('navigation-menu-your-psp')
        expect(links[0].name).to.equal('Your PSP - Smartpay')
        expect(links[0].current).to.equal(true)
      })

      it('correctly labels ids and names and returns valid schema when there is only a WorldPay credentials and ENABLE_STRIPE_ONBOARDING_TASK_LIST is true', () => {
        process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'
        const account = gatewayAccountFixtures.validGatewayAccount({
          gateway_account_credentials: [
            { payment_provider: 'worldpay', state: 'ACTIVE', external_id: 'a-valid-credential-id-smartpay' }
          ]
        })

        const links = yourPSPNavigationItems(account, '/your-psp/a-valid-credential-id-smartpay')
        expect(links).to.have.length(1)
        expect(links[0].name).to.equal('Your PSP - Worldpay')
        expect(links[0].current).to.equal(true)
      })

      it('correctly labels ids and names and returns valid schema when Stripe and ENABLE_STRIPE_ONBOARDING_TASK_LIST is true', () => {
        process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'
        const account = gatewayAccountFixtures.validGatewayAccount({
          gateway_account_credentials: [
            { payment_provider: 'stripe', state: 'ACTIVE', external_id: 'a-valid-credential-id-smartpay' }
          ]
        })

        const links = yourPSPNavigationItems(account, '/your-psp/a-valid-credential-id-smartpay')
        expect(links).to.have.length(1)
        expect(links[0].name).to.equal('Information for Stripe')
        expect(links[0].current).to.equal(true)
      })
    })

    describe('switching credentials', () => {
      afterEach(() => {
        process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = undefined
      })

      it('correctly labels ids and names and returns valid schema', () => {
        const account = gatewayAccountFixtures.validGatewayAccount({
          gateway_account_credentials: [
            { payment_provider: 'smartpay', state: 'ACTIVE', external_id: 'a-valid-credential-id-smartpay' },
            { payment_provider: 'worldpay', state: 'RETIRED', external_id: 'another-valid-credential-id-worldpay' }
          ]
        })

        const links = yourPSPNavigationItems(account, '/your-psp/a-valid-credential-id-smartpay')
        expect(links).to.have.length(2)
        expect(links[0].name).to.equal('Your PSP - Smartpay')
        expect(links[0].current).to.equal(true)
        expect(links[1].name).to.equal('Old PSP - Worldpay')
        expect(links[1].current).to.equal(false)
      })

      it('correctly labels ids and names and returns valid schema, when  ENABLE_STRIPE_ONBOARDING_TASK_LIST is true', () => {
        process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'
        const account = gatewayAccountFixtures.validGatewayAccount({
          gateway_account_credentials: [
            { payment_provider: 'stripe', state: 'ACTIVE', external_id: 'a-valid-credential-id-smartpay' },
            { payment_provider: 'worldpay', state: 'RETIRED', external_id: 'another-valid-credential-id-worldpay' }
          ]
        })

        const links = yourPSPNavigationItems(account, '/your-psp/a-valid-credential-id-smartpay')
        expect(links).to.have.length(2)
        expect(links[0].name).to.equal('Information for Stripe')
        expect(links[0].current).to.equal(true)
        expect(links[1].name).to.equal('Old PSP - Worldpay')
        expect(links[1].current).to.equal(false)
      })
    })
  })
})
