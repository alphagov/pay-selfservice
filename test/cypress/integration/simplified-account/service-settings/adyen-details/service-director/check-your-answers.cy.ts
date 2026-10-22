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
const SERVICE_DIRECTOR_DETAILS_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/service-director/details`
const SERVICE_DIRECTOR_ADDRESS_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/service-director/address`
const SERVICE_DIRECTOR_ANSWERS_PATH = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/adyen-details/${ADYEN_CREDENTIAL_EXTERNAL_ID}/service-director/check-your-answers`

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
      'director'
    ).success(),
    ...additionalStubs,
  ])
}

const fromReviewQueryString = '?fromReview=true'

describe(`Service director - check your answers`, () => {
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

        cy.visit(SERVICE_DIRECTOR_ANSWERS_PATH)

        cy.location('pathname').should('eq', TASK_LIST_PATH)
      })
    })

    describe('when navigating from the address page with fields populated', () => {
      beforeEach(() => {
        setStubs()
        cy.visit(SERVICE_DIRECTOR_DETAILS_PATH)
        cy.get('#first-name').type('John')
        cy.get('#last-name').type('McClane')

        cy.get('#dob-day').type('25')
        cy.get('#dob-month').type('12')
        cy.get('#dob-year').type('1960')

        cy.get('#email').type('yippeekiyay@example.gov.uk')

        cy.get('#service-director-details-submit').click()

        cy.get('#address-line1').type('7 Green Lane')
        cy.get('#address-line2').type('Greenfield')
        cy.get('#address-city').type('Greencity')
        cy.get('#address-postcode').type('GR3 3NY')

        cy.get('#service-director-address-submit').click()
      })

      it('accessibility check', () => {
        setStubs()
        cy.a11yCheck()
      })

      it('should display correct page content', () => {
        setStubs()

        checkServiceNavigation('Switch provider to Adyen now', TASK_LIST_PATH)
        cy.get('h1').should('contain.text', `Check your answers`)
        cy.get('.govuk-back-link').should('have.attr', 'href', SERVICE_DIRECTOR_ADDRESS_PATH + fromReviewQueryString)

        cy.get(`[data-cy='edit-director-details']`).should(
          'have.attr',
          'href',
          SERVICE_DIRECTOR_DETAILS_PATH + fromReviewQueryString
        )
        cy.get(`[data-cy='edit-director-address']`).should(
          'have.attr',
          'href',
          SERVICE_DIRECTOR_ADDRESS_PATH + fromReviewQueryString
        )
      })

      it('should redirect to the migration task page when continue is pressed', () => {
        setStubs([
          AdyenPspStubs.createLegalEntity().success({ id: 'LE_PERSON_456' }),
          AdyenPspStubs.getLegalEntity(ORGANISATION_LEGAL_ENTITY_ID).success({
            id: ORGANISATION_LEGAL_ENTITY_ID,
            entityAssociations: [],
          }),
          AdyenPspStubs.updateLegalEntity(ORGANISATION_LEGAL_ENTITY_ID).success({ id: ORGANISATION_LEGAL_ENTITY_ID }),
          AdyenPspStubs.generatePciQuestionnaire(ORGANISATION_LEGAL_ENTITY_ID).success({
            content: 'base64-encoded-pci-questionnaire',
            language: 'en',
            pciTemplateReferences: ['PCI_TEMPLATE_1'],
          }),
          AdyenPspStubs.signPciQuestionnaire(ORGANISATION_LEGAL_ENTITY_ID).success({
            pciQuestionnaireIds: ['PCIQ_123'],
            signedBy: 'LE_PERSON_456',
          }),
        ])

        cy.get('#service-director-confirm').click()

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

      it('should return a 404 when attempting to view check your answers page', () => {
        cy.request({
          url: SERVICE_DIRECTOR_ANSWERS_PATH,
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

      it('should return a 404 when attempting to view check your answers page', () => {
        cy.request({
          url: SERVICE_DIRECTOR_ANSWERS_PATH,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(404)
        })
      })
    })
  })
})
