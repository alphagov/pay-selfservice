const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const agreementStubs = require('../../stubs/agreement-stubs')

const userExternalId = 'some-user-id'
const gatewayAccountId = 10
const gatewayAccountExternalId = 'gateway-account-id'
const serviceExternalId = 'service-id'

const userAndGatewayAccountStubs = [
  userStubs.getUserSuccess({ userExternalId, serviceExternalId, gatewayAccountId }),
  gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, serviceExternalId })
]

describe('Agreement list page', () => {
  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  it('should correctly display agreements for a given service', () => {
    cy.setEncryptedCookies(userExternalId)

    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      agreementStubs.getLedgerAgreementsSuccess({ service_id: serviceExternalId, live: false, agreements: [
        { external_id: 'a-valid-agreement-id', payment_instrument: false, status: 'CREATED' },
        { external_id: 'qgj1709v8t5mtlhd732otv19b1', payment_instrument: { card_details: { card_brand: 'visa' }}},
        { external_id: '3sfh76mobld3tc87lc608q667b', payment_instrument: { card_details: { card_brand: 'master-card' }}},
        { external_id: 'm0spc7kmbo2ihlg602r9klgiqj', status: 'CANCELLED', payment_instrument: { card_details: { card_brand: 'american-express' }}},
        { external_id: 'a-valid-agreement-id-1', payment_instrument: { card_details: { card_brand: 'visa' }}},
        { external_id: 'a-valid-agreement-id-2', payment_instrument: { card_details: { card_brand: 'visa' }}},
        { external_id: 'a-valid-agreement-id-3', payment_instrument: { card_details: { card_brand: 'visa' }}},
        { external_id: 'a-valid-agreement-id-4', payment_instrument: { card_details: { card_brand: 'visa' }}},
        { external_id: 'a-valid-agreement-id-5', payment_instrument: { card_details: { card_brand: 'visa' }}},
        { external_id: 'a-valid-agreement-id-6', payment_instrument: { card_details: { card_brand: 'visa' }}},
        { external_id: 'a-valid-agreement-id-7', payment_instrument: { card_details: { card_brand: 'visa' }}},
        { external_id: 'a-valid-agreement-id-8', payment_instrument: { card_details: { card_brand: 'visa' }}},
        { external_id: 'a-valid-agreement-id-9', payment_instrument: { card_details: { card_brand: 'visa' }}},
        { external_id: 'a-valid-agreement-id-10', payment_instrument: { card_details: { card_brand: 'visa' }}},
        { external_id: 'a-valid-agreement-id-11', payment_instrument: { card_details: { card_brand: 'visa' }}},
        { external_id: 'a-valid-agreement-id-12', payment_instrument: { card_details: { card_brand: 'visa' }}},
        { external_id: 'a-valid-agreement-id-13', payment_instrument: { card_details: { card_brand: 'visa' }}},
        { external_id: 'a-valid-agreement-id-14', payment_instrument: { card_details: { card_brand: 'visa' }}},
        { external_id: 'a-valid-agreement-id-15', payment_instrument: { card_details: { card_brand: 'visa' }}},
      ] })
    ])

    cy.visit('/test/service/service-id/account/gateway-account-id/agreements')

    cy.get('#navigation-menu-agreements').should('have.length', 1)
  })
})
