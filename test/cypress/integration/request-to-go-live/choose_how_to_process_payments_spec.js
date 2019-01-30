'use strict'

describe('Request to go live: choose how to process payments', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 666
  const serviceExternalId = 'cp5wa'

  const buildServiceRoleForGoLiveStage = (goLiveStage) => {
    return {
      service: {
        external_id: serviceExternalId,
        current_go_live_stage: goLiveStage,
        gateway_account_ids: [gatewayAccountId]
      }
    }
  }

  const setupStubs = (serviceRole) => {
    cy.task('setupStubs', [
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
    ])
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

  describe('Service has correct go live stage', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME'))
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

      cy.get('#choose-how-to-process-payments-mode-2').click()
      cy.get('#conditional-choose-how-to-process-payments-mode-2').should('be.visible')

      cy.get('#choose-how-to-process-payments-mode-other-1').should('exist')
      cy.get('#conditional-choose-how-to-process-payments-mode-2 label[for=choose-how-to-process-payments-mode-other-1]').should('contain', 'Worldpay')

      cy.get('#choose-how-to-process-payments-mode-other-2').should('exist')
      cy.get('#conditional-choose-how-to-process-payments-mode-2 label[for=choose-how-to-process-payments-mode-other-2]').should('contain', 'Smartpay')

      cy.get('#choose-how-to-process-payments-mode-other-3').should('exist')
      cy.get('#conditional-choose-how-to-process-payments-mode-2 label[for=choose-how-to-process-payments-mode-other-3]').should('contain', 'ePDQ')

      cy.get('#conditional-choose-how-to-process-payments-mode-2').click()
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').should('exist')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').should('contain', 'Continue')
    })

    describe('should show an error when no option selected', () => {
      it('should show "You must choose an option" error msg', () => {
        const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`
        cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

        cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()
        cy.get('.error-summary').should('contain', 'You must select an option')

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
        })
      })

      it('should show "You must select one of Worldpay, Smartpay or ePDQ" error msg', () => {
        const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`
        cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

        cy.get('#choose-how-to-process-payments-mode-2').click()
        cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()
        cy.get('.error-summary').should('contain', 'You must select one of Worldpay, Smartpay or ePDQ')

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
        })
      })
    })
  })
})
