'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionSummaryStubs = require('../../stubs/transaction-summary-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripeAccountStubs = require('../../stubs/stripe-account-stubs')

const gatewayAccountId = '42'
const userExternalId = 'userExternalId'
const gatewayAccountExternalId = 'a-valid-external-id'
const gatewayAccountCredentialExternalId = 'a-valid-credential-external-id'
const checkOrgDetailsUrl = `/account/${gatewayAccountExternalId}/your-psp/${gatewayAccountCredentialExternalId}/check-organisation-details`
const pageUrl = `/account/${gatewayAccountExternalId}/your-psp/${gatewayAccountCredentialExternalId}/update-organisation-details`

function setupStubs (organisationDetails, type = 'live', paymentProvider = 'stripe') {
  let stripeSetupStub

  if (Array.isArray(organisationDetails)) {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupFlagForMultipleCalls({
      gatewayAccountId,
      organisationDetails: organisationDetails
    })
  } else {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
      gatewayAccountId,
      organisationDetails
    })
  }

  const gatewayAccountCredentials = [{
    gateway_account_id: gatewayAccountId,
    payment_provider: paymentProvider,
    external_id: gatewayAccountCredentialExternalId
  }]

  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId: gatewayAccountExternalId,
      type,
      paymentProvider,
      gatewayAccountCredentials
    }),
    stripeSetupStub,
    stripeAccountStubs.getStripeAccountSuccess(gatewayAccountId, 'acct_123example123'),
    transactionSummaryStubs.getDashboardStatistics()
  ])
}

describe('The organisation address page', () => {
  const validOrgName = 'An organisation name'
  const validLine1 = 'A building'
  const validLine2 = 'A street'
  const validCity = 'A city'
  const countryGb = 'GB'
  const invalidPostcode = '123'

  describe('Stripe setup and there are no existing merchant details', () => {
    beforeEach(() => {
      // keep the same session for entire describe block
      Cypress.Cookies.preserveOnce('session', 'gateway_account')
    })

    describe('Form validation', () => {
      beforeEach(() => {
        setupStubs(false)
      })

      it('should display form', () => {
        cy.setEncryptedCookies(userExternalId)
        cy.visit(pageUrl)

        cy.get('h1').should('contain', `What is the name and address of you organisation on your government identity document?`)

        cy.get('[data-cy=form]')
          .should('exist')
          .within(() => {
            cy.get('[data-cy=label-org-name]').should('exist')
            cy.get('[data-cy=input-org-name]').should('exist')

            cy.get('[data-cy=label-address-line-1]').should('exist')
            cy.get('[data-cy=input-address-line-1]').should('exist')
            cy.get('[data-cy=input-address-line-2]').should('exist')

            cy.get('[data-cy=label-address-city]').should('exist')
            cy.get('[data-cy=input-address-city]').should('exist')

            cy.get('[data-cy=label-address-country]').should('exist')
            cy.get('[data-cy=input-address-country]').should('exist')

            cy.get('[data-cy=label-address-postcode]').should('exist')
            cy.get('[data-cy=input-address-postcode]').should('exist')

            cy.get('[data-cy=continue-button]').should('exist')
            cy.get('[data-cy=save-button]').should('not.exist')
          })
      })

      it('should display the account sub nav', () => {
        cy.get('[data-cy=account-sub-nav]')
          .should('exist')
      })

      it('should not display the telephone or url fields', () => {
        cy.get('[data-cy=form]')
          .should('exist')
          .within(() => {
            cy.get('[data-cy=label-telephone-number]').should('not.exist')
            cy.get('[data-cy=hint-telephone-number]').should('not.exist')
            cy.get('[data-cy=input-telephone-number]').should('not.exist')

            cy.get('[data-cy=label-url]').should('not.exist')
            cy.get('[data-cy=hint-url]').should('not.exist')
            cy.get('[data-cy=input-url]').should('not.exist')
          })
      })

      it('should display errors when validation fails', () => {
        cy.get('[data-cy=form]')
          .within(() => {
            // create errors by leaving fields blank or inputting invalid values
            cy.get('[data-cy=input-address-postcode]').type(invalidPostcode)

            cy.get('[data-cy=continue-button]').click()
          })

        cy.get('[data-cy=error-summary]').find('a').should('have.length', 4)
        cy.get('[data-cy=error-summary]').should('exist').within(() => {
          cy.get('a[href="#address-line1"]').should('contain', 'Enter a building and street')
          cy.get('a[href="#address-city"]').should('contain', 'Enter a town or city')
          cy.get('a[href="#address-postcode"]').should('contain', 'Enter a real postcode')
        })

        cy.get(`form[method=post]`)
          .within(() => {
            cy.get('[data-cy=input-address-line-1]').parent().should('exist').within(() => {
              cy.get('.govuk-error-message').should('contain', 'Enter a building and street')
            })
            cy.get('[data-cy=input-address-city]').parent().should('exist').within(() => {
              cy.get('.govuk-error-message').should('contain', 'Enter a town or city')
            })
            cy.get('[data-cy=input-address-postcode]').parent().should('exist').within(() => {
              cy.get('.govuk-error-message').should('contain', 'Enter a real postcode')
            })
          })
      })

      it('should keep entered responses when validation fails', () => {
        cy.get('[data-cy=form]')
          .within(() => {
            // fill in the rest of the form fields
            cy.get('[data-cy=input-org-name]').type(validOrgName)
            cy.get('[data-cy=input-address-line-1]').type(validLine1)
            cy.get('[data-cy=input-address-line-2]').type(validLine2)
            cy.get('[data-cy=input-address-city]').type(validCity)
            cy.get('[data-cy=input-address-country]').select(countryGb)
            cy.get('[data-cy=continue-button]').click()
          })

        cy.get('[data-cy=error-summary]').find('a').should('have.length', 1)
        cy.get('[data-cy=error-summary]').should('exist').within(() => {
          cy.get('a').should('contain', 'Enter a real postcode')
        })

        cy.get('[data-cy=form]')
          .within(() => {
            cy.get('#address-line1').should('have.value', validLine1)
            cy.get('#address-line2').should('have.value', validLine2)
            cy.get('#address-city').should('have.value', validCity)
            cy.get('#address-country').should('have.value', countryGb)
            cy.get('#address-postcode').should('have.value', invalidPostcode)
          })
      })
    })

    describe('when it is not a Stripe gateway account', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId)
      })

      it('should show a 404 error when gateway account is not Stripe', () => {
        setupStubs(false, 'live', 'sandbox')

        cy.visit(pageUrl, {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('when it is not a live gateway account', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId)
      })

      it('should show a 404 error when gateway account is not live', () => {
        setupStubs(false, 'test', 'stripe')

        cy.visit(checkOrgDetailsUrl, {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('when the user does not have the correct permissions', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId)
      })

      it('should show a permission error when the user does not have enough permissions', () => {
        cy.task('setupStubs', [
          userStubs.getUserWithNoPermissions(userExternalId, gatewayAccountId),
          gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
            gatewayAccountId,
            gatewayAccountExternalId: gatewayAccountExternalId,
            type: 'live',
            paymentProvider: 'stripe'
          }),
          stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, vatNumber: true })
        ])

        cy.visit(checkOrgDetailsUrl, { failOnStatusCode: false })
        cy.get('h1').should('contain', 'An error occurred')
        cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
      })
    })
  })
})
