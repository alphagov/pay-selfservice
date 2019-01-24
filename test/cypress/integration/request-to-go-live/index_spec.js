describe('Request to go live: index', () => {
  const userExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
  const gatewayAccountId = 666
  const serviceExternalId = 'cp5wa'

  const setupStubsForGoLiveStage = (goLiveStage) => {
    cy.task('setupStubs', [
      {
        name: 'getUserSuccess',
        opts: {
          external_id: userExternalId,
          service_roles: [{
            service: {
              external_id: serviceExternalId,
              current_go_live_stage: goLiveStage,
              gateway_account_ids: [gatewayAccountId]
            }
          }]
        }
      },
      {
        name: 'getGatewayAccountSuccess',
        opts: { gateway_account_id: gatewayAccountId }
      }
    ])
  }

  beforeEach(() => {
    cy.task('getCookies', {
      user_external_id: userExternalId,
      gateway_account_id: gatewayAccountId
    }).then(cookies => {
      cy.setCookie('session', cookies.encryptedSessionCookie)
      cy.setCookie('gateway_account', cookies.encryptedGatewayAccountCookie)
    })
  })

  describe('NO PERMISSIONS', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        {
          name: 'getUserSuccess',
          opts: {
            external_id: userExternalId,
            service_roles: [{
              service: {
                external_id: serviceExternalId,
                current_go_live_stage: 'NOT_STARTED',
                gateway_account_ids: [gatewayAccountId]
              },
              role: {
                permissions: []
              }
            }]
          }
        },
        {
          name: 'getGatewayAccountSuccess',
          opts: { gateway_account_id: gatewayAccountId }
        }
      ])
    })

    it('should show an error when the user does not have enough permissions', () => {
      const requestToGoLivePageUrl = `/service/${serviceExternalId}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)
      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_NOT_STARTED', () => {
    beforeEach(() => {
      setupStubsForGoLiveStage('NOT_STARTED')
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
      setupStubsForGoLiveStage('ENTERED_ORGANISATION_NAME')
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
      setupStubsForGoLiveStage('CHOSEN_PSP_STRIPE')
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
      setupStubsForGoLiveStage('CHOSEN_PSP_WORLDPAY')
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
      setupStubsForGoLiveStage('CHOSEN_PSP_SMARTPAY')
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
      setupStubsForGoLiveStage('CHOSEN_PSP_EPDQ')
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
      setupStubsForGoLiveStage('TERMS_AGREED_STRIPE')
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
      setupStubsForGoLiveStage('TERMS_AGREED_WORLDPAY')
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
      setupStubsForGoLiveStage('TERMS_AGREED_SMARTPAY')
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
      setupStubsForGoLiveStage('TERMS_AGREED_EPDQ')
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
      setupStubsForGoLiveStage('DENIED')
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
      setupStubsForGoLiveStage('LIVE')
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
