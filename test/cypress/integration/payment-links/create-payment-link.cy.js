const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const tokenStubs = require('../../stubs/token-stubs')
const productStubs = require('../../stubs/products-stubs')
const userExternalId = 'a-user-id'
const gatewayAccountId = 42
const gatewayAccountExternalId = 'a-valid-account-id'
const serviceExternalId = 'a-valid-service-id'
const serviceName = {
  en: 'pay for something',
  cy: 'talu am rywbeth'
}

function assertCreatePaymentLinkNavItemBold () {
  cy.get('[data-cy=create-payment-link-nav-item]').should('have.class', 'govuk-!-font-weight-bold')
  cy.get('[data-cy=manage-payment-links-nav-item]').should('not.have.class', 'govuk-!-font-weight-bold')
}

function assertCancelLinkHref () {
  cy.get('[data-cy=cancel-link').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/create-payment-link`)
}

function assertCommonPageElements () {
  assertCreatePaymentLinkNavItemBold()
  assertCancelLinkHref()
}

describe('The create payment link start page for a Worldpay MOTO account', () => {
  it('Should display warning', () => {
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceExternalId, serviceName }),
      gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
        gatewayAccountId,
        gatewayAccountExternalId,
        type: 'test',
        paymentProvider: 'worldpay',
        gatewayAccountCredentials: [
          {
            gateway_account_id: gatewayAccountId,
            payment_provider: 'worldpay',
            state: 'ACTIVE',
            credentials: {
              merchant_id: 'worldpay-merchant-code-ending-with-MOTO'
            }
          }
        ]
      })
    ])

    cy.setEncryptedCookies(userExternalId)
    cy.visit(`/account/${gatewayAccountExternalId}/create-payment-link`)
    cy.percySnapshot()
    cy.get('.govuk-warning-text').should('contain', 'Your service is set up to only use MOTO payments.')
  })
})

describe('The create payment link flow', () => {
  beforeEach(() => {
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceExternalId, serviceName }),
      gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
        gatewayAccountId,
        gatewayAccountExternalId,
        type: 'test',
        paymentProvider: 'worldpay'
      }),
      tokenStubs.postCreateTokenForAccountSuccess({ gatewayAccountId }),
      productStubs.postCreateProductSuccess(),
      productStubs.getProductsByGatewayAccountIdAndTypeStub([{ name: 'A payment link' }], gatewayAccountId, 'ADHOC')
    ])
  })

  describe('A English payment link', () => {
    const name = 'Pay for a parking permit'
    const description = 'Finish your application'
    const referenceName = 'invoice number'
    const referenceHint = 'Found in the email'
    const amount = 10

    it('Should allow creating an english payment link', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/create-payment-link`)
      cy.percySnapshot()

      cy.get('h1').should('contain', 'Create a payment link')
      cy.get('.govuk-warning-text').should('not.exist')
      cy.get('a#create-payment-link').should('exist')
      cy.get(`a[href="/account/${gatewayAccountExternalId}/create-payment-link/information?language=cy"]`).should('exist')
        .should('contain', 'Create a payment link in Welsh')

      assertCreatePaymentLinkNavItemBold()

      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/create-payment-link`)
      cy.percySnapshot()

      cy.get('a#create-payment-link').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/information`)
      })

      assertCommonPageElements()

      // Payment link information page
      cy.get('h1').should('contain', 'Set payment link information')

      cy.get('input#payment-link-title').should('exist')
      cy.get('input#payment-link-title').should('have.attr', 'lang', 'en')
      cy.get('label[for="payment-link-title"]').should('contain', 'Title')
      cy.get('#payment-link-title-hint')
        .should('contain', 'For example, “Pay for a parking permit”')

      cy.get('textarea#payment-link-description').should('exist')
      cy.get('textarea#payment-link-description').should('have.attr', 'lang', 'en')
      cy.get('label[for="payment-link-description"]').should('exist')
      cy.get('#payment-link-description-hint')
        .should('contain', 'Give your users more information.')

      cy.get('div#payment-link-title-confirmation').should('not.exist')

      cy.get('button').contains('Continue').should('exist')

      cy.get('#payment-link-example').should('exist').within(() => {
        cy.get('h3').should('contain', 'Example of what the user will see')
        cy.get('img').should('exist')
      })

      cy.get('input#payment-link-title').type(name)
      cy.get('textarea#payment-link-description').type(description)

      cy.get('div#payment-link-title-confirmation').should('exist').within(() => {
        cy.get('h3').should('contain', 'The website address for this payment link will look like:')
        cy.contains('/pay-for-something/pay-for-parking-permit')
      })

      cy.get('button').contains('Continue').click()

      // Reference page
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/reference`)
      })
      assertCommonPageElements()

      cy.get('h1').should('contain', 'Do your users already have a payment reference?')
      cy.get('#reference-type-group-hint').should('contain', `You can use numbers or words in your payment reference. For example, you can include the applicant’s name or an existing reference number.`)

      cy.get('input[type=radio]#reference-type-custom').should('exist')
      cy.get('input[type=radio]#reference-type-standard').should('exist')
      cy.get('input[type=radio]#reference-type-custom').click()

      cy.get('input#reference-label').should('exist')
      cy.get('input#reference-label').should('have.attr', 'lang', 'en')
      cy.get('#reference-label-hint')
        .should('contain', 'For example, “invoice number”')

      cy.get('textarea#reference-hint-text').should('exist')
      cy.get('textarea#reference-hint-text').should('have.attr', 'lang', 'en')
      cy.get('#reference-hint-text-hint')
        .should('contain', 'Tell users what the')

      cy.get('button').contains('Continue').should('exist')

      cy.get('#payment-link-example').should('exist').within(() => {
        cy.get('h3').should('contain', 'Example of what the user will see')
        cy.get('img').should('exist')
      })

      cy.get('input#reference-label').type(referenceName)
      cy.get('textarea#reference-hint-text').type(referenceHint)
      cy.get('button').contains('Continue').click()

      // Amount page
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/amount`)
      })
      assertCommonPageElements()

      cy.get('input[type=radio]#amount-type-fixed').should('exist')
      cy.get('input[type=radio]#amount-type-variable').should('exist')
      cy.get('input#payment-amount').should('exist')
      cy.get('button').contains('Continue').should('exist')

      cy.get('#payment-link-example').should('exist').within(() => {
        cy.get('h3').should('contain', 'Example of what the user will see')
        cy.get('img').should('exist')
      })

      cy.get('input[type=radio]#amount-type-fixed').click()
      cy.get('input#payment-amount').type(amount)
      cy.get('button').contains('Continue').click()

      // Review page
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/review`)
      })
      assertCommonPageElements()

      cy.get('.govuk-summary-list').find('.govuk-summary-list__row').eq(0).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'Title')
        cy.get('.govuk-summary-list__value').should('contain', name)
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/create-payment-link/information?field=payment-link-title`)
      })
      cy.get('.govuk-summary-list').find('.govuk-summary-list__row').eq(1).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'More details')
        cy.get('.govuk-summary-list__value').should('contain', description)
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/create-payment-link/information?field=payment-link-description`)
      })
      cy.get('.govuk-summary-list').find('.govuk-summary-list__row').eq(2).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'Reference number')
        cy.get('.govuk-summary-list__value').should('contain', referenceName)
        cy.get('.govuk-summary-list__value').get('span').should('contain', referenceHint)
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/create-payment-link/reference?change=true`)
      })
      cy.get('.govuk-summary-list').find('.govuk-summary-list__row').eq(3).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'Payment amount')
        cy.get('.govuk-summary-list__value').should('contain', '£10.00')
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/create-payment-link/amount`)
      })

      cy.get('button').should('exist').should('contain', 'Create payment link')

      cy.get('a#add-reporting-column').should('exist').should('contain', 'Add a reporting column')
      cy.get('a#add-reporting-column').click()
      cy.location().should((location) => expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/add-reporting-column`))

      // Add a reporting column
      cy.log('Enter invalid values for reporting column and check an error is displayed')
      cy.get('button#submit-reporting-column').click()
      cy.location().should((location) => expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/add-reporting-column`))
      cy.get('div.govuk-error-summary').should('exist')

      cy.log('Enter valid values')
      cy.get('input#metadata-column-header').type('key')
      cy.get('input#metadata-cell-value').type('value')
      cy.get('button#submit-reporting-column').click()
      cy.location().should((location) => expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/review`))

      cy.get('#reporting-columns-summary').find('.govuk-summary-list__row').should('have.length', 1)

      cy.get('#reporting-columns-summary').find('.govuk-summary-list__row').eq(0).should('exist').within(() => {
        cy.get('.govuk-summary-list__key').should('contain', 'key')
        cy.get('.govuk-summary-list__value').should('contain', 'value')
        cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/create-payment-link/add-reporting-column/key`)
      })

      cy.log('Click change for the payment link information')
      cy.get('dl').find('.govuk-summary-list__row').eq(0).find('.govuk-summary-list__actions a').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/information`)
      })
      assertCommonPageElements()

      cy.get('input#payment-link-title').should('have.value', name)
      cy.get('textarea#payment-link-description').should('have.value', description)

      cy.get('#payment-link-title-hint')
        .should('contain', 'For example, “Pay for a parking permit”')

      cy.log('Click continue to go back to review page')
      cy.get('button').contains('Continue').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/review`)
      })

      cy.get('.govuk-notification-banner--success').should('contain', 'The details have been updated')

      // Click button to create payment link
      cy.get('button').contains('Create payment link').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/manage`)
      })

      cy.get('.govuk-notification-banner--success').should('contain', 'Your Payment link is ready to test')
      cy.get('.govuk-notification-banner--success a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live`)
    })
  })

  describe('A Welsh payment link', () => {
    const name = 'Talu am drwydded barcio'
    const description = 'Disgrifiad yn Gymraeg'
    const referenceName = 'rhif anfoneb'
    const referenceHint = 'mewn e-bost'
    const amount = 10

    it('should have instructions for creating a Welsh payment link', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/create-payment-link`)
      cy.percySnapshot()

      cy.get(`a[href="/account/${gatewayAccountExternalId}/create-payment-link/information?language=cy"]`).click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/information`)
      })

      // Information page
      cy.get('h1').should('contain', 'Set Welsh payment link information')

      cy.get('input#payment-link-title').should('exist')
      cy.get('input#payment-link-title').should('have.attr', 'lang', 'cy')
      cy.get('label[for="payment-link-title"]').should('contain', 'Welsh title')
      cy.get('#payment-link-title-hint')
        .should('contain', 'For example, “Talu am drwydded barcio”')

      cy.get('textarea#payment-link-description').should('exist')
      cy.get('textarea#payment-link-description').should('have.attr', 'lang', 'cy')
      cy.get('label[for="payment-link-description"]').should('exist')
      cy.get('#payment-link-description-hint')
        .should('contain', 'Give your users more information in Welsh')

      cy.get('button').contains('Continue').should('exist')

      cy.get('#payment-link-example').should('not.exist')

      cy.get('input#payment-link-title').type(name)
      cy.get('textarea#payment-link-description').type(description)

      cy.get('div#payment-link-title-confirmation').should('exist').within(() => {
        cy.get('h3').should('contain', 'The website address for this payment link will look like:')
        cy.contains('/talu-am-rywbeth/talu-am-drwydded-barcio')
      })

      cy.get('button').contains('Continue').click()

      // Reference page
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/reference`)
      })

      cy.get('h1').should('contain', 'Do your users already have a payment reference?')
      cy.get('#reference-type-group-hint').should('contain', `You can use numbers or words in your payment reference. For example, you can include the applicant’s name or an existing reference number.`)

      cy.get('input[type=radio]#reference-type-custom').should('exist')
      cy.get('input[type=radio]#reference-type-custom').click()

      cy.get('input#reference-label').should('exist')
      cy.get('input#reference-label').should('have.attr', 'lang', 'cy')
      cy.get('#reference-label-hint')
        .should('contain', 'For example, “rhif anfoneb”')

      cy.get('textarea#reference-hint-text').should('exist')
      cy.get('textarea#reference-hint-text').should('have.attr', 'lang', 'cy')
      cy.get('#reference-hint-text-hint')
        .should('contain', 'Explain in Welsh')

      cy.get('button').contains('Continue').should('exist')

      cy.get('#payment-link-example').should('not.exist')

      cy.get('input#reference-label').type(referenceName)
      cy.get('textarea#reference-hint-text').type(referenceHint)
      cy.get('button').contains('Continue').click()

      // Amount page
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/amount`)
      })

      cy.title().should('eq', `Is the payment for a fixed amount? - Create a payment link - ${serviceName.en} Worldpay test - GOV.UK Pay`)

      cy.get('input[type=radio]#amount-type-fixed').should('exist')
      cy.get('input[type=radio]#amount-type-variable').should('exist')
      cy.get('input#payment-amount').should('exist')
      cy.get('button').contains('Continue').should('exist')

      cy.get('#payment-link-example').should('not.exist')

      cy.get('input[type=radio]#amount-type-fixed').click()
      cy.get('input#payment-amount').type(amount)
      cy.get('button').contains('Continue').click()

      // Review page
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/review`)
      })

      cy.get('button').should('exist').should('contain', 'Create Welsh payment link')

      // Submit the payment link
      cy.get('nav').contains('Create a payment link').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link`)
      })

      cy.log('Check that for the next English payment link we try to make, the session has been cleared and there are instructions for creating a payment link that is in English')
      cy.get('a#create-payment-link').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/create-payment-link/information`)
      })

      cy.get('h1').should('contain', 'Set payment link information')

      cy.get('input#payment-link-title').should('be.empty')
      cy.get('textarea#payment-link-description').should('be.empty')
    })
  })
})
