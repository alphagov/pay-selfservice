'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const { getStripeAccountSuccess } = require('../../stubs/stripe-account-stubs')
const { updateAccount, listPersons, updateListPerson } = require('../../stubs/stripe-psp-stubs')
const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e' // pragma: allowlist secret
const gatewayAccountId = '42'
const gatewayAccountExternalId = 'a-valid-external-id'
const credentialExternalId = 'a-credential-external-id'
const stripeAccountId = `acct_123example123`
const serviceName = 'Purchase a positron projection permit'
const accountNumber = '00012345'
const sortCode = '108800'
const standardVatNumber = 'GB999 9999 73'
const validCompanyNumber = '01234567'
const typedFirstName = 'Jane'
const typedLastName = ' Doe'
const typedDobDay = '25 '
const typedDobMonth = ' 02'
const typedDobYear = '1971 '
const typedEmail = 'test@example.com'
const typedHomeAddress = ' 64 Zoo Lane Road'
const typedPostcode = 'W89 1FZ'
const typedPhoneNumber = '+44 0808 157 0192'

function setupYourPspStubs (opts = {}) {
  const user = userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName })

  const gatewayAccountByExternalId = gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
    gatewayAccountId,
    gatewayAccountExternalId,
    requiresAdditionalKycData: false,
    type: 'live',
    paymentProvider: 'stripe',
    gatewayAccountCredentials: [{
      payment_provider: 'stripe',
      credentials: { stripe_account_id: stripeAccountId },
      external_id: credentialExternalId
    }]
  })

  const stripeAccountSetup = stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
    gatewayAccountId,
    bankAccount: opts.bankAccount,
    director: opts.director,
    vatNumber: opts.vatNumber,
    companyNumber: opts.companyNumber,
    responsiblePerson: opts.responsiblePerson,
    organisationDetails: opts.organisationDetails,
    governmentEntityDocument: opts.governmentEntityDocument
  })

  const updateStripeAccountSetupStub = stripeAccountSetupStubs.patchUpdateStripeSetupSuccess(gatewayAccountId)
  const getStripeAccountStub = getStripeAccountSuccess(gatewayAccountId, stripeAccountId)
  const updateStripeAccountStub = updateAccount({ stripeAccountId })
  const getListPersonStub = listPersons({ stripeAccountId })
  const updateListPersonStub = updateListPerson({ stripeAccountId })
  const stubs = [user, gatewayAccountByExternalId, stripeAccountSetup, getStripeAccountStub, updateStripeAccountStub, updateStripeAccountSetupStub, getListPersonStub, updateListPersonStub]

  cy.task('setupStubs', stubs)
}

