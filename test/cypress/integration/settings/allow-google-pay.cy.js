const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = 42
const gatewayAccountExternalId = 'a-valid-external-id'
const serviceName = 'My Awesome Service'
const credentialId = 1

function getUserAndAccountStubs (allowGooglePay, paymentProvider = 'worldpay') {
  return [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId,
      paymentProvider: paymentProvider,
      allowGooglePay: allowGooglePay,
      gatewayAccountCredentials: [{
        payment_provider: paymentProvider
      }]
    })
  ]
}

describe('Google Pay', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  it('should allow us to enable and requires a gateway merchant ID for a Worldpay account', () => {
    cy.task('setupStubs', [
      ...getUserAndAccountStubs(false),
      gatewayAccountStubs.patchUpdateCredentialsSuccess(gatewayAccountId, credentialId),
      gatewayAccountStubs.patchAccountUpdateGooglePaySuccess(gatewayAccountId, true)
    ])

    cy.visit(`/account/${gatewayAccountExternalId}/settings`)
    cy.get('.govuk-summary-list__value').eq(1).should('contain', 'Off')
    cy.get('a').contains('Change Google Pay settings').click()

    cy.get('input[type="radio"]').should('have.length', 2)
    cy.get('input[value="on"]').should('not.be.checked')
    cy.get('input[value="off"]').should('be.checked')
    cy.get('#merchantId').should('not.be.visible')

    cy.get('p').contains('You’ll need a Google Pay merchant ID').should('exist')

    cy.get('input[value="on"]').click()
    cy.get('input[value="on"]').should('be.checked')

    cy.log('Click save without entering a gateway merchant ID')
    cy.get('.govuk-button').contains('Save changes').click()

    cy.log('Should show an with error message')
    cy.get('[data-cy=error-summary]').find('a').should('have.length', 1)
    cy.get('[data-cy=error-summary]').should('exist').within(() => {
      cy.get('a[href="#merchantId"]').should('contain', 'Enter a valid Merchant ID')
    })

    cy.get('input[value="on"]').should('be.checked')
    cy.get('#merchantId').parent().should('exist').within(() => {
      cy.get('.govuk-error-message').should('contain', 'Enter a valid Merchant ID')
    })

    cy.log('Enter a valid merchant ID and submit')
    cy.get('#merchantId').type('111111111111111')
    cy.get('.govuk-button').contains('Save changes').click()

    cy.location().should((location) => {
      expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/settings`)
    })
    cy.get('.govuk-notification-banner--success').should('contain', 'Google Pay successfully enabled')
  })

  it('should allow us to enable and does not require a gateway merchant ID for a Stripe account', () => {
    cy.task('setupStubs', [
      ...getUserAndAccountStubs(false, 'stripe'),
      stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId }),
      gatewayAccountStubs.patchAccountUpdateGooglePaySuccess(gatewayAccountId, true)
    ])

    cy.visit(`/account/${gatewayAccountExternalId}/settings`)
    cy.get('.govuk-summary-list__value').eq(1).should('contain', 'Off')
    cy.get('a').contains('Change Google Pay settings').click()

    cy.get('input[type="radio"]').should('have.length', 2)
    cy.get('input[value="on"]').should('not.be.checked')
    cy.get('input[value="off"]').should('be.checked')
    cy.get('#merchantId').should('not.exist')

    cy.get('p').contains('You’ll need a Google Pay merchant ID').should('not.exist')

    cy.get('input[value="on"]').click()
    cy.get('input[value="on"]').should('be.checked')

    cy.get('.govuk-button').contains('Save changes').click()

    cy.location().should((location) => {
      expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/settings`)
    })
    cy.get('.govuk-notification-banner--success').should('contain', 'Google Pay successfully enabled')
  })

  it('should allow us to disable', () => {
    cy.task('setupStubs', [
      ...getUserAndAccountStubs(true),
      gatewayAccountStubs.patchAccountUpdateGooglePaySuccess(gatewayAccountId, false)
    ])

    cy.visit(`/account/${gatewayAccountExternalId}/settings`)
    cy.get('.govuk-summary-list__value').eq(1).should('contain', 'On')
    cy.get('a').contains('Change Google Pay settings').click()

    cy.get('input[type="radio"]').should('have.length', 2)
    cy.get('input[value="on"]').should('be.checked')
    cy.get('input[value="off"]').should('not.be.checked')
    cy.get('#merchantId').should('be.visible')

    cy.get('input[value="off"]').click()
    cy.get('input[value="off"]').should('be.checked')
    cy.get('#merchantId').should('not.be.visible')

    cy.get('.govuk-button').contains('Save changes').click()

    cy.location().should((location) => {
      expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/settings`)
    })
    cy.get('.govuk-notification-banner--success').should('contain', 'Google Pay successfully disabled')
  })
})
