'use strict'

const commonStubs = require('../../utils/common-stubs')
const {
  stubGetGatewayAccountStripeSetupSuccess,
  stubStripeAccountGet,
  stubStripeSetupGetForMultipleCallsAndCompanyNumberCompleted,
  stubDashboardStatisticsGet
} = require('./support-stubs')

describe('Stripe setup: company number page', () => {
  const gatewayAccountId = 42
  const userExternalId = 'userExternalId'

  describe('Card gateway account', () => {
    describe('when user is admin, account is Stripe and "company number" is not already submitted', () => {
      beforeEach(() => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe'),
          stubGetGatewayAccountStripeSetupSuccess(gatewayAccountId, { 'companyNumberCompleted': false }),
          stubStripeAccountGet(gatewayAccountId, 'acct_123example123')
        ])

        cy.setEncryptedCookies(userExternalId, gatewayAccountId, {})
        cy.visit('/company-number')
      })

      it('should display page correctly', () => {
        cy.get('h1').should('contain', 'Does your organisation have a company registration number?')

        cy.get('#company-number-form').should('exist')
          .within(() => {
            cy.get('input#company-number-declaration[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').should('be.visible')

            cy.get('input#company-number-declaration-2[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').should('not.be.visible')

            cy.get('button').should('exist')
            cy.get('button').should('contain', 'Save and continue')
          })
      })

      it('should display an error when no options are selected', () => {
        cy.get('#company-number-form > button').click()

        cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Company registration number')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#company-number-declaration')

        cy.get('#company-number-declaration-error').should('contain', 'You must answer this question')
      })

      it('should display an error when company number input is blank and "Yes" option is selected', () => {
        cy.get('#company-number-form').should('exist')
          .within(() => {
            cy.get('input#company-number-declaration[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').type('        ')

            cy.get('button').click()
          })

        cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Company registration number')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#company-number')

        cy.get('input#company-number[name="company-number"]').should('have.class', 'govuk-input--error')
        cy.get('#company-number-error').should('contain', 'This field cannot be blank')
      })

      it('should display an error when company number is invalid and "Yes" option is selected', () => {
        cy.get('#company-number-form').should('exist')
          .within(() => {
            cy.get('input#company-number-declaration[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').type('(╯°□°)╯︵ ┻━┻')

            cy.get('button').click()
          })

        cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Company registration number')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#company-number')

        cy.get('input#company-number[name="company-number"]').should('have.class', 'govuk-input--error')
        cy.get('#company-number-error').should('contain', 'Enter a valid company number')
      })
    })

    describe('when user is admin, account is Stripe and "company number" is already submitted', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      })

      it('should redirect to Dashboard with an error message when displaying the page', () => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe'),
          stubGetGatewayAccountStripeSetupSuccess(gatewayAccountId, { 'companyNumberCompleted': true }),
          stubStripeAccountGet(gatewayAccountId, 'acct_123example123'),
          stubDashboardStatisticsGet()
        ])

        cy.visit('/company-number')

        cy.get('h1').should('contain', 'Dashboard')
        cy.location().should((location) => {
          expect(location.pathname).to.eq('/')
        })
        cy.get('.flash-container > .generic-error').should('contain', 'You’ve already provided your company registration number.')
        cy.get('.flash-container > .generic-error').should('contain', 'Contact GOV.UK Pay support if you need to update it.')
      })

      it('should redirect to Dashboard with an error message when submitting the form', () => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe'),
          stubStripeSetupGetForMultipleCallsAndCompanyNumberCompleted(gatewayAccountId, false, false, true, true),
          stubStripeAccountGet(gatewayAccountId, 'acct_123example123'),
          stubDashboardStatisticsGet()
        ])

        cy.visit('/company-number')

        cy.get('#company-number-form').should('exist')
          .within(() => {
            cy.get('input#company-number-declaration-2[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').should('not.be.visible')

            cy.get('button').click()
          })

        cy.get('h1').should('contain', 'Dashboard')
        cy.location().should((location) => {
          expect(location.pathname).to.eq('/')
        })
        cy.get('.flash-container > .generic-error').should('contain', 'You’ve already provided your company registration number.')
        cy.get('.flash-container > .generic-error').should('contain', 'Contact GOV.UK Pay support if you need to update it.')
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
          stubGetGatewayAccountStripeSetupSuccess(gatewayAccountId, { 'companyNumberCompleted': false }),
          stubStripeAccountGet(gatewayAccountId, 'acct_123example123')
        ])

        cy.visit('/company-number', {
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
          stubGetGatewayAccountStripeSetupSuccess(gatewayAccountId, { 'companyNumberCompleted': false }),
          stubStripeAccountGet(gatewayAccountId, 'acct_123example123')
        ])

        cy.visit('/company-number', {
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

        cy.visit('/company-number', { failOnStatusCode: false })
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

      cy.visit('/company-number', {
        failOnStatusCode: false
      })

      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'This page is only available to card accounts not direct debit accounts.')
    })
  })
})
