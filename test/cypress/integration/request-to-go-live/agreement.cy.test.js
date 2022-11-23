'use strict'

const utils = require('../../utils/request-to-go-live-utils')
const { userExternalId, gatewayAccountId, serviceExternalId } = utils.variables
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const userStubs = require('../../stubs/user-stubs')
const goLiveRequestStubs = require('../../stubs/go-live-request-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const requestToGoLiveAgreementUrl = `/service/${serviceExternalId}/request-to-go-live/agreement`

function getStubsForPageSubmission (chosenPspGoLiveStage, termsAgreedGoLiveStage) {
  return [
    userStubs.getUserSuccessRespondDifferentlySecondTime(userExternalId,
      { gatewayAccountId, serviceExternalId, goLiveStage: chosenPspGoLiveStage, merchantName: 'GDS' },
      { gatewayAccountId, serviceExternalId, goLiveStage: termsAgreedGoLiveStage, merchantName: 'GDS' }
    ),
    gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId }),
    serviceStubs.patchUpdateServiceGoLiveStageSuccess({ serviceExternalId, gatewayAccountId, currentGoLiveStage: termsAgreedGoLiveStage }),
    goLiveRequestStubs.postGovUkPayAgreement({ userExternalId, serviceExternalId })
  ]
}

describe('Request to go live: agreement', () => {
  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  describe('User does not have permission', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
      const serviceRole = utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_STRIPE')
      serviceRole.role = {
        permissions: []
      }
      utils.setupGetUserAndGatewayAccountStubs(serviceRole)
    })

    it('should show an error when the user does not have enough permissions', () => {
      cy.visit(requestToGoLiveAgreementUrl, { failOnStatusCode: false })
      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('The service has the wrong go live stage', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
      utils.setupGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME'))
    })

    it('should redirect to "Request to go live: index" page when in wrong stage', () => {
      cy.visit(requestToGoLiveAgreementUrl)

      cy.get('h1').should('contain', 'Request a live account')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live`)
      })
    })
  })

  describe('Stripe has been chosen as the PSP', () => {
    it('should display "Read and accept our legal terms" page when in CHOSEN_PSP_STRIPE', () => {
      cy.setEncryptedCookies(userExternalId)
      utils.setupGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_STRIPE'))

      cy.visit(requestToGoLiveAgreementUrl)

      cy.get('h1').should('contain', 'Read and accept our legal terms')

      cy.get('fieldset').should('contain', 'These include the legal terms of Stripe, GOV.UK Pay’s payment service provider.')
      cy.get('fieldset').should('contain', 'You must also accept Stripe’s legal terms: Stripe Connected Account Agreement.')
      cy.get('ul.govuk-list>li').eq(0).should('contain', 'Crown body memorandum of understanding')
      cy.get('ul.govuk-list>li').eq(1).should('contain', 'Non-Crown body contract')

      cy.get('#request-to-go-live-current-step').should('exist')
      cy.get('#request-to-go-live-agreement-form').should('exist')

      cy.get('#agreement').should('exist')
      cy.get('#agreement').should('not.be.checked')

      cy.get('#request-to-go-live-agreement-form > button').should('exist')
      cy.get('#request-to-go-live-agreement-form > button').should('contain', 'Continue')
    })

    it('should display an error when checkbox is not checked', () => {
      utils.setupGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_STRIPE'))

      cy.get('#request-to-go-live-agreement-form > button').click()

      cy.get('h2').should('contain', 'There is a problem')
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'You need to accept our legal terms to continue')
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#agreement')

      cy.get('.govuk-form-group--error').should('exist').within(() => {
        cy.get('.govuk-error-message').should('contain', 'You need to accept our legal terms to continue')
      })
    })

    it('should continue to the index page when terms are agreed to', () => {
      cy.task('setupStubs', [
        ...getStubsForPageSubmission('CHOSEN_PSP_STRIPE', 'TERMS_AGREED_STRIPE'),
        goLiveRequestStubs.postStripeAgreementIpAddress({ serviceExternalId })
      ])

      cy.get('#agreement').check()
      cy.get('#request-to-go-live-agreement-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live`)
      })
    })
  })

  describe('Worldpay has been chosen as the PSP', () => {
    it('should display "Read and accept our legal terms" page when in CHOSEN_PSP_WORLDPAY', () => {
      cy.setEncryptedCookies(userExternalId)
      utils.setupGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_WORLDPAY'))

      cy.visit(requestToGoLiveAgreementUrl)

      cy.get('h1').should('contain', 'Read and accept our legal terms')

      cy.get('fieldset').should('not.contain', 'These include the legal terms of Stripe, GOV.UK Pay’s payment service provider.')
      cy.get('fieldset').should('not.contain', 'You must also accept Stripe’s legal terms: Stripe Connected Account Agreement.')
      cy.get('ul.govuk-list>li').eq(0).should('contain', 'Crown body memorandum of understanding')
      cy.get('ul.govuk-list>li').eq(1).should('contain', 'Non-Crown body contract')

      cy.get('#request-to-go-live-current-step').should('exist')
      cy.get('#request-to-go-live-agreement-form').should('exist')

      cy.get('#agreement').should('exist')
      cy.get('#agreement').should('not.be.checked')

      cy.get('#request-to-go-live-agreement-form > button').should('exist')
      cy.get('#request-to-go-live-agreement-form > button').should('contain', 'Continue')
    })

    it('should continue to the index page when terms are agreed to', () => {
      cy.task('setupStubs', getStubsForPageSubmission('CHOSEN_PSP_WORLDPAY', 'TERMS_AGREED_WORLDPAY'))

      cy.get('#agreement').check()
      cy.get('#request-to-go-live-agreement-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live`)
      })
    })
  })

  describe('Government banking PSP - Takes payments over the phone stage has been completed', () => {
    it('should display "Read and accept our legal terms" page when service stage is GOV_BANKING_MOTO_OPTION_COMPLETED', () => {
      cy.setEncryptedCookies(userExternalId)
      utils.setupGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('GOV_BANKING_MOTO_OPTION_COMPLETED'))

      cy.visit(requestToGoLiveAgreementUrl)
      cy.get('fieldset').should('not.contain', 'These include the legal terms of Stripe, GOV.UK Pay’s payment service provider.')
      cy.get('ul.govuk-list>li').eq(0).should('contain', 'Crown body memorandum of understanding')
    })

    it('should continue to the index page when terms are agreed to', () => {
      cy.task('setupStubs', getStubsForPageSubmission('GOV_BANKING_MOTO_OPTION_COMPLETED', 'TERMS_AGREED_GOV_BANKING_WORLDPAY'))

      cy.get('#agreement').check()
      cy.get('#request-to-go-live-agreement-form > button').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live`)
      })
    })
  })

  describe('Adminusers returns an error', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceExternalId, goLiveStage: 'CHOSEN_PSP_STRIPE', merchantName: 'GDS' }),
        gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId }),
        goLiveRequestStubs.postGovUkPayAgreement({ userExternalId, serviceExternalId }),
        utils.patchUpdateGoLiveStageErrorStub('TERMS_AGREED_STRIPE')
      ])
    })

    it('should show "An error occurred: There is a problem with the payments platform"', () => {
      cy.visit(requestToGoLiveAgreementUrl)

      cy.get('#agreement').click()
      cy.get('#request-to-go-live-agreement-form > button').click()

      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#errorMsg').should('contain', 'There is a problem with the payments platform')
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })
})
