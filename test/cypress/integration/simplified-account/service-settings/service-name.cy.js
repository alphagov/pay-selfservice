const userStubs = require('../../../stubs/user-stubs')
const gatewayAccountStubs = require('../../../stubs/gateway-account-stubs')
const serviceStubs = require('../../../stubs/service-stubs')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const SERVICE_NAME = {
  en: 'My Cool Service',
  cy: 'Fy Ngwasanaeth Cwl'
}
const TEST_ACCOUNT_TYPE = 'test'
const TEST_GATEWAY_ACCOUNT_ID = 10

const SERVICE_SETTINGS_URL = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${TEST_ACCOUNT_TYPE}/settings`

const setStubs = (opts = {}) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: TEST_GATEWAY_ACCOUNT_ID,
      serviceName: opts.serviceName || SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: opts.role,
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, TEST_ACCOUNT_TYPE, { gateway_account_id: TEST_GATEWAY_ACCOUNT_ID }),
    serviceStubs.patchUpdateServiceNameSuccess({
      serviceExternalId: SERVICE_EXTERNAL_ID,
      gatewayAccountId: TEST_GATEWAY_ACCOUNT_ID,
      serviceName: {
        en: 'My New Service Name',
        cy: SERVICE_NAME.cy
      }
    }),
    gatewayAccountStubs.patchUpdateServiceNameSuccess(TEST_GATEWAY_ACCOUNT_ID, 'My New Service Name')
  ])
}

describe('Service settings', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('The default settings page', () => {
    describe('For an admin user', () => {
      beforeEach(() => {
        setStubs()
        cy.visit(SERVICE_SETTINGS_URL)
      })
      it('should be Service name', () => {
        cy.title().should('eq', 'Settings - Service name - GOV.UK Pay')
      })
      describe('The settings navigation', () => {
        it('should show service name', () => {
          cy.get('.service-settings-nav')
            .find('li')
            .should('contain', 'Service name')
            .find('a')
            .should('have.attr', 'href', `${SERVICE_SETTINGS_URL}/service-name`)
        })
      })
    })
    describe('For any other user', () => {
      beforeEach(() => {
        const role = {
          name: 'view-only',
          description: 'View only',
          permissions: [
            {
              name: 'transactions:read',
              description: 'Viewtransactionslist'
            }
          ]
        }
        setStubs({
          role
        })
        cy.visit(SERVICE_SETTINGS_URL)
      })
      it('should be Email notifications', () => {
        cy.title().should('eq', 'Settings - Email notifications')
      })
      describe('The settings navigation', () => {
        it('should not show service name', () => {
          cy.get('.service-settings-nav')
            .find('li')
            .should('not.contain', 'Service name')
            .find('a')
            .should('not.have.attr', 'href', `${SERVICE_SETTINGS_URL}/service-name`)
        })
      })
    })
  })
  describe('Service name index', () => {
    beforeEach(() => {
      setStubs()
      cy.visit(SERVICE_SETTINGS_URL)
    })
    const expectedSettings = [
      {
        key: 'Service name',
        value: SERVICE_NAME.en,
        actions: [
          { text: 'Change', href: `${SERVICE_SETTINGS_URL}/service-name/edit` }
        ]
      },
      {
        key: 'Welsh service name',
        value: SERVICE_NAME.cy,
        actions: [
          { text: 'Change', href: `${SERVICE_SETTINGS_URL}/service-name/edit?cy=true` }
        ]
      }
    ]
    it(`should show the correct heading`, () => {
      cy.get('h1').should('contain', 'Service name')
    })

    it(`should correctly display the Service name settings`, () => {
      cy.get('.govuk-summary-list__row').should('have.length', 2).each((row, index) => {
        const expected = expectedSettings[index]
        cy.wrap(row).find('.govuk-summary-list__key')
          .should('contain.text', expected.key)
        cy.wrap(row).find('.govuk-summary-list__value')
          .should('contain.text', expected.value)

        cy.wrap(row).find('.govuk-summary-list__actions')
          .should('have.length', expected.actions.length)
          .each((action, actionIndex) => {
            const expectedAction = expected.actions[actionIndex]
            cy.wrap(action).find('a')
              .should('contain.text', expectedAction.text)
              .and('have.attr', 'href', expectedAction.href)
          })
      })
    })

    it('should navigate to edit view for English service name when action is clicked', () => {
      cy.get('[data-cy="edit-english-name"]').click()
      cy.url().should('contain', 'edit')
      cy.title().should('eq', 'Settings - Edit service name')
      cy.get('h1').should('contain.text', 'Service name (English)')
      cy.get('input[name="service-name-input"]').should('have.value', SERVICE_NAME.en)
      cy.get('.govuk-back-link').click()
      cy.url().should('not.contain', 'edit')
      cy.title().should('eq', 'Settings - Service name - GOV.UK Pay')
    })

    it('should navigate to edit view for Welsh service name when action is clicked', () => {
      cy.get('[data-cy="edit-welsh-name"]').click()
      cy.url().should('contain', 'edit')
      cy.title().should('eq', 'Settings - Edit service name')
      cy.get('h1').should('contain.text', 'Service name (Welsh)')
      cy.get('input[name="service-name-input"]').should('have.value', SERVICE_NAME.cy)
      cy.get('.govuk-back-link').click()
      cy.url().should('not.contain', 'edit')
      cy.title().should('eq', 'Settings - Service name - GOV.UK Pay')
    })
  })

  describe('Service name validation', () => {
    beforeEach(() => {
      setStubs()
    })
    const checkServiceNameValidation = (options) => {
      const {
        inputValue,
        errorMessage,
        isEnglish = true
      } = options
      cy.visit(SERVICE_SETTINGS_URL + `/service-name/edit${isEnglish ? '' : '?cy=true'}`)
      cy.get(`input[name="service-name-input"]`).clear({ force: true })
      if (inputValue) {
        cy.get(`input[name="service-name-input"]`).type(inputValue)
      }
      cy.get(`input[name="service-name-input"]`).should('have.value', inputValue)
      cy.get('.govuk-error-summary').should('not.exist')
      cy.get('button[form="edit-service-name-form"]').click()
      cy.get('.govuk-error-summary').should('exist').should('contain', errorMessage)
      cy.get(`input[name="service-name-input"]`).should('have.class', 'govuk-input--error')
      cy.get(`#service-name-input-error`).should('contain.text', errorMessage)
      cy.get(`input[name="service-name-input"]`).should('have.value', inputValue)
    }

    it('should show validation error when attempting to submit an English service name that is too long', () => {
      checkServiceNameValidation({
        inputName: 'service-name-input',
        inputValue: 'A'.repeat(51),
        errorMessage: 'Service name must be 50 characters or fewer'
      })
    })

    it('should show validation error when attempting to submit an empty English service name', () => {
      checkServiceNameValidation({
        inputName: 'service-name-input',
        inputValue: '',
        errorMessage: 'Service name is required'
      })
    })

    it('should show validation error when attempting to submit a Welsh service name that is too long', () => {
      checkServiceNameValidation({
        inputName: 'welsh-service-name-input',
        inputValue: 'A'.repeat(51),
        errorMessage: 'Service name must be 50 characters or fewer',
        isEnglish: false
      })
    })

    it('should not show validation error when attempting to submit an empty Welsh service name', () => {
      cy.visit(SERVICE_SETTINGS_URL + '/service-name/edit?cy=true')
      cy.get('input[name="service-name-input"]').clear({ force: true }).should('have.value', '')
      cy.get('.govuk-error-summary').should('not.exist')
      cy.get('button[form="edit-service-name-form"]').click()
      cy.get('.govuk-error-summary').should('not.exist')
      cy.get(`#service-name-input-error`).should('not.exist')
    })
  })

  describe('Service name edit', () => {
    describe('English service name', () => {
      beforeEach(() => {
        setStubs()
        cy.visit(SERVICE_SETTINGS_URL + '/service-name/edit')
      })
      it('should show expected form elements', () => {
        cy.get('h1').should('contain.text', 'Service name (English)')
        cy.get('input[name="service-name-input"]').should('have.value', SERVICE_NAME.en)
        cy.get('.govuk-button').should('contain.text', 'Save changes')
        cy.get('.govuk-button').should('not.contain.text', 'Remove Welsh service name')
      })
      it('should submit form', () => {
        cy.get('input[name="service-name-input"]').clear({ force: true }).type('My New Service Name')
          .should('have.value', 'My New Service Name')
        cy.get('button[form="edit-service-name-form"]').click()
        cy.title().should('eq', 'Settings - Service name - GOV.UK Pay')
      })
    })
    describe('Welsh service name', () => {
      beforeEach(() => {
        setStubs()
        cy.visit(SERVICE_SETTINGS_URL + '/service-name/edit?cy=true')
      })
      it('should show expected form elements', () => {
        cy.get('h1').should('contain.text', 'Service name (Welsh)')
        cy.get('input[name="service-name-input"]').should('have.value', SERVICE_NAME.cy)
        cy.get('.govuk-button').should('contain.text', 'Save changes')
        cy.get('.govuk-button').should('contain.text', 'Remove Welsh service name')
      })
    })
    describe('Unset Welsh service name', () => {
      beforeEach(() => {
        setStubs({
          serviceName: {
            en: 'My Cool Service',
            cy: undefined
          }
        })
        cy.visit(SERVICE_SETTINGS_URL + '/service-name/edit?cy=true')
      })
      it('should show expected form elements', () => {
        cy.get('h1').should('contain.text', 'Service name (Welsh)')
        cy.get('input[name="service-name-input"]').should('have.value', '')
        cy.get('.govuk-button').should('contain.text', 'Save changes')
        cy.get('.govuk-button').should('not.contain.text', 'Remove Welsh service name')
      })
    })
  })
})
