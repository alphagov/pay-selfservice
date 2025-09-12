import userStubs from '@test/cypress/stubs/user-stubs'
import ROLES from '@test/fixtures/roles.fixtures'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import PaymentProviders from '@models/constants/payment-providers'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import GoLiveStage from '@models/constants/go-live-stage'
import CredentialState from '@models/constants/credential-state'

const USER_EXTERNAL_ID = 'user456def'
const GATEWAY_ACCOUNT_ID = 117
const SERVICE_EXTERNAL_ID = 'service123abc'
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const setupStubs = (
  gatewayAccountType: string,
  goLiveStage: string,
  paymentProvider: string,
  credentialState: string
) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      goLiveStage: goLiveStage,
      role: ROLES.admin,
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, gatewayAccountType, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: gatewayAccountType,
      payment_provider: paymentProvider,
      gateway_account_credentials: [
        {
          state: credentialState,
          payment_provider: paymentProvider,
          credentials: {},
          external_id: 'credential123abc',
        },
      ],
    }),
  ])
}

describe('Service Name Component', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('live service - psp onboarding complete', () => {
    beforeEach(() => {
      setupStubs(GatewayAccountType.LIVE, GoLiveStage.LIVE, PaymentProviders.WORLDPAY, CredentialState.ACTIVE)
    })

    it('should display service in live mode', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.LIVE}/dashboard`)
      cy.get('#service-name').find('.govuk-body').should('contain.text', SERVICE_NAME.en)
      cy.get('#service-name').find('.govuk-tag').should('contain.text', 'Live')
      cy.get('#service-name').find('.govuk-tag').should('have.class', 'govuk-tag--green')
      cy.get('#service-name').find('p').should('have.length', 1)
    })
  })

  describe('live service - sandbox mode', () => {
    beforeEach(() => {
      setupStubs(GatewayAccountType.TEST, GoLiveStage.LIVE, PaymentProviders.SANDBOX, CredentialState.ACTIVE)
    })

    it('should display service in sandbox mode', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/dashboard`)
      cy.get('#service-name').find('.govuk-body').should('contain.text', SERVICE_NAME.en)
      cy.get('#service-name').find('.govuk-tag').should('contain.text', 'Sandbox mode')
      cy.get('#service-name').find('.govuk-tag').should('have.class', 'govuk-tag--blue')
      cy.get('#service-name').find('p').should('have.length', 2)
      cy.get('#service-name')
        .find('p')
        .eq(1)
        .should(
          'contain.text',
          "You're in sandbox mode. Some settings are not available. Only test payment data is shown."
        )
        .find('a')
        .should('contain.text', 'Exit sandbox mode')
        .should('have.attr', 'href', `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.LIVE}/dashboard`)
    })
  })

  describe('live service - worldpay psp onboarding not complete', () => {
    beforeEach(() => {
      setupStubs(GatewayAccountType.LIVE, GoLiveStage.LIVE, PaymentProviders.WORLDPAY, CredentialState.CREATED)
    })

    it('should display service as not live yet', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.LIVE}/dashboard`)
      cy.get('#service-name').find('.govuk-body').should('contain.text', SERVICE_NAME.en)
      cy.get('#service-name').find('.govuk-tag').should('contain.text', 'Not live yet')
      cy.get('#service-name').find('.govuk-tag').should('have.class', 'govuk-tag--blue')
      cy.get('#service-name').find('p').should('have.length', 2)
      cy.get('#service-name')
        .find('p')
        .eq(1)
        .should(
          'contain.text',
          'Your service is not live. You can test how GOV.UK Pay works but you cannot take real payments yet.'
        )
        .find('a')
        .should('contain.text', 'Complete go live')
        .should(
          'have.attr',
          'href',
          `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.LIVE}/settings/worldpay-details`
        )
    })
  })

  describe('live service - stripe psp onboarding not complete', () => {
    beforeEach(() => {
      setupStubs(GatewayAccountType.LIVE, GoLiveStage.LIVE, PaymentProviders.STRIPE, CredentialState.CREATED)
    })

    it('should display service as not live yet', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.LIVE}/dashboard`)
      cy.get('#service-name').find('.govuk-body').should('contain.text', SERVICE_NAME.en)
      cy.get('#service-name').find('.govuk-tag').should('contain.text', 'Not live yet')
      cy.get('#service-name').find('.govuk-tag').should('have.class', 'govuk-tag--blue')
      cy.get('#service-name').find('p').should('have.length', 2)
      cy.get('#service-name')
        .find('p')
        .eq(1)
        .should(
          'contain.text',
          'Your service is not live. You can test how GOV.UK Pay works but you cannot take real payments yet.'
        )
        .find('a')
        .should('contain.text', 'Complete go live')
        .should(
          'have.attr',
          'href',
          `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.LIVE}/settings/stripe-details`
        )
    })
  })

  describe('not live service - live account requested', () => {
    beforeEach(() => {
      setupStubs(
        GatewayAccountType.TEST,
        GoLiveStage.TERMS_AGREED_GOV_BANKING_WORLDPAY,
        PaymentProviders.SANDBOX,
        CredentialState.ACTIVE
      )
    })

    it('should display service as not live yet', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/dashboard`)
      cy.get('#service-name').find('.govuk-body').should('contain.text', SERVICE_NAME.en)
      cy.get('#service-name').find('.govuk-tag').should('contain.text', 'Not live yet')
      cy.get('#service-name').find('.govuk-tag').should('have.class', 'govuk-tag--blue')
      cy.get('#service-name').find('p').should('have.length', 2)
      cy.get('#service-name')
        .find('p')
        .eq(1)
        .should('contain.text', "Your service is not live. You've requested a live account from the GOV.UK Pay team.")
        .find('a')
        .should('not.exist')
    })
  })

  describe('not live service - live account request started', () => {
    beforeEach(() => {
      setupStubs(
        GatewayAccountType.TEST,
        GoLiveStage.CHOSEN_PSP_GOV_BANKING_WORLDPAY,
        PaymentProviders.SANDBOX,
        CredentialState.ACTIVE
      )
    })

    it('should display service as not live yet', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/dashboard`)
      cy.get('#service-name').find('.govuk-body').should('contain.text', SERVICE_NAME.en)
      cy.get('#service-name').find('.govuk-tag').should('contain.text', 'Not live yet')
      cy.get('#service-name').find('.govuk-tag').should('have.class', 'govuk-tag--blue')
      cy.get('#service-name').find('p').should('have.length', 2)
      cy.get('#service-name')
        .find('p')
        .eq(1)
        .should(
          'contain.text',
          'Your service is not live. You can test how GOV.UK Pay works but you cannot take real payments yet.'
        )
        .find('a')
        .should('contain.text', 'Continue your request to go live')
        .should('have.attr', 'href', `/service/${SERVICE_EXTERNAL_ID}/request-to-go-live`)
    })
  })

  describe('not live service - live account not requested', () => {
    beforeEach(() => {
      setupStubs(GatewayAccountType.TEST, GoLiveStage.NOT_STARTED, PaymentProviders.SANDBOX, CredentialState.ACTIVE)
    })

    it('should display service as not live yet', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/dashboard`)
      cy.get('#service-name').find('.govuk-body').should('contain.text', SERVICE_NAME.en)
      cy.get('#service-name').find('.govuk-tag').should('contain.text', 'Not live yet')
      cy.get('#service-name').find('.govuk-tag').should('have.class', 'govuk-tag--blue')
      cy.get('#service-name').find('p').should('have.length', 2)
      cy.get('#service-name')
        .find('p')
        .eq(1)
        .should(
          'contain.text',
          'Your service is not live. You can test how GOV.UK Pay works but you cannot take real payments yet.'
        )
        .find('a')
        .should('contain.text', 'Ask to go live')
        .should('have.attr', 'href', `/service/${SERVICE_EXTERNAL_ID}/request-to-go-live`)
    })
  })

  describe('worldpay test service', () => {
    beforeEach(() => {
      setupStubs(GatewayAccountType.TEST, GoLiveStage.NOT_STARTED, PaymentProviders.WORLDPAY, CredentialState.ACTIVE)
    })

    it('should display service as not live yet', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/dashboard`)
      cy.get('#service-name').find('.govuk-body').should('contain.text', SERVICE_NAME.en)
      cy.get('#service-name').find('.govuk-tag').should('contain.text', 'Worldpay test')
      cy.get('#service-name').find('.govuk-tag').should('have.class', 'govuk-tag--blue')
      cy.get('#service-name').find('p').should('have.length', 1)
    })
  })
})
