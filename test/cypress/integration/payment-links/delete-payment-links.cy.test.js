const { getUserStub, getGatewayAccountStub } = require('../../utils/common-stubs')
const { getProductsStub, getProductByExternalIdStub, deleteProductStub } = require('../../utils/products-stubs')
const userExternalId = 'a-user-id'
const gatewayAccountId = 42
const productExternalId = 'a-product-id'

const product = {
  external_id: productExternalId
}

describe('Should delete payment link', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)
    cy.task('setupStubs', [
      getUserStub(userExternalId, [gatewayAccountId]),
      getGatewayAccountStub(gatewayAccountId, 'test', 'worldpay'),
      getProductsStub([product], gatewayAccountId),
      getProductByExternalIdStub(product, gatewayAccountId),
      deleteProductStub(product, gatewayAccountId, 1)
    ])
  })

  it('should list a single English payment links and have no Welsh payment links section', () => {
    cy.visit('/create-payment-link/manage')

    cy.get('h1').should('contain', 'Manage payment links')
    cy.get('.payment-links-list--header').should('contain',
      'There is 1 payment link')

    cy.get('ul.payment-links-list').should('have.length', 1)

    cy.get('ul.payment-links-list > li > div > a').contains('Delete').click()
    cy.get('a').contains('Yes, delete this link').click()

    cy.get('h1').should('contain', 'Manage payment links')
    cy.get('div.flash-container > div > h2').contains('The payment link was successfully deleted')
  })
})