describe('Your PSP Stripe page', () => {
  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  it('should contain Your PSP - Stripe heading', () => {
    setupYourPspStubs()
    cy.setEncryptedCookies(userExternalId)
    cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
    cy.get('h1').should('contain', 'Information for Stripe')
  })

  it('should display all the required stripe tasks ', () => {
    setupYourPspStubs()
    cy.setEncryptedCookies(userExternalId)
    cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)

    cy.get('span').contains('Bank Details').should('exist')
    cy.get('span').contains('Responsible person').should('exist')
    cy.get('span').contains('Service director').should('exist')
    cy.get('span').contains('VAT registration number').should('exist')
    cy.get('span').contains('Company registration number').should('exist')
    cy.get('span').contains('Confirm your organisation’s name and address match your government entity document').should('exist')
    cy.get('span').contains('Government entity document').should('exist')
  })

  it('should autamatically show government document as cannot start yet and the rest of the tasks as not started', () => {
    setupYourPspStubs()
    cy.setEncryptedCookies(userExternalId)
    cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)

    cy.get('strong[id="task-bank-details-status"]').should('contain', 'not started')
    cy.get('strong[id="task-sro-status"]').should('contain', 'not started')
    cy.get('strong[id="task-director-status"]').should('contain', 'not started')
    cy.get('strong[id="task-vatNumber-status"]').should('contain', 'not started')
    cy.get('strong[id="task-Company-number-status"]').should('contain', 'not started')
    cy.get('strong[id="task-checkorganisation-details-status"]').should('contain', 'not started')
    cy.get('strong[id="task-government-entity-document-status"]').should('contain', 'cannot start yet')
  })

  it('should have all tasks hyperlinked except government entity document', () => {
    setupYourPspStubs()
    cy.setEncryptedCookies(userExternalId)
    cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)

    cy.get('span').contains('Bank Details').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}/bank-details`)
    cy.get('span').contains('Responsible person').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}/responsible-person`)
    cy.get('span').contains('Service director').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}/director`)
    cy.get('span').contains('VAT registration number').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}/vat-number`)
    cy.get('span').contains('Company registration number').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}/company-number`)
    cy.get('span').contains('Confirm your organisation’s name and address match your government entity document').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}/check-organisation-details`)
    cy.get('span').contains('Government entity document').should('not.have.attr', 'href')
  })

  describe('Bank details task', () => {
    it('should click bank details task and redirect to task list when valid bank details is submitted', () => {
      setupYourPspStubs()

      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)

      cy.get('span').contains('Bank Details').click()
      cy.get('h1').should('contain', 'Enter your organisation’s banking details')
      cy.get('input#account-number[name="account-number"]').type(accountNumber)
      cy.get('input#sort-code[name="sort-code"]').type(sortCode)
      cy.get('#bank-details-form > button').click()
      cy.get('h1').should('contain', 'Your payment service provider (PSP) - Stripe')
    })

    it('should have Bank details hyperlink removed when complete and status updated to "COMPLETE" ', () => {
      setupYourPspStubs({
        bankAccount: true
      })

      cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
      cy.get('strong[id="task-bank-details-status"]').should('contain', 'complete')
      cy.get('span').contains('Bank Details').should('not.have.attr', 'href')
    })
  })

  describe('VAT task', () => {
    it('should click VAT number task and redirect back to tasklist when valid VAT number is submitted', () => {
      setupYourPspStubs()

      cy.get('span').contains('VAT registration number').click()
      cy.get('h1').should('contain', 'VAT registration number')
      cy.get('#have-vat-number').click()
      cy.get('#vat-number').type(standardVatNumber)
      cy.get('#vat-number-form > button').click()
      cy.get('h1').should('contain', 'Your payment service provider (PSP) - Stripe')
    })

    it('should have VAT number task hyperlink removed when complete and status updated to "COMPLETE " ', () => {
      setupYourPspStubs({
        vatNumber: true
      })

      cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
      cy.get('span').contains('VAT registration number').should('not.have.attr', 'href')
      cy.get('strong[id="task-vatNumber-status"]').should('contain', 'complete')
    })
  })

  describe('Company number task', () => {
    it('should click company registration task and redirect back to tasklist when valid company number is submitted', () => {
      setupYourPspStubs()

      cy.get('span').contains('Company registration number').click()
      cy.get('h1').should('contain', 'Company registration number')
      cy.get('#company-number-declaration').click()
      cy.get('#company-number').type(validCompanyNumber)
      cy.get('#company-number-form > button').click()
      cy.get('h1').should('contain', 'Your payment service provider (PSP) - Stripe')
    })

    it('should have Company registration number task hyperlink removed when complete and status updated to "COMPLETE " ', () => {
      setupYourPspStubs({
        companyNumber: true
      })

      cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
      cy.get('span').contains('Company registration number').should('not.have.attr', 'href')
      cy.get('strong[id="task-Company-number-status"]').should('contain', 'complete')
    })
  })

  describe('Service director task', () => {
    it('should click on service director task and redirect back to tasklist when valid service director information is submitted', () => {
      setupYourPspStubs()

      cy.get('span').contains('Service director').click()
      cy.get('h1').should('contain', 'Enter a director’s details')
      cy.get('#first-name').type(typedFirstName)
      cy.get('#last-name').type(typedLastName)
      cy.get('#dob-day').type(typedDobDay)
      cy.get('#dob-month').type(typedDobMonth)
      cy.get('#dob-year').type(typedDobYear)
      cy.get('#email').type(typedEmail)
      cy.get('#director-form > button').click()
      cy.get('h1').should('contain', 'Your payment service provider (PSP) - Stripe')
    })

    it('should have Service director task hyperlink removed when complete and status updated to "COMPLETE"', () => {
      setupYourPspStubs({
        director: true
      })

      cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
      cy.get('strong[id="task-director-status"]').should('contain', 'complete')
      cy.get('span').contains('Service director').should('not.have.attr', 'href')
    })
  })

  describe('Responsible person task', () => {
    it('should click Responsible task and redirect back to tasklist when valid responsible information is submitted', () => {
      setupYourPspStubs()

      cy.get('span').contains('Responsible person').click()
      cy.get('h1').should('contain', 'Enter responsible person details')
      cy.get('#first-name').type(typedFirstName)
      cy.get('#last-name').type(typedLastName)
      cy.get('#dob-day').type(typedDobDay)
      cy.get('#dob-month').type(typedDobMonth)
      cy.get('#dob-year').type(typedDobYear)
      cy.get('#email').type(typedEmail)
      cy.get('#home-address-line-1').type(typedHomeAddress)
      cy.get('#home-address-city').type('London')
      cy.get('#home-address-postcode').type(typedPostcode)
      cy.get('#telephone-number').type(typedPhoneNumber)
      cy.get('#responsible-person-form > button').click()
      cy.get('h1').should('contain', 'Your payment service provider (PSP) - Stripe')
    })

    it('should have Responsible person task hyperlink removed when complete and status updated to "COMPLETE" ', () => {
      setupYourPspStubs({
        responsiblePerson: true
      })

      cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
      cy.get('span').contains('Responsible person').should('not.have.attr', 'href')
      cy.get('strong[id="task-sro-status"]').should('contain', 'complete')
    })
  })

  describe('Government entity task', () => {
    it('should have Government entity document hyperlinked  when all other tasks are complete and should click Government entity task and display the correct page', () => {
      setupYourPspStubs({
        bankAccount: true,
        director: true,
        vatNumber: true,
        companyNumber: true,
        responsiblePerson: true,
        organisationDetails: true,
        governmentEntityDocument: false
      })

      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
      cy.get('span').contains('Government entity document').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}/government-entity-document`)
      cy.get('span').contains('Government entity document').click()
      cy.get('h1').contains('Upload a government entity document')
    })
  })
})
