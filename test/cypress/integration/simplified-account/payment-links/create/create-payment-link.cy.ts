import userStubs from '@test/cypress/stubs/user-stubs'
import ROLES from '@test/fixtures/roles.fixtures'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { SANDBOX } from '@models/constants/payment-providers'
import { beforeEach } from 'mocha'
import productStubs from '@test/cypress/stubs/products-stubs'

const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = 117
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const CREATE_PAYMENT_LINK_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links/create`

const REFERENCE_PAYMENT_LINK_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links/reference`

const PAYMENT_LINKS_INDEX_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links`

const OLD_REVIEW_URL = `/account/${GATEWAY_ACCOUNT_ID}/payment-links/review`

const setupStubs = (
  role = 'admin',
  gatewayAccountType = 'test'
) => {
  const stubs = [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: (ROLES as Record<string, object>)[role],
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, gatewayAccountType, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: gatewayAccountType,
      payment_provider: SANDBOX,
    }),
  ]

  cy.task('setupStubs', stubs)
}

const checkWelshPageContent = (pageTitle: string, hasExampleImage = false) => {
  cy.get('h1').should('contain.text', pageTitle)
  cy.get('.govuk-hint').should('contain.text', 'Talu am drwydded barcio')

  if (hasExampleImage) {
    cy.get('img[alt="Screenshot of payment link start page"]').should('exist')
  } else {
    cy.get('img[alt="Screenshot of payment link start page"]').should('not.exist')
  }
}

const checkValidationError = (errorText: string) => {
  cy.get('.govuk-error-summary')
    .should('exist')
    .should('contain.text', 'There is a problem')
    .should('contain.text', errorText)

  cy.get('.govuk-error-message')
    .should('exist')
    .should('contain.text', errorText)
}

const fillWelshPaymentLinkForm = (title = 'Talu am drwydded barcio', description = 'Disgrifiad Cymraeg') => {
  cy.get('input[name="name"]').type(title)
  if (description) {
    cy.get('textarea[name="description"]').type(description)
  }
}

const submitFormAndContinue = () => {
  cy.get('form button[type="submit"]').click()
}

describe('Create Payment Link', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('Permission checks', () => {
    describe('View-only user', () => {
      beforeEach(() => {
        setupStubs('view-only', 'test')
        cy.visit(CREATE_PAYMENT_LINK_URL(), { failOnStatusCode: false })
      })

      it('should not have access to create payment link page', () => {
        cy.get('h1').should('contain.text', 'An error occurred')
      })
    })

    describe('Admin user', () => {
      beforeEach(() => {
        setupStubs('admin')
        cy.visit(CREATE_PAYMENT_LINK_URL())
      })

      it('should have access to create payment link page', () => {
        cy.get('h1').should('contain.text', 'Enter test payment link details')
      })
    })
  })

  describe('Information page - Page content', () => {
    beforeEach(() => {
      setupStubs('admin', 'test')
      cy.visit(CREATE_PAYMENT_LINK_URL())
    })

    it('should display correct page title and heading', () => {
      cy.title().should('eq', `Enter test payment link details - ${SERVICE_NAME.en} - GOV.UK Pay`)
      cy.get('h1').should('contain.text', 'Enter test payment link details')
    })

    it('should show back link to payment links index', () => {
      cy.get('.govuk-back-link')
        .should('exist')
        .should('have.attr', 'href', PAYMENT_LINKS_INDEX_URL())
        .should('contain.text', 'Back')
    })

    it('should display form fields', () => {
      cy.get('input[name="name"]').should('exist')
      cy.get('textarea[name="description"]').should('exist')

      cy.get('label').contains('Title').should('exist')
      cy.get('label').contains('Details (optional)').should('exist')
    })

    it('should have a submit button', () => {
      cy.get('button[type="submit"]')
        .should('exist')
        .should('contain.text', 'Continue')
    })

    it('should have CSRF token', () => {
      cy.get('input[name="csrfToken"]')
        .should('exist')
        .should('have.attr', 'type', 'hidden')
    })

    it('should display example image', () => {
      cy.get('img[alt="Screenshot of payment link start page"]').should('exist')
    })

    it('accessibility check', () => {
      cy.a11yCheck()
    })
  })

  describe('Information page - Form validation', () => {
    beforeEach(() => {
      setupStubs('admin', 'test')
      cy.visit(CREATE_PAYMENT_LINK_URL())
    })

    it('should show error when title is empty', () => {
      submitFormAndContinue()

      cy.url().should('include', CREATE_PAYMENT_LINK_URL())
      checkValidationError('Enter a payment link title')
    })

    it('should show error when title is too long', () => {
      const longTitle = '1234567890'.repeat(24)
      cy.get('input[name="name"]').type(longTitle)
      submitFormAndContinue()

      cy.url().should('include', CREATE_PAYMENT_LINK_URL())

      cy.get('.govuk-error-summary')
        .should('contain.text', 'Title must be 230 characters or fewer')
    })

    it('should show error when description is too long', () => {
      const longDescription = '1234567890'.repeat(26)
      cy.get('input[name="name"]').type('Valid Title')
      cy.get('textarea[name="description"]').type(longDescription)
      submitFormAndContinue()

      cy.url().should('include', CREATE_PAYMENT_LINK_URL())

      cy.get('.govuk-error-summary')
        .should('contain.text', 'Details must be 255 characters or fewer')
    })

    it('should preserve form values when validation fails', () => {
      cy.get('input[name="name"]').type('Test Title')
      cy.get('textarea[name="description"]').type('Test description')

      cy.get('input[name="name"]').clear()
      submitFormAndContinue()

      cy.get('textarea[name="description"]').should('have.value', 'Test description')
    })
  })

  describe('Reference page - Page content', () => {
    beforeEach(() => {
      setupStubs('admin', 'test')
      cy.visit(REFERENCE_PAYMENT_LINK_URL())
    })

    it('should display correct page title and heading', () => {
      cy.title().should('eq', `Will your users already have a payment reference? - ${SERVICE_NAME.en} - GOV.UK Pay`)
      cy.get('h1').should('contain.text', 'Will your users already have a payment reference?')
    })

    it('should show back link to create page', () => {
      cy.get('.govuk-back-link')
        .should('exist')
        .should('have.attr', 'href', CREATE_PAYMENT_LINK_URL())
        .should('contain.text', 'Back')
    })

    it('should display radio options', () => {
      cy.get('input[name="reference"]').should('have.length', 2)
      cy.get('input[value="yes"]').should('exist')
      cy.get('input[value="no"]').should('exist')

      cy.get('label').contains('Yes').should('exist')
      cy.get('label').contains('No - use a reference generated by GOV.UK Pay').should('exist')
    })

    it('should display conditional fields when "Yes" is selected', () => {
      cy.get('input[value="yes"]').check()

      cy.get('input[name="referenceLabel"]').should('be.visible')
      cy.get('textarea[name="referenceHint"]').should('be.visible')

      cy.get('label').contains('Name of payment reference').should('be.visible')
      cy.get('label').contains('Hint text (optional)').should('be.visible')
    })

    it('should hide conditional fields when "No" is selected', () => {
      cy.get('input[value="yes"]').check()
      cy.get('input[value="no"]').check()

      cy.get('input[name="referenceLabel"]').should('not.be.visible')
      cy.get('textarea[name="referenceHint"]').should('not.be.visible')
    })

    it('should display example image', () => {
      cy.get('img[alt="Screenshot of payment link start page"]').should('exist')
    })
  })

  describe('Reference page - Form validation', () => {
    beforeEach(() => {
      setupStubs('admin', 'test')
    })

    it('should have "No" option selected by default', () => {
      cy.visit(CREATE_PAYMENT_LINK_URL())
      cy.get('input[name="name"]').type('Test Payment Link')
      submitFormAndContinue()

      cy.url().should('include', REFERENCE_PAYMENT_LINK_URL())
      cy.get('input[value="no"]').should('be.checked')

      cy.intercept('POST', REFERENCE_PAYMENT_LINK_URL(), {
        statusCode: 302,
        headers: {
          Location: OLD_REVIEW_URL
        }
      }).as('submitReference')

      submitFormAndContinue()
      cy.wait('@submitReference')

      cy.url().should('include', '/account/')
      cy.url().should('include', '/payment-links/review')
    })

    it('should show error when "Yes" is selected but reference label is empty', () => {
      cy.visit(CREATE_PAYMENT_LINK_URL())
      cy.get('input[name="name"]').type('Test Payment Link')
      submitFormAndContinue()

      cy.url().should('include', REFERENCE_PAYMENT_LINK_URL())
      cy.get('input[value="yes"]').check()
      submitFormAndContinue()

      cy.url().should('include', REFERENCE_PAYMENT_LINK_URL())

      cy.get('.govuk-error-summary')
        .should('contain.text', 'Enter a name for the payment reference')
    })

    it('should show error when reference label is too long', () => {
      cy.visit(CREATE_PAYMENT_LINK_URL())
      cy.get('input[name="name"]').type('Test Payment Link')
      submitFormAndContinue()

      cy.url().should('include', REFERENCE_PAYMENT_LINK_URL())
      const longLabel = '1234567890'.repeat(26)
      cy.get('input[value="yes"]').check()
      cy.get('input[name="referenceLabel"]').type(longLabel)
      submitFormAndContinue()

      cy.url().should('include', REFERENCE_PAYMENT_LINK_URL())

      cy.get('.govuk-error-summary')
        .should('contain.text', 'Payment reference name must be 255 characters or fewer')
    })

    it('should show error when reference hint is too long', () => {
      cy.visit(CREATE_PAYMENT_LINK_URL())
      cy.get('input[name="name"]').type('Test Payment Link')
      submitFormAndContinue()

      cy.url().should('include', REFERENCE_PAYMENT_LINK_URL())
      const longHint = '1234567890'.repeat(26)
      cy.get('input[value="yes"]').check()
      cy.get('input[name="referenceLabel"]').type('Valid Label')
      cy.get('textarea[name="referenceHint"]').type(longHint)
      submitFormAndContinue()

      cy.url().should('include', REFERENCE_PAYMENT_LINK_URL())

      cy.get('.govuk-error-summary')
        .should('contain.text', 'Reference hint must be 255 characters or fewer')
    })
  })

  describe('Complete journey flow', () => {
    beforeEach(() => {
      setupStubs('admin', 'test')
    })

    it('should complete the full payment link creation journey', () => {
      cy.visit(CREATE_PAYMENT_LINK_URL())

      cy.get('input[name="name"]').type('Test Payment Link')
      cy.get('textarea[name="description"]').type('This is a test payment link for cypress testing')
      submitFormAndContinue()

      cy.url().should('include', REFERENCE_PAYMENT_LINK_URL())
      cy.get('h1').should('contain.text', 'Will your users already have a payment reference?')

      cy.get('input[value="yes"]').check()
      cy.get('input[name="referenceLabel"]').type('Invoice Number')
      cy.get('textarea[name="referenceHint"]').type('Enter your 8-digit invoice number')

      cy.intercept('POST', REFERENCE_PAYMENT_LINK_URL(), {
        statusCode: 302,
        headers: {
          Location: OLD_REVIEW_URL
        }
      }).as('submitReference')

      submitFormAndContinue()
      cy.wait('@submitReference')

      cy.url().should('include', '/account/')
      cy.url().should('include', '/payment-links/review')
    })

    it('should complete journey with "No" reference option', () => {
      cy.visit(CREATE_PAYMENT_LINK_URL())

      cy.get('input[name="name"]').type('Simple Payment Link')
      submitFormAndContinue()

      cy.url().should('include', REFERENCE_PAYMENT_LINK_URL())
      cy.get('input[value="no"]').check()

      cy.intercept('POST', REFERENCE_PAYMENT_LINK_URL(), {
        statusCode: 302,
        headers: {
          Location: OLD_REVIEW_URL
        }
      }).as('submitReference')

      submitFormAndContinue()
      cy.wait('@submitReference')

      cy.url().should('include', '/account/')
      cy.url().should('include', '/payment-links/review')
    })

    it('should handle session data correctly between pages', () => {
      cy.visit(CREATE_PAYMENT_LINK_URL())

      cy.visit(`${CREATE_PAYMENT_LINK_URL()}?language=cy`)
      fillWelshPaymentLinkForm('Welsh Payment Link', 'Welsh description')
      submitFormAndContinue()

      cy.url().should('include', REFERENCE_PAYMENT_LINK_URL())
      cy.get('h1').should('contain.text', 'Will your users already have a payment reference?')
    })
  })

  describe('Welsh Language Support', () => {
    describe('Information page - Welsh content', () => {
      beforeEach(() => {
        setupStubs('admin', 'test')
        cy.visit(`${CREATE_PAYMENT_LINK_URL()}?language=cy`)
      })

      it('should display Welsh-specific page title and heading', () => {
        cy.title().should('eq', `Enter Welsh test payment link details - ${SERVICE_NAME.en} - GOV.UK Pay`)
        checkWelshPageContent('Enter Welsh test payment link details')
      })

      it('should show Welsh hint text for details field', () => {
        cy.get('label').contains('Details (optional)').parent()
          .find('.govuk-hint')
          .should('contain.text', 'Give your users more information in Welsh')
      })

      it('should preserve form enhancement attributes in Welsh mode', () => {
        cy.get('input[name="name"]').should('have.attr', 'data-confirmation', 'true')
        cy.get('input[name="name"]').should('have.attr', 'data-confirmation-title', 'Website address')
      })

      it('accessibility check for Welsh version', () => {
        cy.a11yCheck()
      })
    })

    describe('Information page - Welsh form validation', () => {
      beforeEach(() => {
        setupStubs('admin', 'test')
        cy.visit(`${CREATE_PAYMENT_LINK_URL()}?language=cy`)
      })

      it('should show validation errors when title is empty', () => {
        submitFormAndContinue()

        cy.url().should('include', CREATE_PAYMENT_LINK_URL())
        cy.url().should('include', 'language=cy')
        checkValidationError('Enter a payment link title')
      })

      it('should preserve Welsh language context after validation errors', () => {
        submitFormAndContinue()
        checkWelshPageContent('Enter Welsh test payment link details')
      })
    })

    describe('Reference page - Welsh content', () => {
      beforeEach(() => {
        setupStubs('admin', 'test')
        cy.visit(`${CREATE_PAYMENT_LINK_URL()}?language=cy`)
        fillWelshPaymentLinkForm('Welsh Payment Link')
        submitFormAndContinue()
      })

      it('should maintain Welsh context on reference page', () => {
        cy.url().should('include', REFERENCE_PAYMENT_LINK_URL())
        cy.get('h1').should('contain.text', 'Will your users already have a payment reference?')
        cy.get('img[alt="Screenshot of payment link start page"]').should('not.exist')
      })

      it('should show back link to create page (in Welsh mode)', () => {
        cy.get('.govuk-back-link')
          .should('exist')
          .should('have.attr', 'href')
          .and('include', CREATE_PAYMENT_LINK_URL())
      })
    })

    describe('Complete Welsh journey flow', () => {
      beforeEach(() => {
        setupStubs('admin', 'test')
      })

      it('should complete full Welsh payment link creation journey', () => {
        cy.visit(`${CREATE_PAYMENT_LINK_URL()}?language=cy`)

        checkWelshPageContent('Enter Welsh test payment link details')
        fillWelshPaymentLinkForm('Talu am drwydded barcio', 'Taliadau ar gyfer trwyddedau parcio preswyl yng Nghymru')
        submitFormAndContinue()

        cy.url().should('include', REFERENCE_PAYMENT_LINK_URL())
        cy.get('h1').should('contain.text', 'Will your users already have a payment reference?')
        cy.get('img[alt="Screenshot of payment link start page"]').should('not.exist')

        cy.get('input[value="yes"]').check()
        cy.get('input[name="referenceLabel"]').type('Rhif cais')
        cy.get('textarea[name="referenceHint"]').type('Rhowch eich rhif cais 6 digid')

        cy.intercept('POST', REFERENCE_PAYMENT_LINK_URL(), {
          statusCode: 302,
          headers: {
            Location: OLD_REVIEW_URL
          }
        }).as('submitWelshJourney')

        submitFormAndContinue()
        cy.wait('@submitWelshJourney')

        cy.url().should('include', '/account/')
        cy.url().should('include', '/payment-links/review')
      })

      it('should maintain Welsh context when navigating back', () => {
        cy.visit(`${CREATE_PAYMENT_LINK_URL()}?language=cy`)

        fillWelshPaymentLinkForm('Welsh Title')
        submitFormAndContinue()

        cy.url().should('include', REFERENCE_PAYMENT_LINK_URL())

        cy.get('.govuk-back-link').click()

        checkWelshPageContent('Enter Welsh test payment link details')
        cy.get('input[name="name"]').should('have.value', 'Welsh Title')
      })

      it('should handle language switching during journey', () => {
        cy.visit(CREATE_PAYMENT_LINK_URL())
        cy.get('h1').should('contain.text', 'Enter test payment link details')
        cy.get('img[alt="Screenshot of payment link start page"]').should('exist')

        cy.visit(`${CREATE_PAYMENT_LINK_URL()}?language=cy`)
        checkWelshPageContent('Enter Welsh test payment link details')

        fillWelshPaymentLinkForm('Switching Language Test')
        submitFormAndContinue()

        cy.url().should('include', REFERENCE_PAYMENT_LINK_URL())
        cy.get('h1').should('contain.text', 'Will your users already have a payment reference?')
        cy.get('img[alt="Screenshot of payment link start page"]').should('not.exist')
      })
    })

    describe('Welsh validation and edge cases', () => {
      beforeEach(() => {
        setupStubs('admin', 'test')
      })

      it('should handle very long Welsh text validation', () => {
        cy.visit(`${CREATE_PAYMENT_LINK_URL()}?language=cy`)

        const longWelshTitle = 'Talu am drwydded barcio preswyl yng Nghymru '.repeat(10)
        const longWelshDescription = 'Rhowch fanylion eich cais yn y Gymraeg '.repeat(10)

        cy.get('input[name="name"]').type(longWelshTitle)
        cy.get('textarea[name="description"]').type(longWelshDescription)
        submitFormAndContinue()

        cy.url().should('include', CREATE_PAYMENT_LINK_URL())
        cy.url().should('include', 'language=cy')

        cy.get('.govuk-error-summary')
          .should('contain.text', 'Title must be 230 characters or fewer')
          .should('contain.text', 'Details must be 255 characters or fewer')

        checkWelshPageContent('Enter Welsh test payment link details')
      })

      it('should handle Welsh reference field validation', () => {
        cy.visit(`${CREATE_PAYMENT_LINK_URL()}?language=cy`)
        fillWelshPaymentLinkForm('Welsh Payment Link')
        submitFormAndContinue()

        cy.get('input[value="yes"]').check()
        submitFormAndContinue()

        cy.url().should('include', REFERENCE_PAYMENT_LINK_URL())
        cy.get('.govuk-error-summary')
          .should('contain.text', 'Enter a name for the payment reference')
      })
    })

    describe('Welsh language with different account types', () => {
      it('should work correctly in Welsh test mode', () => {
        setupStubs('admin', 'test')
        cy.visit(`${CREATE_PAYMENT_LINK_URL('test')}?language=cy`)
        checkWelshPageContent('Enter Welsh test payment link details')
        cy.get('.govuk-back-link').should('have.attr', 'href', PAYMENT_LINKS_INDEX_URL('test'))
      })

      it('should work correctly in Welsh live mode', () => {
        setupStubs('admin', 'live')
        cy.visit(`${CREATE_PAYMENT_LINK_URL('live')}?language=cy`)
        checkWelshPageContent('Enter Welsh live payment link details')
        cy.get('.govuk-back-link').should('have.attr', 'href', PAYMENT_LINKS_INDEX_URL('live'))
      })
    })
  })

  describe('Different account types', () => {
    describe('Test mode', () => {
      beforeEach(() => {
        setupStubs('admin', 'test')
      })

      it('should work in test mode', () => {
        cy.visit(CREATE_PAYMENT_LINK_URL('test'))
        cy.get('h1').should('contain.text', 'Enter test payment link details')
        cy.get('.govuk-back-link').should('have.attr', 'href', PAYMENT_LINKS_INDEX_URL('test'))
      })
    })

    describe('Live mode', () => {
      beforeEach(() => {
        setupStubs('admin', 'live')
      })

      it('should work in live mode', () => {
        cy.visit(CREATE_PAYMENT_LINK_URL('live'))
        cy.get('h1').should('contain.text', 'Enter live payment link details')
        cy.get('.govuk-back-link').should('have.attr', 'href', PAYMENT_LINKS_INDEX_URL('live'))
      })
    })
  })

  describe('Navigation integration', () => {
    beforeEach(() => {
      setupStubs('admin', 'test')
    })

    it('should navigate correctly using back links', () => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({
          userExternalId: USER_EXTERNAL_ID,
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          serviceName: SERVICE_NAME,
          serviceExternalId: SERVICE_EXTERNAL_ID,
          role: ROLES.admin,
        }),
        gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, 'test', {
          gateway_account_id: GATEWAY_ACCOUNT_ID,
          type: 'test',
          payment_provider: SANDBOX,
        }),
        productStubs.getProductsByGatewayAccountIdAndTypeStub([], GATEWAY_ACCOUNT_ID, 'ADHOC'),
      ])

      cy.visit(PAYMENT_LINKS_INDEX_URL())
      cy.get(`a[href="${CREATE_PAYMENT_LINK_URL()}"]`).first().click()

      cy.url().should('include', CREATE_PAYMENT_LINK_URL())
      cy.get('h1').should('contain.text', 'Enter test payment link details')

      cy.get('.govuk-back-link').click()
      cy.url().should('include', PAYMENT_LINKS_INDEX_URL())
    })

    it('should handle direct access to reference page', () => {
      cy.visit(REFERENCE_PAYMENT_LINK_URL())

      cy.get('h1').should('contain.text', 'Will your users already have a payment reference?')
    })
  })
})
