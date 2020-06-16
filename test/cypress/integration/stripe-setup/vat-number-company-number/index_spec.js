'use strict'

const commonStubs = require('../../../utils/common_stubs')
const {
  stubGetGatewayAccountStripeSetupSuccess,
  stubStripeAccountGet,
  stubDashboardStatisticsGet
} = require('./support')

describe('Stripe setup: "VAT number / company number" index page', () => {
  const gatewayAccountId = 42
  const userExternalId = 'userExternalId'

  describe('Card gateway account', () => {
    describe('when user is admin, account is Stripe and "VAT number / company number" is not already submitted', () => {
      beforeEach(() => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe'),
          stubGetGatewayAccountStripeSetupSuccess(gatewayAccountId, false),
          stubStripeAccountGet(gatewayAccountId, 'acct_123example123')
        ])
      })

      it('should redirect to /vat-number page when pageData is empty', () => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId, {})

        cy.visit('/vat-number-company-number')

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/vat-number')
        })
      })

      it('should redirect to /company-number page when pageData has vatNumber only', () => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId, {
          stripeSetup: {
            vatNumberData: {
              vatNumber: 'GBGD001'
            }
          }
        })

        cy.visit('/vat-number-company-number')

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/company-number')
        })
      })

      it('should redirect to /check-your-answers page when pageData has vatNumber and companyNumber', () => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId, {
          stripeSetup: {
            vatNumberData: {
              vatNumber: 'GBGD001'
            },
            companyNumberData: {
              companyNumberDeclaration: 'false'
            }
          }
        })

        cy.visit('/vat-number-company-number')

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/check-your-answers')
        })
      })

      it('should redirect to /vat-number page when pageData has companyNumber only (invalid cookie structure)', () => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId, {
          stripeSetup: {
            companyNumberData: {
              companyNumberDeclaration: 'false'
            }
          }
        })

        cy.visit('/vat-number-company-number')

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/vat-number')
        })
      })
    })

    describe('when user is admin, account is Stripe and "VAT number / company number" is already submitted', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      })

      it('should redirect to Dashboard with an error message', () => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe'),
          stubGetGatewayAccountStripeSetupSuccess(gatewayAccountId, true),
          stubStripeAccountGet(gatewayAccountId, 'acct_123example123'),
          stubDashboardStatisticsGet()
        ])

        cy.visit('/vat-number-company-number')

        cy.get('h1').should('contain', 'Dashboard')
        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/`)
        })
        cy.get('.flash-container > .generic-error').should('contain', 'You’ve already provided your VAT number or company registration number.')
        cy.get('.flash-container > .generic-error').should('contain', 'Contact GOV.UK Pay support if you need to update them.')
      })
    })

    describe('when it is not a Stripe gateway account', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      })

      it('should show a 404 error when gateway account is not Stripe', () => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'sandbox'),
          stubGetGatewayAccountStripeSetupSuccess(gatewayAccountId, false),
          stubStripeAccountGet(gatewayAccountId, 'acct_123example123')
        ])

        cy.visit('/vat-number-company-number', {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('when it is not a live gateway account', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      })

      it('should show a 404 error when gateway account is not live', () => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'test', 'stripe'),
          stubGetGatewayAccountStripeSetupSuccess(gatewayAccountId, false),
          stubStripeAccountGet(gatewayAccountId, 'acct_123example123')
        ])

        cy.visit('/vat-number-company-number', {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('when the user does not have the correct permissions', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      })

      it('should show a permission error when the user does not have enough permissions', () => {
        cy.task('setupStubs', [
          commonStubs.getUserWithNoPermissionsStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe')
        ])

        cy.visit('/vat-number-company-number', { failOnStatusCode: false })
        cy.get('h1').should('contain', 'An error occurred:')
        cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
      })
    })
  })

  describe('Direct Debit gateway account', () => {
    const directDebitGatewayAccountId = 'DIRECT_DEBIT:101'

    it('should show an error page', () => {
      cy.setEncryptedCookies(userExternalId, directDebitGatewayAccountId)

      cy.task('setupStubs', [
        commonStubs.getUserStub(userExternalId, [directDebitGatewayAccountId]),
        commonStubs.getDirectDebitGatewayAccountStub(directDebitGatewayAccountId, 'live', 'go-cardless')
      ])

      cy.visit('/vat-number-company-number', {
        failOnStatusCode: false
      })

      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'This page is only available to card accounts not direct debit accounts.')
    })
  })
})
