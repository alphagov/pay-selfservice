const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const { getProductsStub, getProductByExternalIdStub } = require('../../stubs/products-stubs')
const userExternalId = 'a-user-id'
const gatewayAccountId = 42

const buildPaymentLinkOpts = function buildPaymentLinkOpts (externalId, name, language, description, price, referenceEnabled, referenceLabel, referenceHint, metadata = null) {
  return {
    external_id: externalId,
    name: name,
    description: description,
    price: price,
    language: language,
    type: 'ADHOC',
    reference_enabled: referenceEnabled,
    reference_label: referenceLabel,
    reference_hint: referenceHint,
    metadata: metadata
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
    const referenceEnabled = true
    const referenceLabel = 'Licence number'
    const referenceHint = 'You can find this on your licence card'
    const product = buildPaymentLinkOpts(productId, name, 'en', description, 1000, referenceEnabled, referenceLabel, referenceHint,
      { 'Finance team': 'Licensing', 'cost_code': '12345', 'group': 'A' })

    beforeEach(() => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
        gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'test', paymentProvider: 'worldpay' }),
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
      cy.get('#payment-link-summary').find('.govuk-summary-list__row').should('have.length', 4)

      cy.get('#payment-link-summary').find('.govuk-summary-list__row').eq(0).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'Title')
        cy.get('.govuk-summary-list__value').should('contain', name)
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/create-payment-link/manage/edit/information/${productId}?field=payment-link-title`)
      })
      cy.get('#payment-link-summary').find('.govuk-summary-list__row').eq(1).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'More details')
        cy.get('.govuk-summary-list__value').should('contain', description)
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/create-payment-link/manage/edit/information/${productId}?field=payment-link-description`)
      })
      cy.get('#payment-link-summary').find('.govuk-summary-list__row').eq(2).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'Reference number')
        cy.get('.govuk-summary-list__value').should('contain', referenceLabel)
        cy.get('.govuk-summary-list__value').should('contain', referenceHint)
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/create-payment-link/manage/edit/reference/${productId}?change=true`)
      })
      cy.get('#payment-link-summary').find('.govuk-summary-list__row').eq(3).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'Payment amount')
        cy.get('.govuk-summary-list__value').should('contain', '£10.00')
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/create-payment-link/manage/edit/amount/${productId}`)
      })
      cy.get('button').should('exist').should('contain', 'Save changes')
    })

    it('should show reporting columns alphabetically (case-insensitive) with correctly-encoded change links', () => {
      cy.get('#reporting-columns-summary').find('.govuk-summary-list__row').should('have.length', 3)

      cy.get('#reporting-columns-summary').find('.govuk-summary-list__row').eq(0).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'cost_code')
        cy.get('.govuk-summary-list__value').should('contain', '12345')
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/create-payment-link/manage/edit/${productId}/metadata/cost_code`)
      })
      cy.get('#reporting-columns-summary').find('.govuk-summary-list__row').eq(1).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'Finance team')
        cy.get('.govuk-summary-list__value').should('contain', 'Licensing')
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/create-payment-link/manage/edit/${productId}/metadata/Finance%20team`)
      })
      cy.get('#reporting-columns-summary').find('.govuk-summary-list__row').eq(2).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'group')
        cy.get('.govuk-summary-list__value').should('contain', 'A')
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/create-payment-link/manage/edit/${productId}/metadata/group`)
      })
      cy.get('a.govuk-button--secondary').should('exist').should('contain', 'Add another reporting column')
    })

    it('should navigate to edit information page', () => {
      cy.get('.govuk-summary-list__row').eq(0).find('.govuk-summary-list__actions a').click()

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

          cy.get('button').should('exist')
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
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/create-payment-link/manage/edit/${productId}`)
      })
    })

    it('should navigate to edit reference page', () => {
      cy.get('.govuk-summary-list__row').eq(2).find('.govuk-summary-list__actions a').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/create-payment-link/manage/edit/reference/${productId}`)
      })
    })

    it('should have English instructions', () => {
      cy.get(`form[method=post][action="/create-payment-link/manage/edit/reference/${productId}"]`).should('exist')
        .within(() => {
          cy.get('input[type="radio"]').should('have.length', 2)

          cy.get('input#reference-label').should('exist')
          cy.get('input#reference-label').should('have.attr', 'lang', 'en')
          cy.get('label[for="reference-label"]').should('contain', 'Name of payment reference')
          cy.get('input#reference-label').parent('.govuk-form-group').get('span')
            .should('contain', 'For example, “invoice number”')

          cy.get('textarea#reference-hint-text').should('exist')
          cy.get('textarea#reference-hint-text').should('have.attr', 'lang', 'en')
          cy.get('label[for="reference-hint-text"]').should('exist')
          cy.get('label[for="reference-hint-text"]').should('contain', 'Hint text (optional)')
          cy.get('textarea#reference-hint-text').parent('.govuk-form-group').get('span')
            .should('contain', 'Tell users what the payment reference looks like and where they can find it.')

          cy.get('button').should('exist')
        })

      cy.get('#payment-link-example').should('exist').within(() => {
        cy.get('h3').should('contain', 'Example of what the user will see')
        cy.get('img').should('exist')
      })
    })

    it('should have payment link details pre-filled', () => {
      cy.get('input#reference-label').should('have.value', referenceLabel)
      cy.get('textarea#reference-hint-text').should('have.value', referenceHint)
    })

    it('should navigate to edit details page when "Save changes" clicked', () => {
      cy.get(`form[method=post][action="/create-payment-link/manage/edit/reference/${productId}"]`).within(() => {
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/create-payment-link/manage/edit/${productId}`)
      })
    })

    it('should navigate to edit amount page', () => {
      cy.get('.govuk-summary-list__row').eq(3).find('.govuk-summary-list__actions a').click()

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
          cy.get('button').should('exist')
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
        cy.get('button').click()
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
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
        gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'test', paymentProvider: 'worldpay' }),
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
      cy.get('.govuk-summary-list__row').eq(0).find('.govuk-summary-list__actions a').click()

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

          cy.get('button').should('exist')
        })

      cy.get('#payment-link-example').should('not.exist')
    })

    it('should navigate to edit details page when "Save changes" clicked', () => {
      cy.get(`form[method=post][action="/create-payment-link/manage/edit/information/${productId}"]`).within(() => {
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/create-payment-link/manage/edit/${productId}`)
      })
    })

    it('should navigate to edit reference page', () => {
      cy.get('.govuk-summary-list__row').eq(2).find('.govuk-summary-list__actions a').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/create-payment-link/manage/edit/reference/${productId}`)
      })
    })

    it('should have Welsh instructions', () => {
      cy.get(`form[method=post][action="/create-payment-link/manage/edit/reference/${productId}"]`).should('exist')
        .within(() => {
          cy.get('input[type="radio"]').should('have.length', 2)

          cy.get('input#reference-label').should('exist')
          cy.get('input#reference-label').should('have.attr', 'lang', 'cy')
          cy.get('label[for="reference-label"]').should('contain', 'Name of payment reference')
          cy.get('input#reference-label').parent('.govuk-form-group').get('span')
            .should('contain', 'For example, “rhif anfoneb”')

          cy.get('textarea#reference-hint-text').should('exist')
          cy.get('textarea#reference-hint-text').should('have.attr', 'lang', 'cy')
          cy.get('label[for="reference-hint-text"]').should('exist')
          cy.get('label[for="reference-hint-text"]').should('contain', 'Hint text (optional)')
          cy.get('textarea#reference-hint-text').parent('.govuk-form-group').get('span')
            .should('contain', 'Explain in Welsh what the payment reference looks like and where to find it.')

          cy.get('button').should('exist')
        })
    })

    it('should navigate to edit details page when "Save changes" clicked', () => {
      cy.get(`form[method=post][action="/create-payment-link/manage/edit/reference/${productId}"]`).within(() => {
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/create-payment-link/manage/edit/${productId}`)
      })
    })

    it('should navigate to edit amount page', () => {
      cy.get('.govuk-summary-list__row').eq(3).find('.govuk-summary-list__actions a').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/create-payment-link/manage/edit/amount/${productId}`)
      })
    })

    it('should not display example', () => {
      cy.get('#payment-link-example').should('not.exist')
    })
  })
})
