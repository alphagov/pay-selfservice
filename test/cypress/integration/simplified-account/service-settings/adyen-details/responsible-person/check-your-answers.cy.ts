import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { getUser } from '@test/cypress/stubs/simplified-account/user-stubs'
import * as GatewayAccountStubs from '@test/cypress/stubs/simplified-account/gateway-account-stubs'
import { checkServiceNavigation } from '@test/cypress/integration/simplified-account/common/assertions'
import { AdyenAccountSetupFixture } from '@test/fixtures/gateway-account/adyen-account-setup.fixture'
import { CredentialFixture } from '@test/fixtures/gateway-account/credential.fixture'
import * as AdyenPspStubs from '@test/cypress/stubs/simplified-account/adyen-psp-stubs'

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 12
const ADYEN_CREDENTIAL_EXTERNAL_ID = 'adyen-credential-123-abc'
const ORGANISATION_LEGAL_ENTITY_ID = 'LE_ORG_123'

const TASK_LIST_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-adyen`
const RESPONSIBLE_PERSON_DETAILS_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/responsible-person/details`
const RESPONSIBLE_PERSON_ADDRESS_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/responsible-person/address`
const RESPONSIBLE_PERSON_CONTACT_DETAILS_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/responsible-person/contact-details`
const RESPONSIBLE_PERSON_REVIEW_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/responsible-person/check-your-answers`

const gatewayAccountFixture = GatewayAccountFixture.forSwitchingPsp(
  PaymentProvider.STRIPE,
  PaymentProvider.ADYEN,
  [],
  [
    {
      externalId: ADYEN_CREDENTIAL_EXTERNAL_ID,
      credentials: CredentialFixture.forAdyen({ legalEntityId: ORGANISATION_LEGAL_ENTITY_ID }),
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

const setStubs = (additionalStubs: object[] = []) => {
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
      'responsible_person'
    ).success(),
    ...additionalStubs,
  ])
}

const fromReviewQueryString = '?fromReview=true'

describe(`Responsible person - check your answers`, () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('for a service that is migrating to adyen', () => {
    describe('when navigating to the page directly', () => {
      beforeEach(() => {
        setStubs()
      })

      it('should redirect to the migration tasks page', () => {
        setStubs()

        cy.visit(RESPONSIBLE_PERSON_REVIEW_PATH)

        cy.location('pathname').should('eq', TASK_LIST_PATH)
      })
    })

    describe('when navigating from the contact details with fields populated', () => {
      beforeEach(() => {
        setStubs()
        cy.visit(RESPONSIBLE_PERSON_DETAILS_PATH)
        cy.get('#first-name').type('John')
        cy.get('#last-name').type('McClane')

        cy.get('#dob-day').type('25')
        cy.get('#dob-month').type('12')
        cy.get('#dob-year').type('1960')

        cy.get('#responsible-person-details-submit').click()

        cy.get('#address-line1').type('7 Green Lane')
        cy.get('#address-line2').type('Greenfield')
        cy.get('#address-city').type('Greencity')
        cy.get('#address-postcode').type('GR3 3NY')

        cy.get('#responsible-person-address-submit').click()

        cy.get('#telephone-number').type('07700 700900')
        cy.get('#email').type('sam@example.com')

        cy.get('#responsible-person-contact-details-submit').click()
      })

      it('accessibility check', () => {
        setStubs()
        cy.a11yCheck()
      })

      it('should display correct page content', () => {
        setStubs()

        checkServiceNavigation('Switch provider to Adyen now', TASK_LIST_PATH)
        cy.get('h1').should('contain.text', `Check your answers`)
        cy.get('.govuk-back-link').should(
          'have.attr',
          'href',
          RESPONSIBLE_PERSON_CONTACT_DETAILS_PATH + fromReviewQueryString
        )

        cy.get(`[data-cy='edit-responsible-person-details']`).should(
          'have.attr',
          'href',
          RESPONSIBLE_PERSON_DETAILS_PATH + fromReviewQueryString
        )
        cy.get(`[data-cy='edit-responsible-person-address']`).should(
          'have.attr',
          'href',
          RESPONSIBLE_PERSON_ADDRESS_PATH + fromReviewQueryString
        )
        cy.get(`[data-cy='edit-responsible-person-contact-details']`).should(
          'have.attr',
          'href',
          RESPONSIBLE_PERSON_CONTACT_DETAILS_PATH + fromReviewQueryString
        )
      })

      it('should redirect to the migration task page when confirm and continue is pressed', () => {
        setStubs([
          AdyenPspStubs.createLegalEntity().success({ id: 'LE_PERSON_456' }),
          AdyenPspStubs.getLegalEntity(ORGANISATION_LEGAL_ENTITY_ID).success({
            id: ORGANISATION_LEGAL_ENTITY_ID,
            entityAssociations: [],
          }),
          AdyenPspStubs.updateLegalEntity(ORGANISATION_LEGAL_ENTITY_ID).success({ id: ORGANISATION_LEGAL_ENTITY_ID }),
          AdyenPspStubs.getTermsOfService(ORGANISATION_LEGAL_ENTITY_ID).success({
            termsOfServiceDocumentId: 'terms-of-service-document-id',
          }),
        ])
        cy.get('#responsible-person-confirm').click()

        cy.location('pathname').should('eq', TASK_LIST_PATH)
      })
    })
  })

  describe('for a service not migrating to Adyen', () => {
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

      it('should return a 404 when attempting to view responsible review page', () => {
        cy.request({
          url: RESPONSIBLE_PERSON_REVIEW_PATH,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(404)
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

      it('should return a 404 when attempting view responsible review page', () => {
        cy.request({
          url: RESPONSIBLE_PERSON_REVIEW_PATH,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(404)
        })
      })
    })
  })
})
