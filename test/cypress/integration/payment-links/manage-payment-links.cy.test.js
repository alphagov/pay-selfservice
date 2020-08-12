const userStubs = require('../../utils/user-stubs')
const gatewayAccountStubs = require('../../utils/gateway-account-stubs')

const productStubs = require('../../utils/products-stubs')
const userExternalId = 'a-user-id'
const gatewayAccountId = 42

const buildPaymentLinkOpts = function buildPaymentLinkOpts (name, href, language) {
  return {
    name: name,
    language: language,
    type: 'ADHOC',
    links: [
      {
        'rel': 'friendly',
        'method': 'GET',
        'href': href
      }
    ]
  }
}

const buildPaymentLinkWithMetadataOpts = function buildPaymentLinkWithMetadataOpts (name, href, language, metadata) {
  return {
    name: name,
    language: language,
    type: 'ADHOC',
    metadata: metadata,
    links: [
      {
        'rel': 'friendly',
        'method': 'GET',
        'href': href
      }
    ]
  }
}

describe('The manage payment links page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)
  })

  describe('No payment links', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
        gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'test', paymentProvider: 'worldpay' }),
        productStubs.getProductsStub([], gatewayAccountId)
      ])
    })

    it('should state that there are no payment links', () => {
      cy.visit('/create-payment-link/manage')

      cy.get('h1').should('contain', 'Manage payment links')
      cy.get('.payment-links-list--header').should('contain',
        'There are no payment links, you can create one now')
      cy.get('.payment-links-list--header > a').should('have.attr', 'href', '/create-payment-link')
    })
  })

  describe('Only English payment links', () => {
    const key = 'key'
    const value = 'metavalue'
    const products = [
      buildPaymentLinkOpts('Pay for a parking permit', 'example.com/my-service/pay-for-a-parking-permit', 'en'),
      buildPaymentLinkWithMetadataOpts('Pay for a firearm', 'example.com/my-service/pay-for-a-firearm', 'en', { key: value })
    ]

    beforeEach(() => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
        gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'test', paymentProvider: 'worldpay' }),
        productStubs.getProductsStub(products, gatewayAccountId)
      ])
    })

    it('should list English payment links and have no Welsh payment links section', () => {
      cy.visit('/create-payment-link/manage')

      cy.get('h1').should('contain', 'Manage payment links')
      cy.get('.payment-links-list--header').should('contain',
        'There are 2 payment links')

      cy.get('ul.payment-links-list').should('have.length', 1)

      cy.get('ul.payment-links-list').find('li').should('have.length', 2)
      cy.get('ul.payment-links-list').find('li').eq(0).within(() => {
        cy.get('h2').contains(products[0].name)
        cy.get('a').contains(products[0].links[0].href)
      })
      cy.get('ul.payment-links-list').find('li').eq(1).within(() => {
        cy.get('h2').contains(products[1].name)
        cy.get('a').contains(products[1].links[0].href)
        cy.get('dt').contains(key)
        cy.get('dd').contains(value)
      })

      cy.contains('Welsh payment links').should('not.exist')
    })
  })

  describe('English and Welsh payment links', () => {
    const products = [
      buildPaymentLinkOpts('Pay for a parking permit', 'example.com/my-service/pay-for-a-parking-permit', 'en'),
      buildPaymentLinkOpts('Pay for a firearm', 'example.com/my-service/pay-for-a-firearm', 'en'),
      buildPaymentLinkOpts('Talu am drwydded barcio', 'example.com/my-service/talu-am-drwydded-barcio', 'cy'),
      buildPaymentLinkOpts('Talu am arf tanio', 'example.com/my-service/talu-am-arf-tanio', 'cy')
    ]

    beforeEach(() => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
        gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'test', paymentProvider: 'worldpay' }),
        productStubs.getProductsStub(products, gatewayAccountId)
      ])
    })

    it('should list English payment links and Welsh payment links separately', () => {
      cy.visit('/create-payment-link/manage')

      cy.get('h1').should('contain', 'Manage payment links')
      cy.get('.payment-links-list--header').should('contain',
        'There are 4 payment links')

      cy.get('ul.payment-links-list').should('have.length', 2)

      cy.get('ul.payment-links-list').eq(0).find('li').should('have.length', 2)
      cy.get('ul.payment-links-list').eq(0).find('li').eq(0).within(() => {
        cy.get('h2').contains(products[0].name)
        cy.get('a').contains(products[0].links[0].href)
      })
      cy.get('ul.payment-links-list').eq(0).find('li').eq(1).within(() => {
        cy.get('h2').contains(products[1].name)
        cy.get('a').contains(products[1].links[0].href)
      })

      cy.get('div#welsh-payment-links').should('exist').within(() => {
        cy.get('h3').contains('Welsh payment links').should('exist')

        cy.get('ul.payment-links-list').find('li').should('have.length', 2)
        cy.get('ul.payment-links-list').find('li').eq(0).within(() => {
          cy.get('h2').contains(products[2].name)
          cy.get('a').contains(products[2].links[0].href)
        })
        cy.get('ul.payment-links-list').find('li').eq(1).within(() => {
          cy.get('h2').contains(products[3].name)
          cy.get('a').contains(products[3].links[0].href)
        })
      })
    })
  })

  describe('Only Welsh payment links', () => {
    const products = [
      buildPaymentLinkOpts('Talu am drwydded barcio', 'example.com/my-service/talu-am-drwydded-barcio', 'cy'),
      buildPaymentLinkOpts('Talu am arf tanio', 'example.com/my-service/talu-am-arf-tanio', 'cy')
    ]

    beforeEach(() => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
        gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'test', paymentProvider: 'worldpay' }),
        productStubs.getProductsStub(products, gatewayAccountId)
      ])
    })

    it('should list Welsh payment links', () => {
      cy.visit('/create-payment-link/manage')

      cy.get('h1').should('contain', 'Manage payment links')
      cy.get('.payment-links-list--header').should('contain',
        'There are 2 payment links')

      cy.get('h3').contains('Welsh payment links').should('exist')
      cy.get('ul.payment-links-list').should('have.length', 1)

      cy.get('div#welsh-payment-links').should('exist').within(() => {
        cy.get('ul.payment-links-list').find('li').should('have.length', 2)
        cy.get('ul.payment-links-list').find('li').eq(0).within(() => {
          cy.get('h2').contains(products[0].name)
          cy.get('a').contains(products[0].links[0].href)
        })
        cy.get('ul.payment-links-list').find('li').eq(1).within(() => {
          cy.get('h2').contains(products[1].name)
          cy.get('a').contains(products[1].links[0].href)
        })
      })
    })
  })

  describe('There was a problem when getting the products', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
        gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'test', paymentProvider: 'worldpay' }),
        productStubs.getProductsByGatewayAccountIdFailure()
      ])
    })

    it('should display an error', () => {
      cy.visit('/create-payment-link/manage', { failOnStatusCode: false })
      cy.get('h1').should('contain', 'An error occurred:')
    })
  })
})
