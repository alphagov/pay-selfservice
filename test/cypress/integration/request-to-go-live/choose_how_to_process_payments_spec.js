'use strict'

const lodash = require('lodash')

describe('Request to go live: choose how to process payments', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const serviceExternalId = 'afe452323dd04d1898672bfaba25e3a6'

  const buildServiceRoleForGoLiveStage = (goLiveStage) => {
    return {
      service: {
        external_id: serviceExternalId,
        current_go_live_stage: goLiveStage,
        gateway_account_ids: [gatewayAccountId]
      }
    }
  }

  const simpleStub = (serviceRole) => {
    return [
      {
        name: 'getUserSuccess',
        opts: {
          external_id: userExternalId,
          service_roles: [serviceRole]
        }
      },
      {
        name: 'getGatewayAccountSuccess',
        opts: { gateway_account_id: gatewayAccountId }
      }
    ]
  }

  const stubWithGoLiveStage = (currentGoLiveStage) => {
    return {
      name: 'patchGoLiveStageSuccess',
      opts: {
        external_id: serviceExternalId,
        gateway_account_ids: [gatewayAccountId],
        current_go_live_stage: currentGoLiveStage,
        path: 'current_go_live_stage',
        value: currentGoLiveStage
      }
    }
  }

  const stubGoLiveStageError = (currentGoLiveStage) => {
    return {
      name: 'patchGoLiveStageFailure',
      opts: {
        external_id: serviceExternalId,
        gateway_account_ids: [gatewayAccountId],
        current_go_live_stage: currentGoLiveStage,
        path: 'current_go_live_stage',
        value: currentGoLiveStage
      }
    }
  }

  const setupStubs = (serviceRole) => {
    cy.task('setupStubs', simpleStub(serviceRole))
  }

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)
  })

  describe('User does not have the correct permissions', () => {
    beforeEach(() => {
      const serviceRole = buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME')
      serviceRole.role = {
        permissions: []
      }
      setupStubs(serviceRole)
    })

    it('should show an error when the user does not have enough permissions', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`
      cy.visit(requestToGoLivePageOrganisationNameUrl)
      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('Service has wrong go live stage', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('NOT_STARTED'))
    })

    it('should redirect to "Request to go live: index" page when in wrong stage', () => {
      const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`
      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      cy.get('h1').should('contain', 'Request to go live')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live`)
      })
    })
  })

  describe('Service has correct go live stage and user selects Stripe account', () => {
    const stubPayload = lodash.concat(simpleStub(buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME')),
      stubWithGoLiveStage('CHOSEN_PSP_STRIPE'))
    beforeEach(() => {
      cy.task('setupStubs', stubPayload)
    })

    it('should display "Choose how to process payments" page when in ENTERED_ORGANISATION_NAME', () => {
      const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`
      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      cy.get('h1').should('contain', 'Choose how to process payments')
      cy.get('#request-to-go-live-current-step').should('exist')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form').should('exist')
      cy.get('#choose-how-to-process-payments-mode-1').should('exist')
      cy.get('#choose-how-to-process-payments-mode-2').should('exist')

      cy.get('#conditional-choose-how-to-process-payments-mode-2').should('exist')
      cy.get('#conditional-choose-how-to-process-payments-mode-2').should('not.be.visible')

      cy.get('#choose-how-to-process-payments-mode-1').click()

      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').should('exist')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })

    describe('should show an error when no option selected', () => {
      it('should show "You need to select an option" error msg', () => {
        const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`
        cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

        cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()
        cy.get('.error-summary').should('contain', 'You need to select an option')

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
        })
      })
    })

    describe('should show an error when no other psp option selected', () => {
      it('should show "You need to select one of Worldpay, Smartpay or ePDQ" error msg', () => {
        const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`
        cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

        cy.get('#choose-how-to-process-payments-mode-2').click()
        cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()
        cy.get('.error-summary').should('contain', 'You need to select one of Worldpay, Smartpay or ePDQ')

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
        })
      })
    })
  })

  describe('Service has correct go live stage and user selects non Stripe account', () => {
    const stubPayload = lodash.concat(simpleStub(buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME')),
      stubWithGoLiveStage('CHOSEN_PSP_EPDQ'))
    beforeEach(() => {
      cy.task('setupStubs', stubPayload)
    })

    it('should patch choice and then redirect to agreement', () => {
      const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`
      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      cy.get('h1').should('contain', 'Choose how to process payments')
      cy.get('#request-to-go-live-current-step').should('exist')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form').should('exist')
      cy.get('#choose-how-to-process-payments-mode-1').should('exist')
      cy.get('#choose-how-to-process-payments-mode-2').should('exist')

      cy.get('#conditional-choose-how-to-process-payments-mode-2').should('exist')
      cy.get('#conditional-choose-how-to-process-payments-mode-2').should('not.be.visible')

      cy.get('#choose-how-to-process-payments-mode-2').click()
      cy.get('#conditional-choose-how-to-process-payments-mode-2').should('be.visible')

      cy.get('#choose-how-to-process-payments-mode-other-1').should('exist')
      cy.get('#conditional-choose-how-to-process-payments-mode-2 label[for=choose-how-to-process-payments-mode-other-1]').should('contain', 'Worldpay')

      cy.get('#choose-how-to-process-payments-mode-other-2').should('exist')
      cy.get('#conditional-choose-how-to-process-payments-mode-2 label[for=choose-how-to-process-payments-mode-other-2]').should('contain', 'Smartpay')

      cy.get('#choose-how-to-process-payments-mode-other-3').should('exist')
      cy.get('#conditional-choose-how-to-process-payments-mode-2 label[for=choose-how-to-process-payments-mode-other-3]').should('contain', 'ePDQ')

      cy.get('#choose-how-to-process-payments-mode-other-3').click()
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').should('exist')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })

  describe('adminusers error handlings', () => {
    const stubPayload = lodash.concat(simpleStub(buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME')),
      stubGoLiveStageError('CHOSEN_PSP_STRIPE'))
    beforeEach(() => {
      cy.task('setupStubs', stubPayload)
    })
    it('should show "An error occurred: There is a problem with the payments platform"', () => {
      const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`
      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      cy.get('#choose-how-to-process-payments-mode-1').click()
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()

      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'There is a problem with the payments platform')
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
      })
    })
  })
})
