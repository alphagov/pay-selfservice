'use strict'

const lodash = require('lodash')
const utils = require('../../utils/request_to_go_live_utils')
const { userExternalId, gatewayAccountId, serviceExternalId } = utils.variables

describe('Request to go live: agreement', () => {
  const stubGovUkPayAgreement = {
    name: 'postGovUkPayAgreement',
    opts: {
      external_id: serviceExternalId,
      user_external_id: userExternalId,
      email: 'someone@example.org',
      agreementTime: '2019-02-13T11:11:16.878Z'
    }
  }

  const stubStripeAgreement = {
    name: 'postStripeAgreementIpAddress',
    opts: {
      external_id: serviceExternalId,
      ip_address: '93.184.216.34'
    }
  }

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)
  })

  describe('NO PERMISSIONS', () => {
    beforeEach(() => {
      const serviceRole = utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_STRIPE')
      serviceRole.role = {
        permissions: []
      }
      utils.setupGetUserAndGatewayAccountStubs(serviceRole)
    })

    it('should show an error when the user does not have enough permissions', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/agreement`
      cy.visit(requestToGoLivePageOrganisationNameUrl, { failOnStatusCode: false })
      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_WRONG_STAGE', () => {
    beforeEach(() => {
      utils.setupGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME'))
    })

    it('should redirect to "Request to go live: index" page when in wrong stage', () => {
      const requestToGoLiveAgreementUrl = `/service/${serviceExternalId}/request-to-go-live/agreement`
      cy.visit(requestToGoLiveAgreementUrl)

      cy.get('h1').should('contain', 'Request a live account')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live`)
      })
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_NOT_STARTED_STAGE', () => {
    beforeEach(() => {
      utils.setupGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('NOT_STARTED'))
    })

    it('should redirect to "Request to go live: index" page when in not started stage', () => {
      const requestToGoLiveAgreementUrl = `/service/${serviceExternalId}/request-to-go-live/agreement`
      cy.visit(requestToGoLiveAgreementUrl)

      cy.get('h1').should('contain', 'Request a live account')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live`)
      })
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_STRIPE', () => {
    const repeatGetUserSuccessStub = [{
      name: 'getUserSuccessRepeatFirstResponseNTimes',
      opts: [{
        external_id: userExternalId,
        service_roles: [utils.buildServiceRoleForGoLiveStageWithMerchantName('CHOSEN_PSP_STRIPE')],
        repeat: 2
      }, {
        external_id: userExternalId,
        service_roles: [utils.buildServiceRoleForGoLiveStageWithMerchantName('TERMS_AGREED_STRIPE')],
        repeat: 2
      }]
    }, {
      name: 'getGatewayAccountSuccess',
      opts: { gateway_account_id: gatewayAccountId }
    }]

    const stubPayload = lodash.concat(repeatGetUserSuccessStub,
      utils.patchUpdateGoLiveStageSuccessStub('TERMS_AGREED_STRIPE'),
      stubGovUkPayAgreement,
      stubStripeAgreement)
    beforeEach(() => {
      cy.task('setupStubs', stubPayload)
    })

    it('should display "Read and accept our legal terms" page when in CHOSEN_PSP_STRIPE', () => {
      const requestToGoLiveAgreementUrl = `/service/${serviceExternalId}/request-to-go-live/agreement`
      cy.visit(requestToGoLiveAgreementUrl)

      cy.get('h1').should('contain', 'Read and accept our legal terms')

      cy.get('fieldset').should('contain', 'These include the legal terms of Stripe, GOV.UK Pay’s payment service provider.')
      cy.get('fieldset').should('contain', 'You must also accept Stripe’s legal terms. Download the Stripe Connected Account Agreement.')
      cy.get('ul.govuk-list>li').eq(0).should('contain', 'Crown body the memorandum of understanding applies')
      cy.get('ul.govuk-list>li').eq(1).should('contain', 'non-Crown body the contract applies')

      cy.get('#request-to-go-live-current-step').should('exist')
      cy.get('#request-to-go-live-agreement-form').should('exist')

      cy.get('#agreement').should('exist')
      cy.get('#agreement').should('not.be.checked')

      cy.get('#request-to-go-live-agreement-form > button').should('exist')
      cy.get('#request-to-go-live-agreement-form > button').should('contain', 'Continue')

      cy.get('#agreement').check()
      cy.get('#request-to-go-live-agreement-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live`)
      })
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_WORLDPAY', () => {
    const repeatGetUserSuccessStub = [{
      name: 'getUserSuccessRepeatFirstResponseNTimes',
      opts: [{
        external_id: userExternalId,
        service_roles: [utils.buildServiceRoleForGoLiveStageWithMerchantName('CHOSEN_PSP_WORLDPAY')],
        repeat: 2
      }, {
        external_id: userExternalId,
        service_roles: [utils.buildServiceRoleForGoLiveStageWithMerchantName('TERMS_AGREED_WORLDPAY')],
        repeat: 2
      }]
    }, {
      name: 'getGatewayAccountSuccess',
      opts: { gateway_account_id: gatewayAccountId }
    }]

    const stubPayload = lodash.concat(repeatGetUserSuccessStub,
      utils.patchUpdateGoLiveStageSuccessStub('TERMS_AGREED_WORLDPAY'), stubGovUkPayAgreement)

    beforeEach(() => {
      cy.task('setupStubs', stubPayload)
    })

    it('should display "Read and accept our legal terms" page when in CHOSEN_PSP_WORLDPAY', () => {
      const requestToGoLiveAgreementUrl = `/service/${serviceExternalId}/request-to-go-live/agreement`
      cy.visit(requestToGoLiveAgreementUrl)

      cy.get('h1').should('contain', 'Read and accept our legal terms')

      cy.get('fieldset').should('not.contain', 'These include the legal terms of Stripe, GOV.UK Pay’s payment service provider.')
      cy.get('fieldset').should('not.contain', 'You must also accept Stripe’s legal terms. Download the Stripe Connected Account agreement.')
      cy.get('ul.govuk-list>li').eq(0).should('contain', 'Crown body the memorandum of understanding applies')
      cy.get('ul.govuk-list>li').eq(1).should('contain', 'non-Crown body the contract applies')

      cy.get('#request-to-go-live-current-step').should('exist')
      cy.get('#request-to-go-live-agreement-form').should('exist')

      cy.get('#agreement').should('exist')
      cy.get('#agreement').should('not.be.checked')

      cy.get('#request-to-go-live-agreement-form > button').should('exist')
      cy.get('#request-to-go-live-agreement-form > button').should('contain', 'Continue')

      cy.get('#agreement').check()
      cy.get('#request-to-go-live-agreement-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live`)
      })
    })
  })

  describe('adminusers error handlings', () => {
    const stubPayload = lodash.concat(utils.getUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStageWithMerchantName('CHOSEN_PSP_STRIPE')),
      stubGovUkPayAgreement,
      utils.patchUpdateGoLiveStageErrorStub('TERMS_AGREED_STRIPE'))
    beforeEach(() => {
      cy.task('setupStubs', stubPayload)
    })
    it('should show "An error occurred: There is a problem with the payments platform"', () => {
      const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${serviceExternalId}/request-to-go-live/agreement`
      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      cy.get('#agreement').click()
      cy.get('#request-to-go-live-agreement-form > button').click()

      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'There is a problem with the payments platform')
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })
})
