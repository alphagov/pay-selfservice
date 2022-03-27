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
        { id: 'qgj1709v8t5mtlhd732otv19b1', payment_instrument: { card_details: { card_brand: 'visa' }}},
        { id: '3sfh76mobld3tc87lc608q667b', payment_instrument: { card_details: { card_brand: 'mastercard' }}},
        { id: 'm0spc7kmbo2ihlg602r9klgiqj', payment_instrument: { card_details: { card_brand: 'amex' }}}
      ] })
    ])

    cy.visit('/test/service/service-id/account/gateway-account-id/agreements')
  })
})
