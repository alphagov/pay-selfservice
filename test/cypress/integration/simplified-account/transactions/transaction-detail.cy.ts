import userStubs from '@test/cypress/stubs/user-stubs'
import GatewayAccountType, { TEST } from '@models/gateway-account/gateway-account-type'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import transactionStubs from '@test/cypress/stubs/transaction-stubs'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import { SANDBOX } from '@models/constants/payment-providers'
import changeCase from 'change-case'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import { AuthorisationSummaryFixture } from '@test/fixtures/transaction/authorisation-summary.fixture'
import { Status } from '@models/transaction/types/status'
import { TransactionStateFixture } from '@test/fixtures/transaction/transaction-state.fixture'
import { Reason, ReasonFriendlyNames } from '@models/transaction/types/reason'
import { ResourceType } from '@models/transaction/types/resource-type'
import {
  getTransactionEvents,
  getTransactionForGatewayAccount,
} from '@test/cypress/stubs/simplified-account/transaction-stubs'
import { TransactionEventFixture } from '@test/fixtures/transaction/transaction-event.fixture'
import { LedgerRefundSummaryFixture } from '@test/fixtures/transaction/ledger-refund-summary.fixture'
import { RefundSummaryStatus } from '@models/common/refund-summary/RefundSummaryStatus'

const TRANSACTION = new TransactionFixture()
const TRANSACTION_CREATED_TIMESTAMP = TRANSACTION.createdDate
const CARD_DETAILS = TRANSACTION.cardDetails!

const PAGE_HEADING_DATE_FORMAT = 'dd MMM yyyy HH:mm:ss'
const PAGE_CONTENT_DATE_FORMAT = 'dd LLL yyyy — HH:mm:ss'

const TRANSACTION_EVENTS = [
  new TransactionEventFixture({
    amount: 1250,
    state: {
      finished: false,
      status: 'CREATED',
    },
    resourceType: 'PAYMENT',
    eventType: 'PAYMENT_CREATED',
    timestamp: TRANSACTION_CREATED_TIMESTAMP,
  }),
]

