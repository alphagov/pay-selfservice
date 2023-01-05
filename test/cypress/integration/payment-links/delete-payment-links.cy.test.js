const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const userStubs = require('../../stubs/user-stubs')
const {
  getProductsByGatewayAccountIdAndTypeStub,
  getProductByExternalIdStub,
  deleteProductStub
} = require('../../stubs/products-stubs')
const { deleteTokenByApiTokenSuccess } = require('../../stubs/token-stubs')
const userExternalId = 'a-user-id'
const gatewayAccountExternalId = 'a-valid-account-id'
const gatewayAccountId = 42
const productExternalId = 'a-product-id'
const apiToken = 'an-api-token'

const product = {
  external_id: productExternalId,
  payApiToke: apiToken
}

describe('Should delete payment link', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
      gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
        gatewayAccountId,
        gatewayAccountExternalId,
        type: 'test',
        paymentProvider: 'worldpay'
      }),
      getProductsByGatewayAccountIdAndTypeStub([product], gatewayAccountId, 'ADHOC'),
      getProductByExternalIdStub(product, gatewayAccountId),
      deleteProductStub(product, gatewayAccountId, 1),
      deleteTokenByApiTokenSuccess(gatewayAccountId, apiToken)
    ])
  })

  it('should list a single English payment links and have no Welsh payment links section', () => {
    cy.visit(`/account/${gatewayAccountExternalId}/create-payment-link/manage`)

    cy.get('h1').should('contain', 'Manage payment links')
    cy.get('.payment-links-list--header').should('contain',
      'There is 1 payment link')

    cy.get('ul.payment-links-list').should('have.length', 1)

    cy.get('ul.payment-links-list > li > div > a').contains('Delete').click()
    cy.get('a').contains('Yes, delete this link').click()

    cy.get('h1').should('contain', 'Manage payment links')
    cy.get('.govuk-notification-banner--success').contains('The payment link was successfully deleted')
  })
})
