'use strict'

const commonStubs = require('../../utils/common-stubs')
const userStubs = require('../../utils/user-stubs')
const gatewayAccountStubs = require('../../utils/gateway-account-stubs')

describe('Stripe setup: bank details page', () => {
  const gatewayAccountId = 42
  const userExternalId = 'userExternalId'
  const accountNumber = '00012345'
  const sortCode = '108800'

  describe('Card gateway account', () => {
    const stubGetGatewayAccountStripeSetupSuccess = function stubGetGatewayAccountStripeSetupSuccess (bankAccountCompleted) {
      const stripeSetupStub = {
        name: 'getGatewayAccountStripeSetupSuccess',
        opts: {
          gateway_account_id: gatewayAccountId,
          bank_account: bankAccountCompleted
        }
      }
      return stripeSetupStub
    }

    const stubStripeAccountGet = function stubStripeAccountGet (stripeAccountId) {
      const stripeAccountStub = {
        name: 'getStripeAccountSuccess',
        opts: {
          gateway_account_id: gatewayAccountId,
          stripe_account_id: stripeAccountId
        }
      }
      return stripeAccountStub
    }

    /**
     * When request to /v1/api/accounts/${gateway_account_id}/stripe-setup is made
     * it will use bankAccountCompleted as a response
     * and it will use next bankAccountCompleted value in the response for consecutive API calls
     *
     * @param bankAccountCompleted
     * @returns {{opts: {gateway_account_id: number, data: *}, name: string}}
     */
    const stubStripeSetupGetForMultipleCalls = function stubStripeSetupGetForMultipleCalls (...bankAccountCompleted) {
      const data = bankAccountCompleted.map(completed => (
        {
          bank_account: completed
        }
      ))
      const stripeBankAccountFlagStub = {
        name: 'getGatewayAccountStripeSetupFlagChanged',
        opts: {
          gateway_account_id: gatewayAccountId,
          data: data
        }
      }
      return stripeBankAccountFlagStub
    }

    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
    })

    describe('Bank details page is shown', () => {
      beforeEach(() => {
        cy.task('setupStubs', [
          userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
          gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'stripe' }),
          stubGetGatewayAccountStripeSetupSuccess(false),
          stubStripeAccountGet('acct_123example123')
        ])

        cy.visit('/bank-details')
      })

      it('should display page correctly', () => {
        cy.get('h1').should('contain', 'What are your bank details?')

        cy.get('#bank-details-form').should('exist')
          .within(() => {
            cy.get('input#account-number').should('exist')
            cy.get('input#sort-code').should('exist')
            cy.get('button').should('exist')
            cy.get('button').should('contain', 'Save and continue')
          })
      })

      it('should display an error when all fields are blank', () => {
        cy.get('#bank-details-form > button').click()

        cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Sort code')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#sort-code')
        cy.get('ul.govuk-error-summary__list > li:nth-child(2) > a').should('contain', 'Account number')
        cy.get('ul.govuk-error-summary__list > li:nth-child(2) > a').should('have.attr', 'href', '#account-number')

        cy.get('input#account-number').should('have.class', 'govuk-input--error')
        cy.get('label[for=account-number] > span').should('contain', 'This field cannot be blank')

        cy.get('input#sort-code').should('have.class', 'govuk-input--error')
        cy.get('label[for=sort-code] > span').should('contain', 'This field cannot be blank')
      })

      it('should display an error when account number is invalid', () => {
        cy.get('input#account-number[name="account-number"]').type('abc')
        cy.get('input#sort-code[name="sort-code"]').type(sortCode)

        cy.get('#bank-details-form > button').click()

        cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Account number')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#account-number')

        cy.get('input#account-number').should('have.class', 'govuk-input--error')
        cy.get('label[for=account-number] > span').should('contain', 'Enter a valid account number like 00733445')
      })

      it('should display an error when sort code is invalid', () => {
        cy.get('input#account-number[name="account-number"]').type(accountNumber)
        cy.get('input#sort-code[name="sort-code"]').type('abc')

        cy.get('#bank-details-form > button').click()

        cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Sort code')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#sort-code')

        cy.get('input#sort-code').should('have.class', 'govuk-input--error')
        cy.get('label[for=sort-code] > span').should('contain', 'Enter a valid sort code like 309430')
      })
    })

    describe('Bank account flag already true', () => {
      it('should redirect to Dashboard with an error message when on Bank details page', () => {
        cy.task('setupStubs', [
          userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
          gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'stripe' }),
          stubGetGatewayAccountStripeSetupSuccess(true),
          stubStripeAccountGet('acct_123example123'),
          commonStubs.getDashboardStatisticsStub()
        ])

        cy.visit('/bank-details')

        cy.get('h1').should('contain', 'Dashboard')
        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/`)
        })
        cy.get('.flash-container > .generic-error').should('contain', 'You’ve already provided your bank details.')
        cy.get('.flash-container > .generic-error').should('contain', 'Contact GOV.UK Pay support if you need to update them.')
      })

      it('should redirect to Dashboard with an error message when submitting Bank details page', () => {
        cy.task('setupStubs', [
          userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
          gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'stripe' }),
          stubStripeSetupGetForMultipleCalls(false, true),
          stubStripeAccountGet('acct_123example123'),
          commonStubs.getDashboardStatisticsStub()
        ])

        cy.visit('/bank-details')

        cy.get('input#account-number[name="account-number"]').type(accountNumber)
        cy.get('input#sort-code[name="sort-code"]').type(sortCode)
        cy.get('#bank-details-form > button').click()

        cy.get('h1').should('contain', 'Dashboard')
        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/`)
        })
        cy.get('.flash-container > .generic-error').should('contain', 'You’ve already provided your bank details.')
        cy.get('.flash-container > .generic-error').should('contain', 'Contact GOV.UK Pay support if you need to update them.')
      })
    })

    describe('Not a Stripe gateway account', () => {
      it('should show a 404 error when gateway account is not Stripe', () => {
        cy.task('setupStubs', [
          userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
          gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'sandbox' }),
          stubGetGatewayAccountStripeSetupSuccess(false),
          stubStripeAccountGet('acct_123example123')
        ])

        cy.visit('/bank-details', {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('Not a live gateway account', () => {
      it('should show a 404 error when gateway account is not live', () => {
        cy.task('setupStubs', [
          userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
          gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'test', paymentProvider: 'stripe' }),
          stubGetGatewayAccountStripeSetupSuccess(false),
          stubStripeAccountGet('acct_123example123')
        ])

        cy.visit('/bank-details', {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('User does not have the correct permissions', () => {
      it('should show a permission error when the user does not have enough permissions', () => {
        cy.task('setupStubs', [
          userStubs.getUserWithNoPermissions(userExternalId, gatewayAccountId),
          gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'stripe' })
        ])

        cy.visit('/bank-details', {
          failOnStatusCode: false
        })
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
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId: directDebitGatewayAccountId }),
        gatewayAccountStubs.getDirectDebitGatewayAccountSuccess({ gatewayAccountId: directDebitGatewayAccountId, type: 'live', paymentProvider: 'gocardless' })
      ])

      cy.visit('/bank-details', {
        failOnStatusCode: false
      })

      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'This page is only available to card accounts not direct debit accounts.')
    })
  })
})
