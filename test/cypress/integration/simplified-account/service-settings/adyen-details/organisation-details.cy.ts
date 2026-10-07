import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { getUser } from '@test/cypress/stubs/simplified-account/user-stubs'
import * as GatewayAccountStubs from '@test/cypress/stubs/simplified-account/gateway-account-stubs'
import { checkServiceNavigation } from '@test/cypress/integration/simplified-account/common/assertions'
import { AdyenAccountSetupFixture } from '@test/fixtures/gateway-account/adyen-account-setup.fixture'
import * as AdyenStubs from '@test/cypress/stubs/simplified-account/adyen-psp-stubs'

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 12
const ADYEN_CREDENTIAL_EXTERNAL_ID = 'adyen-credential-123-abc'

const ORGANISATION_DETAILS_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/organisation-details/details`
const COMPANY_REGISTRATION_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/organisation-details/company-registration-number`
const VAT_REGISTRATION_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/organisation-details/vat-number`
const TAKING_PAYMENTS_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/organisation-details/reason-for-taking-payments`
const TASK_LIST_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-adyen`

const gatewayAccountFixture = GatewayAccountFixture.forSwitchingPsp(
  PaymentProvider.STRIPE,
  PaymentProvider.ADYEN,
  [],
  [
    {
      externalId: ADYEN_CREDENTIAL_EXTERNAL_ID,
    },
  ],
  {
    id: GATEWAY_ACCOUNT_ID,
    type: LIVE_ACCOUNT_TYPE,
    serviceId: SERVICE_EXTERNAL_ID,
  }
)
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
  gatewayAccountIds: [`${gatewayAccountFixture.id}`],
})
const userFixture = UserFixture.asServiceAdmin([serviceFixture], { externalId: USER_EXTERNAL_ID })

const adyenAccountSetup = AdyenAccountSetupFixture.NotStarted({
  serviceExternalId: SERVICE_EXTERNAL_ID,
  credentialExternalId: ADYEN_CREDENTIAL_EXTERNAL_ID,
})

const setStubs = (additionalStubs = []) => {
  cy.task('setupStubs', [
    getUser(USER_EXTERNAL_ID).success(userFixture),
    GatewayAccountStubs.getByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE).success(
      gatewayAccountFixture
    ),
    GatewayAccountStubs.getAdyenSetupTasks(
      SERVICE_EXTERNAL_ID,
      LIVE_ACCOUNT_TYPE,
      ADYEN_CREDENTIAL_EXTERNAL_ID,
      adyenAccountSetup.toAdyenAccountSetupData().tasks
    ).success(),
    GatewayAccountStubs.patchAdyenAccountTask(
      SERVICE_EXTERNAL_ID,
      LIVE_ACCOUNT_TYPE,
      ADYEN_CREDENTIAL_EXTERNAL_ID,
      'organisation_details'
    ).success(),
    AdyenStubs.createLegalEntity().success({ id: 'legal-entity-123' }),
    ...additionalStubs,
  ])
}

describe(`Organisation details, company registration and VAT registration`, () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('for a service that is migrating to adyen', () => {
    it('should walk through organisation details, company registration and VAT registration in sequence', () => {
      setStubs()

      // organisation details
      cy.visit(ORGANISATION_DETAILS_PATH)
      cy.a11yCheck()

      checkServiceNavigation('Switch provider to Adyen now', TASK_LIST_PATH)
      cy.get('h1').should('contain.text', 'Organisation details')
      cy.get('.govuk-back-link').should('have.attr', 'href', TASK_LIST_PATH)

      cy.get('#organisation-name').should('exist')
      cy.get('#address-line1').should('exist')
      cy.get('#address-line2').should('exist')
      cy.get('#address-city').should('exist')
      cy.get('#address-country').should('exist')
      cy.get('#address-postcode').should('exist')
      cy.get('#has-company-registration-number').should('exist')

      cy.get('#organisation-name').type('Test Organisation')
      cy.get('#address-line1').type('1 Test Street')
      cy.get('#address-city').type('Testville')
      cy.get('#address-postcode').type('T3 5TT')
      cy.get('#has-company-registration-number').check('true')
      cy.get('#organisation-details-submit').click()

      // company registration number
      cy.location('pathname').should('eq', COMPANY_REGISTRATION_PATH)
      cy.a11yCheck()

      cy.get('h1').should('contain.text', 'Tell us your company registration number')
      cy.get('.govuk-back-link').should('have.attr', 'href', ORGANISATION_DETAILS_PATH)
      cy.get('#company-registration-number').should('exist')

      cy.get('#company-registration-number').type('12345678')
      cy.get('#company-registration-number-submit').click()

      // VAT registration number
      cy.location('pathname').should('eq', VAT_REGISTRATION_PATH)
      cy.a11yCheck()
      cy.get('h1').should('contain.text', 'Tell us your VAT registration number')
      cy.get('.govuk-back-link').should('have.attr', 'href', COMPANY_REGISTRATION_PATH)
      cy.get('#vat-registration-number').should('exist')

      cy.get('#vat-registration-number').type('GB123456789')
      cy.get('#vat-registration-number-submit').click()

      //// sad path
      cy.location('pathname').should('eq', TAKING_PAYMENTS_PATH)
      cy.a11yCheck()
      cy.get('#reason-for-taking-payments-submit').click()
      cy.get('.govuk-error-summary')
        .should('be.visible')
        .and('contain', 'There is a problem')
        .and('contain', 'You must make a selection')
      cy.get('#takingPaymentsFor-error').should('be.visible').and('contain', 'You must make a selection')

      //// happy path
      cy.get('[data-cy="radio-government-activities"]').check()
      cy.get('#reason-for-taking-payments-submit').click()

      cy.location('pathname').should('eq', TASK_LIST_PATH)
    })
  })

  describe('for a service not migrating to Adyen', () => {
    const paths = [ORGANISATION_DETAILS_PATH, COMPANY_REGISTRATION_PATH, VAT_REGISTRATION_PATH]

    describe('where the service is switching to a different PSP', () => {
      const WORLDPAY_CREDENTIAL_EXTERNAL_ID = 'worldpay-credential-123-abc'

      beforeEach(() => {
        cy.task('clearStubs')

        const gatewayAccountSwitchingToWorldpay = GatewayAccountFixture.forSwitchingPsp(
          PaymentProvider.STRIPE,
          PaymentProvider.WORLDPAY,
          [],
          [
            {
              externalId: WORLDPAY_CREDENTIAL_EXTERNAL_ID,
            },
          ],
          {
            id: GATEWAY_ACCOUNT_ID,
            serviceId: SERVICE_EXTERNAL_ID,
          }
        )
        const serviceFixture = new ServiceFixture({
          externalId: SERVICE_EXTERNAL_ID,
          gatewayAccountIds: [`${gatewayAccountSwitchingToWorldpay.id}`],
          currentGoLiveStage: 'LIVE',
        })
        const userFixture = UserFixture.asServiceAdmin([serviceFixture], { externalId: USER_EXTERNAL_ID })
        cy.task('setupStubs', [
          getUser(USER_EXTERNAL_ID).success(userFixture),
          GatewayAccountStubs.getByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE).success(
            gatewayAccountSwitchingToWorldpay
          ),
        ])
      })

      it('should return a 404 for all three pages', () => {
        paths.forEach((path) => {
          cy.request({
            url: path,
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(404)
          })
        })
      })
    })

    describe('where the service is not switching PSP', () => {
      beforeEach(() => {
        cy.task('clearStubs')
        const adyenGatewayAccount = GatewayAccountFixture.forAdyen({
          type: LIVE_ACCOUNT_TYPE,
        })

        const serviceFixture = new ServiceFixture({
          externalId: SERVICE_EXTERNAL_ID,
          gatewayAccountIds: [`${adyenGatewayAccount.id}`],
          currentGoLiveStage: 'LIVE',
        })
        const userFixture = UserFixture.asServiceAdmin([serviceFixture], { externalId: USER_EXTERNAL_ID })

        cy.task('setupStubs', [
          getUser(USER_EXTERNAL_ID).success(userFixture),
          GatewayAccountStubs.getByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE).success(
            adyenGatewayAccount
          ),
        ])
      })

      it('should return a 404 for all three pages', () => {
        paths.forEach((path) => {
          cy.request({
            url: path,
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(404)
          })
        })
      })
    })
  })
})
