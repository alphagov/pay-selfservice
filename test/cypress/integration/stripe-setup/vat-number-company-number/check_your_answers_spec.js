'use strict'

const commonStubs = require('../../../utils/common_stubs')
const {
  stubGetGatewayAccountStripeSetupSuccess,
  stubStripeAccountGet,
  stubStripeSetupGetForMultipleCalls,
  stubDashboardStatisticsGet
} = require('./support')

describe('Stripe setup: "VAT number / company number - check your answers" page', () => {
  const gatewayAccountId = 42
  const userExternalId = 'userExternalId'
  const validVatNumber = 'GB999 9999 73'
  const validCompanyNumber = '01234567'

  describe('Card gateway account', () => {
    describe('when user is admin, account is Stripe and "VAT number / company number" is not already submitted', () => {
      beforeEach(() => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe'),
          stubGetGatewayAccountStripeSetupSuccess(gatewayAccountId, false),
          stubStripeAccountGet(gatewayAccountId, 'acct_123example123')
        ])

        cy.setEncryptedCookies(userExternalId, gatewayAccountId, {})
      })

      it('should display page correctly with company number populated', () => {
        cy.visit('/vat-number-company-number/vat-number')
        cy.get('#vat-number-form').should('exist')
          .within(() => {
            cy.get('input#vat-number[name="vat-number"]').type(validVatNumber)

            cy.get('button').click()
          })

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/company-number')
        })
        cy.get('#company-number-form').should('exist')
          .within(() => {
            cy.get('input#company-number-declaration[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').type(validCompanyNumber)

            cy.get('button').click()
          })

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/check-your-answers')
        })
        cy.get('dl.govuk-summary-list > div.govuk-summary-list__row:nth-child(1) > dd.govuk-summary-list__value')
          .should('contain', validVatNumber)
        cy.get('dl.govuk-summary-list > div.govuk-summary-list__row:nth-child(2) > dd.govuk-summary-list__value')
          .should('contain', validCompanyNumber)
      })

      it('should display page correctly with company number not populated', () => {
        cy.visit('/vat-number-company-number/vat-number')
        cy.get('#vat-number-form').should('exist')
          .within(() => {
            cy.get('input#vat-number[name="vat-number"]').type(validVatNumber)

            cy.get('button').click()
          })

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/company-number')
        })
        cy.get('#company-number-form').should('exist')
          .within(() => {
            cy.get('input#company-number-declaration-2[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').should('not.be.visible')

            cy.get('button').click()
          })

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/check-your-answers')
        })
        cy.get('dl.govuk-summary-list > div.govuk-summary-list__row:nth-child(1) > dd.govuk-summary-list__value')
          .should('contain', validVatNumber)
        cy.get('dl.govuk-summary-list > div.govuk-summary-list__row:nth-child(2) > dd.govuk-summary-list__value')
          .should('contain', 'None')
      })

      it('should go to VAT number page when VAT number "change" button is clicked and change the value', () => {
        const newVatNumber = 'GBGD001'

        cy.visit('/vat-number-company-number/vat-number')
        cy.get('#vat-number-form').should('exist')
          .within(() => {
            cy.get('input#vat-number[name="vat-number"]').type(validVatNumber)

            cy.get('button').click()
          })

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/company-number')
        })
        cy.get('#company-number-form').should('exist')
          .within(() => {
            cy.get('input#company-number-declaration[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').type(validCompanyNumber)

            cy.get('button').click()
          })

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/check-your-answers')
        })
        cy.get('dl.govuk-summary-list > div.govuk-summary-list__row:nth-child(1) > dd.govuk-summary-list__actions > a').click()

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/vat-number')
        })
        cy.get('#vat-number-form').should('exist')
          .within(() => {
            cy.get('input#vat-number[name="vat-number"]').should('have.value', validVatNumber)
            cy.get('button').should('exist')
            cy.get('button').should('contain', 'Continue')

            cy.get('input#vat-number[name="vat-number"]').clear()
            cy.get('input#vat-number[name="vat-number"]').type(newVatNumber)
            cy.get('button').click()
          })

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/check-your-answers')
        })
        cy.get('dl.govuk-summary-list > div.govuk-summary-list__row:nth-child(1) > dd.govuk-summary-list__value')
          .should('contain', newVatNumber)
      })

      it('should go to company number page when company number "change" button is clicked and change tbe value', () => {
        const newCompanyNumber = 'OC123456'

        cy.visit('/vat-number-company-number/vat-number')
        cy.get('#vat-number-form').should('exist')
          .within(() => {
            cy.get('input#vat-number[name="vat-number"]').type(validVatNumber)

            cy.get('button').click()
          })

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/company-number')
        })
        cy.get('#company-number-form').should('exist')
          .within(() => {
            cy.get('input#company-number-declaration[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').type(validCompanyNumber)

            cy.get('button').click()
          })

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/check-your-answers')
        })
        cy.get('dl.govuk-summary-list > div.govuk-summary-list__row:nth-child(2) > dd.govuk-summary-list__actions > a').click()

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/company-number')
        })
        cy.get('#company-number-form').should('exist')
          .within(() => {
            cy.get('input#company-number-declaration[name="company-number-declaration"]').should('be.checked')
            cy.get('input#company-number[name="company-number"]').should('have.value', validCompanyNumber)
            cy.get('button').should('exist')
            cy.get('button').should('contain', 'Continue')

            cy.get('input#company-number[name="company-number"]').clear()
            cy.get('input#company-number[name="company-number"]').type(newCompanyNumber)
            cy.get('button').click()
          })

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/check-your-answers')
        })
        cy.get('dl.govuk-summary-list > div.govuk-summary-list__row:nth-child(2) > dd.govuk-summary-list__value')
          .should('contain', newCompanyNumber)
      })
    })

    describe('when user is admin, account is Stripe and "VAT number / company number" is already submitted', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      })

      it('should redirect to Dashboard with an error message when displaying the page', () => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe'),
          stubGetGatewayAccountStripeSetupSuccess(gatewayAccountId, true),
          stubStripeAccountGet(gatewayAccountId, 'acct_123example123'),
          stubDashboardStatisticsGet()
        ])

        cy.visit('/vat-number-company-number/check-your-answers')

        cy.get('h1').should('contain', 'Dashboard')
        cy.location().should((location) => {
          expect(location.pathname).to.eq('/')
        })
        cy.get('.flash-container > .generic-error').should('contain', 'You’ve already provided your VAT number or company registration number.')
        cy.get('.flash-container > .generic-error').should('contain', 'Contact GOV.UK Pay support if you need to update them.')
      })

      it('should redirect to Dashboard with an error message when submitting the form', () => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe'),
          stubStripeSetupGetForMultipleCalls(gatewayAccountId, false, false, false, false, false, true),
          stubStripeAccountGet(gatewayAccountId, 'acct_123example123'),
          stubDashboardStatisticsGet()
        ])

        cy.visit('/vat-number-company-number/vat-number')
        cy.get('#vat-number-form').should('exist')
          .within(() => {
            cy.get('input#vat-number[name="vat-number"]').type(validVatNumber)

            cy.get('button').click()
          })

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/company-number')
        })
        cy.get('#company-number-form').should('exist')
          .within(() => {
            cy.get('input#company-number-declaration[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').type(validCompanyNumber)

            cy.get('button').click()
          })

        cy.location().should((location) => {
          expect(location.pathname).to.eq('/vat-number-company-number/check-your-answers')
        })
        cy.get('#vat-number-company-number-check-submit-form > button').click()
        cy.get('h1').should('contain', 'Dashboard')
        cy.location().should((location) => {
          expect(location.pathname).to.eq('/')
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

        cy.visit('/vat-number-company-number/check-your-answers', {
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

        cy.visit('/vat-number-company-number/check-your-answers', {
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

        cy.visit('/vat-number-company-number/check-your-answers', { failOnStatusCode: false })
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

      cy.visit('/vat-number-company-number/check-your-answers', {
        failOnStatusCode: false
      })

      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'This page is only available to card accounts not direct debit accounts.')
    })
  })
})
