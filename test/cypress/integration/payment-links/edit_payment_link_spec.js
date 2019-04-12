const commonStubs = require('../../utils/common_stubs')
const { getProductsStub, getProductByExternalIdStub } = require('../../utils/products_stubs')
const userExternalId = 'a-user-id'
const gatewayAccountId = 42

const buildPaymentLinkOpts = function buildPaymentLinkOpts (externalId, name, language, description, price) {
  return {
    external_id: externalId,
    name: name,
    description: description,
    price: price,
    language: language,
    type: 'ADHOC'
  }
}

describe('Editing a payment link', () => {
  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  describe('Edit an English payment link', () => {
    const productId = 'product-id'
    const name = 'Pay for a firearm'
    const description = 'a description'
    const product = buildPaymentLinkOpts(productId, name, 'en', description, 1000)

    beforeEach(() => {
      cy.task('setupStubs', [
        commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
        commonStubs.getGatewayAccountStub(gatewayAccountId, 'test', 'worldpay'),
        getProductsStub([product], gatewayAccountId),
        getProductByExternalIdStub(product, gatewayAccountId)
      ])
    })

    it('should navigate to the edit page', () => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/create-payment-link/manage')

      cy.get('ul.payment-links-list > li > div > a').contains('Edit').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/create-payment-link/manage/edit/${productId}`)
      })
    })

    it('should show the details to edit', () => {
      cy.get('dl').find('div').should('have.length', 3)

      cy.get('dl').find('div').eq(0).should('exist').within(() => {
        cy.get('dt').should('contain', 'Title')
        cy.get('dd.cya-answer').should('contain', name)
        cy.get('dd.cya-change > a').should('have.attr', 'href', `/create-payment-link/manage/edit/information/${productId}?field=payment-link-title`)
      })
      cy.get('dl').find('div').eq(1).should('exist').within(() => {
        cy.get('dt').should('contain', 'More details')
        cy.get('dd.cya-answer').should('contain', description)
        cy.get('dd.cya-change > a').should('have.attr', 'href', `/create-payment-link/manage/edit/information/${productId}?field=payment-link-description`)
      })
      cy.get('dl').find('div').eq(2).should('exist').within(() => {
        cy.get('dt').should('contain', 'Payment amount')
        cy.get('dd.cya-answer').should('contain', '£10.00')
        cy.get('dd.cya-change > a').should('have.attr', 'href', `/create-payment-link/manage/edit/amount/${productId}`)
      })

      cy.get('button[type=submit]').should('exist').should('contain', 'Save changes')
    })

    it('should navigate to edit information page', () => {
      cy.get('div.review-title > dd.cya-change > a').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/create-payment-link/manage/edit/information/${productId}`)
      })
    })

    it('should have English instructions', () => {
      cy.get('h1').should('contain', 'Edit payment link information')

      cy.get(`form[method=post][action="/create-payment-link/manage/edit/information/${productId}"]`).should('exist')
        .within(() => {
          cy.get('input#payment-link-title').should('exist')
          cy.get('input#payment-link-title').should('have.attr', 'lang', 'en')
          cy.get('label[for="payment-link-title"]').should('contain', 'Title')
          cy.get('input#payment-link-title').parent('.govuk-form-group').get('span')
            .should('contain', 'For example, “Pay for a parking permit”')

          cy.get('textarea#payment-link-description').should('exist')
          cy.get('textarea#payment-link-description').should('have.attr', 'lang', 'en')
          cy.get('label[for="payment-link-description"]').should('exist')
          cy.get('textarea#payment-link-description').parent('.govuk-form-group').get('span')
            .should('contain', 'Give your users more information.')

          cy.get('div#payment-link-title-confirmation').should('not.exist')

          cy.get('button[type=submit]').should('exist')
        })

      cy.get('#payment-link-example').should('exist').within(() => {
        cy.get('h3').should('contain', 'Example of what the user will see')
        cy.get('img').should('exist')
      })
    })

    it('should have payment link details pre-filled', () => {
      cy.get('input#payment-link-title').should('have.value', name)
      cy.get('textarea#payment-link-description').should('have.value', description)
    })

    it('should navigate to edit details page when "Save changes" clicked', () => {
      cy.get(`form[method=post][action="/create-payment-link/manage/edit/information/${productId}"]`).within(() => {
        cy.get('button[type=submit]').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/create-payment-link/manage/edit/${productId}`)
      })
    })

    it('should navigate to edit amount page', () => {
      cy.get('div.review-amount > dd.cya-change > a').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/create-payment-link/manage/edit/amount/${productId}`)
      })
    })

    it('should display content', () => {
      cy.get(`form[method=post][action="/create-payment-link/manage/edit/amount/${productId}"]`).should('exist')
        .within(() => {
          cy.get('input[type=radio]#amount-type-fixed').should('exist')
          cy.get('input[type=radio]#amount-type-variable').should('exist')
          cy.get('input#payment-amount').should('exist')
          cy.get('button[type=submit]').should('exist')
        })

      cy.get('#payment-link-example').should('exist').within(() => {
        cy.get('h3').should('contain', 'Example of what the user will see')
        cy.get('img').should('exist')
      })
    })

    it('should have amount pre-filled', () => {
      cy.get(`form[method=post][action="/create-payment-link/manage/edit/amount/${productId}"]`).should('exist')
        .within(() => {
          cy.get('input#payment-amount').should('have.value', '10.00')
        })
    })

    it('should navigate to edit details page when "Save changes" clicked', () => {
      cy.get(`form[method=post][action="/create-payment-link/manage/edit/amount/${productId}"]`).within(() => {
        cy.get('button[type=submit]').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/create-payment-link/manage/edit/${productId}`)
      })
    })
  })

  describe('Edit a Welsh payment link', () => {
    const productId = 'product-id'
    const name = 'Talu am drwydded barcio'
    const description = 'Disgrifiad yn Gymraeg'
    const product = buildPaymentLinkOpts(productId, name, 'cy', description, 1000)

    beforeEach(() => {
      cy.task('setupStubs', [
        commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
        commonStubs.getGatewayAccountStub(gatewayAccountId, 'test', 'worldpay'),
        getProductsStub([product], gatewayAccountId),
        getProductByExternalIdStub(product, gatewayAccountId)
      ])
    })

    it('should navigate to the edit page', () => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/create-payment-link/manage')

      cy.get('ul.payment-links-list > li > div > a').contains('Edit').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/create-payment-link/manage/edit/${productId}`)
      })
    })

    it('should navigate to edit information page', () => {
      cy.get('div.review-title > dd.cya-change > a').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/create-payment-link/manage/edit/information/${productId}`)
      })
    })

    it('should have Welsh instructions', () => {
      cy.get('h1').should('contain', 'Edit payment link information')

      cy.get(`form[method=post][action="/create-payment-link/manage/edit/information/${productId}"]`).should('exist')
        .within(() => {
          cy.get('input#payment-link-title').should('exist')
          cy.get('input#payment-link-title').should('have.attr', 'lang', 'cy')
          cy.get('label[for="payment-link-title"]').should('contain', 'Welsh title')
          cy.get('input#payment-link-title').parent('.govuk-form-group').get('span')
            .should('contain', 'For example, “Talu am drwydded barcio”')

          cy.get('textarea#payment-link-description').should('exist')
          cy.get('textarea#payment-link-description').should('have.attr', 'lang', 'cy')
          cy.get('label[for="payment-link-description"]').should('exist')
          cy.get('textarea#payment-link-description').parent('.govuk-form-group').get('span')
            .should('contain', 'Give your users more information in Welsh')

          cy.get('div#payment-link-title-confirmation').should('not.exist')

          cy.get('button[type=submit]').should('exist')
        })

      cy.get('#payment-link-example').should('not.exist')
    })

    it('should navigate to edit details page when "Save changes" clicked', () => {
      cy.get(`form[method=post][action="/create-payment-link/manage/edit/information/${productId}"]`).within(() => {
        cy.get('button[type=submit]').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/create-payment-link/manage/edit/${productId}`)
      })
    })

    it('should navigate to edit amount page', () => {
      cy.get('div.review-amount > dd.cya-change > a').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/create-payment-link/manage/edit/amount/${productId}`)
      })
    })

    it('should not display example', () => {
      cy.get('#payment-link-example').should('not.exist')
    })
  })
})
