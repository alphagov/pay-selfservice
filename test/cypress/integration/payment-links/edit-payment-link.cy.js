const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const {
  getProductsByGatewayAccountIdAndTypeStub,
  getProductByExternalIdAndGatewayAccountIdStub
} = require('../../stubs/products-stubs')
const userExternalId = 'a-user-id'
const gatewayAccountId = 42
const gatewayAccountExternalId = 'a-valid-account-id'
const serviceName = 'A service'

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

function setupStubs (product) {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId,
      type: 'test',
      paymentProvider: 'worldpay'
    }),
    getProductsByGatewayAccountIdAndTypeStub([product], gatewayAccountId, 'ADHOC'),
    getProductByExternalIdAndGatewayAccountIdStub(product, gatewayAccountId)
  ])
}

function assertManagePaymentLinksNavItemBold () {
  cy.get('[data-cy=create-payment-link-nav-item]').should('not.have.class', 'govuk-!-font-weight-bold')
  cy.get('[data-cy=manage-payment-links-nav-item]').should('have.class', 'govuk-!-font-weight-bold')
}

function assertCancelLinkHref () {
  cy.get('[data-cy=cancel-link').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/create-payment-link/manage`)
}

function assertCommonPageElements () {
  assertManagePaymentLinksNavItemBold()
  assertCancelLinkHref()
}

describe('Editing a payment link', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
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
      setupStubs(product)
    })

    it('should show the edit page with the payment link details', () => {
      cy.visit(`/account/${gatewayAccountExternalId}/create-payment-link/manage`)
      cy.percySnapshot()

      assertManagePaymentLinksNavItemBold()

      cy.get('ul.payment-links-list > li > div > a').contains('Edit').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/${productId}`)
      })

      assertCommonPageElements()

      cy.get('#payment-link-summary').find('.govuk-summary-list__row').should('have.length', 4)

      cy.get('#payment-link-summary').find('.govuk-summary-list__row').eq(0).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'Title')
        cy.get('.govuk-summary-list__value').should('contain', name)
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/information/${productId}?field=payment-link-title`)
      })
      cy.get('#payment-link-summary').find('.govuk-summary-list__row').eq(1).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'More details')
        cy.get('.govuk-summary-list__value').should('contain', description)
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/information/${productId}?field=payment-link-description`)
      })
      cy.get('#payment-link-summary').find('.govuk-summary-list__row').eq(2).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'Reference number')
        cy.get('.govuk-summary-list__value').should('contain', referenceLabel)
        cy.get('.govuk-summary-list__value').should('contain', referenceHint)
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/reference/${productId}?change=true`)
      })
      cy.get('#payment-link-summary').find('.govuk-summary-list__row').eq(3).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'Payment amount')
        cy.get('.govuk-summary-list__value').should('contain', '£10.00')
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/amount/${productId}`)
      })
      cy.get('button').should('exist').should('contain', 'Save changes')

      // should show reporting columns alphabetically (case-insensitive) with correctly-encoded change link
      cy.get('#reporting-columns-summary').find('.govuk-summary-list__row').should('have.length', 3)

      cy.get('#reporting-columns-summary').find('.govuk-summary-list__row').eq(0).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'cost_code')
        cy.get('.govuk-summary-list__value').should('contain', '12345')
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/create-payment-link/manage/${productId}/add-reporting-column/cost_code`)
      })
      cy.get('#reporting-columns-summary').find('.govuk-summary-list__row').eq(1).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'Finance team')
        cy.get('.govuk-summary-list__value').should('contain', 'Licensing')
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/create-payment-link/manage/${productId}/add-reporting-column/Finance%20team`)
      })
      cy.get('#reporting-columns-summary').find('.govuk-summary-list__row').eq(2).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'group')
        cy.get('.govuk-summary-list__value').should('contain', 'A')
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/create-payment-link/manage/${productId}/add-reporting-column/group`)
      })
      cy.get('a.govuk-button--secondary').should('exist').should('contain', 'Add another reporting column')
    })

    describe('Edit details', () => {
      beforeEach(() => {
        cy.visit(`/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/${productId}`)
        cy.percySnapshot()
      })

      it('should be able to edit the payment link information', () => {
        cy.get('.govuk-summary-list__row').eq(0).find('.govuk-summary-list__actions a').click()

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/information/${productId}`)
        })

        assertCommonPageElements()

        cy.get('h1').should('contain', 'Edit payment link information')

        cy.get(`form[method=post][action="/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/information/${productId}"]`).should('exist')
          .within(() => {
            cy.get('input#payment-link-title').should('exist')
            cy.get('input#payment-link-title').should('have.attr', 'lang', 'en')
            cy.get('label[for="payment-link-title"]').should('contain', 'Title')
            cy.get('#payment-link-title-hint')
              .should('contain', 'For example, “Pay for a parking permit”')

            cy.get('textarea#payment-link-description').should('exist')
            cy.get('textarea#payment-link-description').should('have.attr', 'lang', 'en')
            cy.get('label[for="payment-link-description"]').should('exist')
            cy.get('#payment-link-description-hint')
              .should('contain', 'Give your users more information.')

            cy.get('div#payment-link-title-confirmation').should('not.exist')

            cy.get('button').should('exist')
          })

        cy.get('#payment-link-example').should('exist').within(() => {
          cy.get('h3').should('contain', 'Example of what the user will see')
          cy.get('img').should('exist')
        })

        cy.get('input#payment-link-title').should('have.value', name)
        cy.get('textarea#payment-link-description').should('have.value', description)

        cy.get(`form[method=post][action="/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/information/${productId}"]`).within(() => {
          cy.get('button').click()
        })

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/${productId}`)
        })
      })

      it('should be able to edit the reference', () => {
        cy.get('.govuk-summary-list__row').eq(2).find('.govuk-summary-list__actions a').click()

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/reference/${productId}`)
        })

        assertCommonPageElements()

        cy.get(`form[method=post][action="/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/reference/${productId}"]`).should('exist')
          .within(() => {
            cy.get('input[type="radio"]').should('have.length', 2)

            cy.get('input#reference-label').should('exist')
            cy.get('input#reference-label').should('have.attr', 'lang', 'en')
            cy.get('label[for="reference-label"]').should('contain', 'Name of payment reference')
            cy.get('#reference-label-hint')
              .should('contain', 'For example, “invoice number”')

            cy.get('textarea#reference-hint-text').should('exist')
            cy.get('textarea#reference-hint-text').should('have.attr', 'lang', 'en')
            cy.get('label[for="reference-hint-text"]').should('exist')
            cy.get('label[for="reference-hint-text"]').should('contain', 'Hint text (optional)')
            cy.get('#reference-hint-text-hint')
              .should('contain', 'Tell users what the payment reference looks like and where they can find it.')

            cy.get('button').should('exist')
          })

        cy.get('#payment-link-example').should('exist').within(() => {
          cy.get('h3').should('contain', 'Example of what the user will see')
          cy.get('img').should('exist')
        })

        cy.get('input#reference-label').should('have.value', referenceLabel)
        cy.get('textarea#reference-hint-text').should('have.value', referenceHint)

        cy.get(`form[method=post][action="/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/reference/${productId}"]`).within(() => {
          cy.get('button').click()
        })

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/${productId}`)
        })
      })

      it('should be able to edit the amount', () => {
        cy.get('.govuk-summary-list__row').eq(3).find('.govuk-summary-list__actions a').click()

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/amount/${productId}`)
        })

        assertCommonPageElements()
        cy.title().should('eq', `Edit your payment link amount - ${serviceName} Worldpay test - GOV.UK Pay`)

        cy.get(`form[method=post]`).should('exist')
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

        cy.get(`form[method=post]`).should('exist')
          .within(() => {
            cy.get('input#payment-amount').should('have.value', '10.00')
          })

        cy.get(`form[method=post]`).within(() => {
          cy.get('button').click()
        })

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/${productId}`)
        })
      })
    })
  })

  describe('Edit a Welsh payment link', () => {
    const productId = 'product-id'
    const name = 'Talu am drwydded barcio'
    const description = 'Disgrifiad yn Gymraeg'
    const product = buildPaymentLinkOpts(productId, name, 'cy', description, 1000)

    beforeEach(() => {
      setupStubs(product)
      cy.visit(`/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/${productId}`)
      cy.percySnapshot()
    })

    it('should show Welsh instructions on the edit information page', () => {
      cy.get('.govuk-summary-list__row').eq(0).find('.govuk-summary-list__actions a').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/information/${productId}`)
      })

      cy.get('h1').should('contain', 'Edit payment link information')

      cy.get(`form[method=post][action="/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/information/${productId}"]`).should('exist')
        .within(() => {
          cy.get('input#payment-link-title').should('exist')
          cy.get('input#payment-link-title').should('have.attr', 'lang', 'cy')
          cy.get('label[for="payment-link-title"]').should('contain', 'Welsh title')
          cy.get('#payment-link-title-hint')
            .should('contain', 'For example, “Talu am drwydded barcio”')

          cy.get('textarea#payment-link-description').should('exist')
          cy.get('textarea#payment-link-description').should('have.attr', 'lang', 'cy')
          cy.get('label[for="payment-link-description"]').should('exist')
          cy.get('#payment-link-description-hint')
            .should('contain', 'Give your users more information in Welsh')

          cy.get('div#payment-link-title-confirmation').should('not.exist')

          cy.get('button').should('exist')
        })

      cy.get('#payment-link-example').should('not.exist')

      cy.get(`form[method=post][action="/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/information/${productId}"]`).within(() => {
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/${productId}`)
      })
    })

    it('should show Welsh instructions on the edit reference page', () => {
      cy.get('.govuk-summary-list__row').eq(2).find('.govuk-summary-list__actions a').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/reference/${productId}`)
      })

      cy.get(`form[method=post][action="/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/reference/${productId}"]`).should('exist')
        .within(() => {
          cy.get('input[type="radio"]').should('have.length', 2)

          cy.get('input#reference-label').should('exist')
          cy.get('input#reference-label').should('have.attr', 'lang', 'cy')
          cy.get('label[for="reference-label"]').should('contain', 'Name of payment reference')
          cy.get('#reference-label-hint')
            .should('contain', 'For example, “rhif anfoneb”')

          cy.get('textarea#reference-hint-text').should('exist')
          cy.get('textarea#reference-hint-text').should('have.attr', 'lang', 'cy')
          cy.get('label[for="reference-hint-text"]').should('exist')
          cy.get('label[for="reference-hint-text"]').should('contain', 'Hint text (optional)')
          cy.get('#reference-hint-text-hint')
            .should('contain', 'Explain in Welsh what the payment reference looks like and where to find it.')

          cy.get('button').should('exist')
        })

      cy.get(`form[method=post][action="/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/reference/${productId}"]`).within(() => {
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/${productId}`)
      })
    })

    it('should not display the example image on the edit amount page', () => {
      cy.get('.govuk-summary-list__row').eq(3).find('.govuk-summary-list__actions a').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/amount/${productId}`)
      })

      cy.get('#payment-link-example').should('not.exist')
    })
  })
})
