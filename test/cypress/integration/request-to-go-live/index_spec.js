describe('Request to go live: index', () => {
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
      const serviceRole = buildServiceRoleForGoLiveStage('NOT_STARTED')
      serviceRole.role = {
        permissions: []
      }
      setupStubs(serviceRole)
    })

    it('should show an error when the user does not have enough permissions', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)
      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('Request to go live stage NOT_STARTED', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('NOT_STARTED'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request to go live')

      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Start now')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/organisation-name`)
      })
    })
  })

  describe('Request to go live stage ENTERED_ORGANISATION_NAME', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request to go live')

      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
      })
    })
  })

  describe('Request to go live stage CHOSEN_PSP_STRIPE', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('CHOSEN_PSP_STRIPE'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request to go live')

      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })

  describe('Request to go live stage CHOSEN_PSP_WORLDPAY', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('CHOSEN_PSP_WORLDPAY'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request to go live')

      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })

  describe('Request to go live stage CHOSEN_PSP_SMARTPAY', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('CHOSEN_PSP_SMARTPAY'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request to go live')

      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })

  describe('Request to go live stage CHOSEN_PSP_EPDQ', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('CHOSEN_PSP_EPDQ'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request to go live')

      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })

  describe('Request to go live stage TERMS_AGREED_STRIPE', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('TERMS_AGREED_STRIPE'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request to go live')

      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-index-form > button').should('not.exist')
    })
  })

  describe('Request to go live stage TERMS_AGREED_WORLDPAY', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('TERMS_AGREED_WORLDPAY'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request to go live')

      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-index-form > button').should('not.exist')
    })
  })

  describe('Request to go live stage TERMS_AGREED_SMARTPAY', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('TERMS_AGREED_SMARTPAY'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request to go live')

      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-index-form > button').should('not.exist')
    })
  })

  describe('Request to go live stage TERMS_AGREED_EPDQ', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('TERMS_AGREED_EPDQ'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('contain', 'Request to go live')

      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-index-form > button').should('not.exist')
    })
  })

  describe('Request to go live stage DENIED', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('DENIED'))
    })

    it('should show "Request to go live" page with an error', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('not.exist')

      cy.get('.govuk-error-summary h2').should('contain', 'There is a problem')
      cy.get('.govuk-error-summary .govuk-error-summary__list a')
        .should('contain', 'Please contact GOV.UK Pay support')
        .and('have.attr', 'href')
        .and('eq', 'https://www.payments.service.gov.uk/support/')
    })
  })

  describe('Request to go live stage LIVE', () => {
    beforeEach(() => {
      setupStubs(buildServiceRoleForGoLiveStage('LIVE'))
    })

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)

      cy.get('h1').should('not.exist')
      cy.get('.govuk-grid-column-full h3').should('contain', 'Thank you. We’re creating your live service')

      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-index-form > button').should('not.exist')
    })
  })
})
