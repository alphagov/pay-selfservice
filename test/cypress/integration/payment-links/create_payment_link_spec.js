const commonStubs = require('../../utils/common_stubs')
const userExternalId = 'a-user-id'
const gatewayAccountId = 42

describe('The create payment link flow', () => {
  beforeEach(() => {
    cy.task('setupStubs', [
      commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
      commonStubs.getGatewayAccountStub(gatewayAccountId, 'test', 'worldpay')
    ])
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  describe('The create payment link start page', () => {
    it('Should display page content', () => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/create-payment-link')

      cy.get('h1').should('contain', 'Create a payment link')
      cy.get('a#create-payment-link').should('exist')
    })
  })

  describe('A English payment link', () => {
    it('Should navigate to create payment link in English information page', () => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/create-payment-link')

      cy.get('a#create-payment-link').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/create-payment-link/information`)
      })
    })

    describe('Information page', () => {
      it('Should display instructions for an English payment link', () => {
        cy.get('h1').should('contain', 'Set payment link information')

        cy.get('form[method=post][action="/create-payment-link/information"]').should('exist')
          .within(() => {
            cy.get('input#payment-link-title').should('exist')
            cy.get('input#payment-link-title').should('have.attr', 'lang', 'en')
            cy.get('label[for="payment-link-title"]').should('contain', 'Title')
            cy.get('input#payment-link-title').parent('.govuk-form-group').get('span')
              .should('contain', 'For example, “Pay for a parking permit”')

            cy.get('textarea#payment-link-description').should('exist')
            cy.get('textarea#payment-link-description').should('have.attr', 'lang', 'en')
            cy.get('label[for="payment-link-description"]').should('exist')
            cy.get('textarea#payment-link-description').parent('.govuk-form-group').get('span')
              .should('contain', 'Give your users more information.')

            cy.get('button[type=submit]').should('exist')
          })
      })

      it('Should continue to the reference page', () => {
        cy.get('input#payment-link-title').type('Pay for a parking permit')
        cy.get('textarea#payment-link-description').type('A description')

        cy.get('button[type=submit]').click()

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/create-payment-link/reference`)
        })
      })
    })
  })

  describe('A Welsh payment link', () => {
    describe('Information page', () => {
      it('Should display Welsh-specific instructions', () => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)

        // TODO start the flow by clicking "Create payment link in Welsh" link when this
        // exists
        cy.visit('/create-payment-link/information?language=cy')

        cy.get('h1').should('contain', 'Set Welsh payment link information')

        cy.get('form[method=post][action="/create-payment-link/information"]').should('exist')
          .within(() => {
            cy.get('input#payment-link-title').should('exist')
            cy.get('input#payment-link-title').should('have.attr', 'lang', 'cy')
            cy.get('label[for="payment-link-title"]').should('contain', 'Welsh title')
            cy.get('input#payment-link-title').parent('.govuk-form-group').get('span')
              .should('contain', 'For example, “Talu am drwydded barcio”')

            cy.get('textarea#payment-link-description').should('exist')
            cy.get('textarea#payment-link-description').should('have.attr', 'lang', 'cy')
            cy.get('label[for="payment-link-description"]').should('exist')
            cy.get('textarea#payment-link-description').parent('.govuk-form-group').get('span')
              .should('contain', 'Give your users more information in Welsh')

            cy.get('button[type=submit]').should('exist')
          })
      })

      it('Should continue to the reference page', () => {
        cy.get('input#payment-link-title').type('Talu am drwydded barcio')
        cy.get('textarea#payment-link-description').type('Disgrifiad yn Gymraeg')

        cy.get('button[type=submit]').click()

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/create-payment-link/reference`)
        })
      })
    })
  })
})
