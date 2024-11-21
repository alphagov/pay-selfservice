const userStubs = require('@cypress-stubs/user-stubs')
const gatewayAccountStubs = require('@cypress-stubs/gateway-account-stubs')
const tokenStubs = require('@cypress-stubs/token-stubs')
const productStubs = require('@cypress-stubs/products-stubs')
const userExternalId = 'a-user-id'
const gatewayAccountId = 42
const gatewayAccountExternalId = 'a-valid-account-id'
const serviceExternalId = 'a-valid-service-id'
const serviceName = {
  en: 'pay for something',
  cy: 'talu am rywbeth'
}
const productName = 'Test'
const amountHint = 'A hint'
const token = 'a-token'

describe('A payment link with an amount hint set', () => {
  describe('Creating a new payment link', () => {
    it('should display the amount hint field and show on the review page', () => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceExternalId, serviceName }),
        gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, type: 'test', paymentProvider: 'worldpay' }),
        tokenStubs.postCreateTokenForAccountSuccess({ gatewayAccountId, token }),
        productStubs.postCreateProductSuccessWithRequestBody({
          gatewayAccountId,
          payApiToken: token,
          name: productName,
          type: 'ADHOC',
          service_name_path: 'pay-for-something',
          product_name_path: 'test',
          amount_hint: amountHint
        }),
        productStubs.getProductsByGatewayAccountIdAndTypeStub([{ name: productName }], gatewayAccountId, 'ADHOC')
      ])

      cy.setEncryptedCookies(userExternalId)

      cy.visit(`/account/${gatewayAccountExternalId}/create-payment-link`)
      cy.get('a#create-payment-link').click()

      // complete the pages before the amount page with basic info
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/information`)
      })
      cy.get('input#payment-link-title').type(productName)
      cy.get('button').contains('Continue').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/reference`)
      })
      cy.get('input[type=radio]#reference-type-standard').click()
      cy.get('button').contains('Continue').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/amount`)
      })
      cy.get('input[type=radio]#amount-type-variable').click()
      cy.get('textarea#amount-hint-text')
        .should('exist')
        .should('be.visible')
        .type(amountHint)
      cy.get('button').contains('Continue').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/review`)
      })
      cy.get('.govuk-summary-list').find('.govuk-summary-list__row').eq(3).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'Payment amount')
        cy.get('.govuk-summary-list__value').should('contain', 'User can choose')
        cy.get('.govuk-summary-list__value').get('span').should('contain', amountHint)
      })

      cy.get('.govuk-summary-list__row').eq(3).find('.govuk-summary-list__actions a').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/amount`)
      })

      cy.get('textarea#amount-hint-text')
        .should('be.visible')
        .should('have.value', amountHint)

      cy.get('button').contains('Continue').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/review`)
      })

      cy.get('button').contains('Create payment link').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/manage`)
      })
    })
  })

  describe('Editing a payment link', () => {
    const productId = 'a-product-id'
    const product = {
      external_id: productId,
      name: productName,
      price: null,
      type: 'ADHOC',
      reference_enabled: false,
      amount_hint: amountHint
    }
    const updatedHint = 'New hint'

    it('should display the amount hint field and show on the review page and allow editing', () => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName }),
        gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, type: 'test', paymentProvider: 'worldpay' }),
        productStubs.getProductsByGatewayAccountIdAndTypeStub([product], gatewayAccountId, 'ADHOC'),
        productStubs.getProductByExternalIdAndGatewayAccountIdStub(product, gatewayAccountId),
        productStubs.patchUpdateProductSuccess({
          gatewayAccountId,
          productExternalId: productId,
          name: productName,
          reference_enabled: false,
          price: '',
          amount_hint: updatedHint
        })
      ])

      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/${productId}`)

      cy.get('#payment-link-summary').find('.govuk-summary-list__row').eq(3).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'Payment amount')
        cy.get('.govuk-summary-list__value').should('contain', 'User can choose')
        cy.get('.govuk-summary-list__value').get('span').should('contain', amountHint)
      })

      cy.get('.govuk-summary-list__row').eq(3).find('.govuk-summary-list__actions a').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/manage/edit/amount/${productId}`)
      })

      cy.get('textarea#amount-hint-text')
        .should('be.visible')
        .should('have.value', amountHint)
        .clear()
        .type(updatedHint)

      cy.get('button').contains('Continue').click()
      cy.get('#payment-link-summary').find('.govuk-summary-list__row').eq(3).should('exist').within(() => {
        cy.get('.govuk-summary-list__value').get('span').should('contain', updatedHint)
      })

      cy.get('button').contains('Save changes').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/manage`)
      })
    })
  })
})