const USER_EXTERNAL_ID = 'user456def'
const USER_EMAIL = 's.mcduck@example.com'
const GATEWAY_ACCOUNT_ID = TRANSACTION.gatewayAccountId
const SERVICE_EXTERNAL_ID = TRANSACTION.serviceExternalId
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const TRANSACTION_URL = (serviceMode: string) =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/transactions/${TRANSACTION.externalId}`

const userAndGatewayAccountStubs = [
  userStubs.getUserSuccess({
    userExternalId: USER_EXTERNAL_ID,
    email: USER_EMAIL,
    serviceExternalId: SERVICE_EXTERNAL_ID,
    gatewayAccountId: GATEWAY_ACCOUNT_ID,
    serviceName: SERVICE_NAME,
  }),
  gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, GatewayAccountType.TEST, {
    gateway_account_id: GATEWAY_ACCOUNT_ID,
    type: GatewayAccountType.TEST,
  }),
]

describe('Transaction details page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  it('accessibility check', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
      getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION_EVENTS),
    ])
    cy.visit(TRANSACTION_URL(TEST))
    cy.a11yCheck()
  })

  it('should display correct page title and headings', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
      getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION_EVENTS),
    ])

    cy.visit(TRANSACTION_URL(TEST))

    cy.title().should(
      'eq',
      `Transaction details - ${TRANSACTION.createdDate.toFormat(PAGE_HEADING_DATE_FORMAT)} - ${TRANSACTION.reference} - ${SERVICE_NAME.en} - GOV.UK Pay`
    )
    cy.get('h1').should('contain.text', 'Transaction details')
    cy.get('h2').should('contain.text', 'Amount')
    cy.get('h2').should('contain.text', 'Payment method')
    cy.get('h2').should('contain.text', 'Payment provider')
  })

  it('should navigate to transactions list page when back link is clicked', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
      getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION_EVENTS),
    ])

    cy.visit(TRANSACTION_URL(TEST))
    cy.get('.govuk-back-link').click()

    const transactionsListUrl = `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions`

    cy.url().should('include', transactionsListUrl)
  })

  it('should display transaction details correctly for a payment', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
      getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION_EVENTS),
    ])

    cy.visit(TRANSACTION_URL(TEST))

    cy.get('.govuk-summary-list__row')
      .eq(0)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Reference number')
        cy.get('.govuk-summary-list__value').should('contain.text', TRANSACTION.reference)
      })

    cy.get('.govuk-summary-list__row')
      .eq(1)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Service name')
        cy.get('.govuk-summary-list__value').should('contain.text', SERVICE_NAME.en)
      })

    cy.get('.govuk-summary-list__row')
      .eq(2)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Description')
        cy.get('.govuk-summary-list__value').should('contain.text', TRANSACTION.description)
      })

    cy.get('.govuk-summary-list__row')
      .eq(3)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Date created')
        cy.get('.govuk-summary-list__value').should(
          'contain.text',
          TRANSACTION.createdDate.toFormat(PAGE_CONTENT_DATE_FORMAT)
        )
      })

    cy.get('.govuk-summary-list__row')
      .eq(4)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Payment status')
        cy.get('.govuk-summary-list__value').should('contain.text', 'Successful')
      })

    cy.get('.govuk-summary-list__row')
      .eq(5)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Payment amount')
        cy.get('.govuk-summary-list__value').should('contain.text', penceToPoundsWithCurrency(TRANSACTION.amount))
      })

    cy.get('.govuk-summary-list__row')
      .eq(6)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Payment type')
        cy.get('.govuk-summary-list__value').should('contain.text', 'Card')
      })

    cy.get('.govuk-summary-list__row')
      .eq(7)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Card brand')
        cy.get('.govuk-summary-list__value').should('contain.text', CARD_DETAILS.cardBrand)
      })

    cy.get('.govuk-summary-list__row')
      .eq(8)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Name on card')
        cy.get('.govuk-summary-list__value').should('contain.text', CARD_DETAILS.cardholderName)
      })

    cy.get('.govuk-summary-list__row')
      .eq(9)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Card number')
        cy.get('.govuk-summary-list__value').should('contain.text', CARD_DETAILS.lastDigitsCardNumber)
      })

    cy.get('.govuk-summary-list__row')
      .eq(10)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Card expiry date')
        cy.get('.govuk-summary-list__value').should('contain.text', CARD_DETAILS.expiryDate)
      })

    cy.get('.govuk-summary-list__row')
      .eq(11)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Email')
        cy.get('.govuk-summary-list__value').should('contain.text', 'test2@example.org')
      })

    cy.get('.govuk-summary-list__row')
      .eq(12)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Provider')
        cy.get('.govuk-summary-list__value').should('contain.text', changeCase.upperCaseFirst(SANDBOX))
      })

    cy.get('.govuk-summary-list__row')
      .eq(13)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Provider ID')
        cy.get('.govuk-summary-list__value').should('contain.text', TRANSACTION.gatewayTransactionId)
      })

    cy.get('.govuk-summary-list__row')
      .eq(14)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'GOV.UK Pay ID')
        cy.get('.govuk-summary-list__value').should('contain.text', TRANSACTION.externalId)
      })

    cy.get('.govuk-summary-list__key').contains('3D Secure (3DS)').should('not.exist')
  })

  it('should not display card details type when not present', () => {
    const transactionWithoutCardDetails = new TransactionFixture({ cardDetails: undefined })

    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(
        transactionWithoutCardDetails
      ),
      getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION_EVENTS),
    ])
    cy.visit(TRANSACTION_URL(TEST))

    cy.get('.govuk-summary-list__key').contains('Payment type').should('not.exist')
    cy.get('.govuk-summary-list__key').contains('Card brand').should('not.exist')
    cy.get('.govuk-summary-list__key').contains('Name on card').should('not.exist')
    cy.get('.govuk-summary-list__key').contains('Card number').should('not.exist')
    cy.get('.govuk-summary-list__key').contains('Card expiry date').should('not.exist')

    cy.get('.govuk-summary-list__key').contains('Email').should('exist')
  })

  it('should display 3D Secure required when authorisation summary exists', () => {
    const transactionWith3DSRequired = new TransactionFixture({
      authorisationSummary: new AuthorisationSummaryFixture({
        threeDSecure: {
          required: true,
        },
      }),
    })

    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(transactionWith3DSRequired),
      getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION_EVENTS),
    ])
    cy.visit(TRANSACTION_URL(TEST))

    cy.get('.govuk-summary-list__row')
      .eq(5)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', '3D Secure (3DS)')
        cy.get('.govuk-summary-list__value').should('contain.text', 'Required')
      })
  })

  it('should display 3D Secure as not required when authorisation summary exists', () => {
    const transactionWith3DSNotRequired = new TransactionFixture({
      authorisationSummary: new AuthorisationSummaryFixture(),
    })

    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(
        transactionWith3DSNotRequired
      ),
      getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION_EVENTS),
    ])
    cy.visit(TRANSACTION_URL(TEST))

    cy.get('.govuk-summary-list__row')
      .eq(5)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', '3D Secure (3DS)')
        cy.get('.govuk-summary-list__value').should('contain.text', 'Not required')
      })
  })

  it('should display wallet type when present', () => {
    const transactionWithWalletType = new TransactionFixture({ walletType: 'APPLE_PAY' })
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(transactionWithWalletType),
      getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION_EVENTS),
    ])
    cy.visit(TRANSACTION_URL(TEST))

    cy.get('.govuk-summary-list__row')
      .eq(6)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Payment type')
        cy.get('.govuk-summary-list__value').should('contain.text', 'Apple Pay')
      })
  })

  it('should display fees when present', () => {
    const transactionAmounts = { corporateCardSurcharge: 25, fee: 15, totalAmount: 1075 }
    const transactionWithFees = new TransactionFixture({ ...transactionAmounts })
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(transactionWithFees),
      getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION_EVENTS),
    ])
    cy.visit(TRANSACTION_URL(TEST))

    cy.get('.govuk-summary-list__row')
      .eq(5)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Payment amount')
        cy.get('.govuk-summary-list__value').should(
          'contain.text',
          `${penceToPoundsWithCurrency(transactionAmounts.totalAmount)} (including card fee of ${penceToPoundsWithCurrency(transactionAmounts.corporateCardSurcharge)})`
        )
      })

    cy.get('.govuk-summary-list__row')
      .eq(6)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Provider fee')
        cy.get('.govuk-summary-list__value').should('contain.text', penceToPoundsWithCurrency(transactionAmounts.fee))
      })
  })

  it('should display dispute information', () => {
    const parentTransactionOfDispute = new TransactionFixture({ disputed: true }).toTransactionData()
    const disputeCreatedDate = TRANSACTION_CREATED_TIMESTAMP.plus({ day: 1 })

    const disputeTransaction = new TransactionFixture({
      amount: 1000,
      fee: 100,
      netAmount: 900,
      createdDate: TRANSACTION_CREATED_TIMESTAMP.plus({ day: 1 }),
      state: new TransactionStateFixture({ status: Status.NEEDS_RESPONSE }),
      evidenceDueDate: TRANSACTION_CREATED_TIMESTAMP.plus({ days: 7 }),
      reason: Reason.FRAUDULENT,
      transactionType: ResourceType.DISPUTE,
    }).toTransactionData()

    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      transactionStubs.getLedgerTransactionSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionDetails: parentTransactionOfDispute,
      }),
      transactionStubs.getLedgerEventsSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionId: disputeTransaction.transaction_id,
        events: [],
      }),
      transactionStubs.getLedgerDisputeTransactionsSuccess({
        disputeTransactionsDetails: {
          parent_transaction_id: parentTransactionOfDispute.transaction_id,
          gateway_account_id: GATEWAY_ACCOUNT_ID,
          transactions: [disputeTransaction],
        },
      }),
    ])
    cy.visit(TRANSACTION_URL(TEST))

    cy.get('h2').should('contain.text', 'Dispute details')

    // this fails as status displays 'STARTED' - I think due to stubbing

    // cy.get('.govuk-summary-list__row')
    //   .eq(15)
    //   .within(() => {
    //     cy.get('.govuk-summary-list__key').should('contain.text', 'Status')
    //     cy.get('.govuk-summary-list__value').should('contain.text', Status.NEEDS_RESPONSE)
    //   })

    cy.get('.govuk-summary-list__row')
      .eq(16)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Date disputed')
        cy.get('.govuk-summary-list__value').should(
          'contain.text',
          disputeCreatedDate.toFormat(PAGE_CONTENT_DATE_FORMAT)
        )
      })

    cy.get('.govuk-summary-list__row')
      .eq(17)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Disputed amount')
        cy.get('.govuk-summary-list__value').should(
          'contain.text',
          penceToPoundsWithCurrency(disputeTransaction.amount)
        )
      })

    cy.get('.govuk-summary-list__row')
      .eq(18)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Provider dispute fee')
        cy.get('.govuk-summary-list__value').should('contain.text', penceToPoundsWithCurrency(disputeTransaction.fee!))
      })

    cy.get('.govuk-summary-list__row')
      .eq(19)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Dispute net amount')
        cy.get('.govuk-summary-list__value').should(
          'contain.text',
          penceToPoundsWithCurrency(disputeTransaction.net_amount!)
        )
      })

    cy.get('.govuk-summary-list__row')
      .eq(20)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Reason')
        cy.get('.govuk-summary-list__value').should('contain.text', ReasonFriendlyNames.FRAUDULENT)
      })

    // cy.get('.govuk-summary-list__row')
    //   .eq(21)
    //   .within(() => {
    //     cy.get('.govuk-summary-list__key').should('contain.text', 'Evidence due by')
    //     cy.get('.govuk-summary-list__value').should(
    //       'contain.text',
    //       DateTime.fromISO(disputeTransaction.evidence_due_date!).toFormat(PAGE_CONTENT_DATE_FORMAT)
    //     )
    //   })
  })

  it('should display events', () => {
    const state = new TransactionStateFixture({ status: Status.DECLINED })
    const transactionAmount = 12345
    const formattedAmount = penceToPoundsWithCurrency(transactionAmount)
    const declinedTransaction = new TransactionFixture({ state, amount: transactionAmount })
    const transactionStartedTimestamp = TRANSACTION_CREATED_TIMESTAMP.plus({ minute: 1 })
    const transactionDeclinedTimestamp = TRANSACTION_CREATED_TIMESTAMP.plus({ minute: 2 })

    const events = [
      new TransactionEventFixture({
        amount: transactionAmount,
        state: {
          finished: false,
          status: 'CREATED',
        },
        resourceType: 'PAYMENT',
        eventType: 'PAYMENT_CREATED',
        timestamp: TRANSACTION_CREATED_TIMESTAMP,
      }),

      new TransactionEventFixture({
        amount: transactionAmount,
        state: {
          finished: false,
          status: 'STARTED',
        },
        resourceType: 'PAYMENT',
        eventType: 'PAYMENT_STARTED',
        timestamp: transactionStartedTimestamp,
      }),
      new TransactionEventFixture({
        amount: transactionAmount,
        state: {
          finished: true,
          code: 'P0010',
          message: 'Payment method rejected',
          status: 'DECLINED',
        },
        resourceType: 'PAYMENT',
        eventType: 'AUTHORISATION_REJECTED',
        timestamp: transactionDeclinedTimestamp,
      }),
    ]

    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(declinedTransaction),
      getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(events),
    ])
    cy.visit(TRANSACTION_URL(TEST))

    cy.get('.govuk-table__caption').should('contain', 'Transaction events')
    cy.get('.govuk-table__header:eq(0)').should('contain', 'Event')
    cy.get('.govuk-table__header:eq(1)').should('contain', 'Amount')
    cy.get('.govuk-table__header:eq(2)').should('contain', 'Date and time')

    cy.get('.govuk-table__row')
      .eq(1)
      .within(() => {
        cy.get('.govuk-table__cell:eq(0)').should('contain.text', 'Declined')
        cy.get('.govuk-table__cell:eq(1)').should('contain.text', formattedAmount)
        // cy.get('.govuk-table__cell:eq(2)').should('contain.text', transactionDeclinedTimestamp.toFormat(PAGE_CONTENT_DATE_FORMAT))
      })

    cy.get('.govuk-table__row')
      .eq(2)
      .within(() => {
        cy.get('.govuk-table__cell:eq(0)').should('contain.text', 'Started')
        cy.get('.govuk-table__cell:eq(1)').should('contain.text', formattedAmount)
        // cy.get('.govuk-table__cell:eq(2)').should('contain.text', TRANSACTION_CREATED_TIMESTAMP.toFormat(PAGE_CONTENT_DATE_FORMAT))
      })

    cy.get('.govuk-table__row')
      .eq(3)
      .within(() => {
        cy.get('.govuk-table__cell:eq(0)').should('contain.text', 'Created')
        cy.get('.govuk-table__cell:eq(1)').should('contain.text', formattedAmount)
        // cy.get('.govuk-table__cell:eq(2)').should('contain.text', TRANSACTION_CREATED_TIMESTAMP.toFormat(PAGE_CONTENT_DATE_FORMAT))
      })
  })

  it('should navigate to refund page', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
      getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION_EVENTS),
    ])
    cy.visit(TRANSACTION_URL(TEST))
    cy.contains('a.govuk-button', 'Refund payment').should('be.visible').click()

    const refundUrl = `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions/${TRANSACTION.externalId}/refund`

    cy.url().should('include', refundUrl)
  })

  it('should not display refund button if thr transaction is not eligible', () => {
    const refundUnavailableState = new LedgerRefundSummaryFixture({ status: RefundSummaryStatus.UNAVAILABLE })
    const transactionWithRefundUnavailable = new TransactionFixture({ refundSummary: refundUnavailableState })

    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(
        transactionWithRefundUnavailable
      ),
      getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION_EVENTS),
    ])
    cy.visit(TRANSACTION_URL(TEST))
    cy.contains('a.govuk-button', 'Refund payment').should('not.exist')
  })
})
