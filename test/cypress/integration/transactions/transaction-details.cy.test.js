'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const transactionStubs = require('../../stubs/transaction-stubs')
const moment = require('moment-timezone')

const capitalise = string => string[0].toUpperCase() + string.slice(1)
const convertPenceToPoundsFormatted = pence => `£${(pence / 100).toFixed(2)}`
const defaultAmount = 1000
const gatewayAccountExternalId = 'a-valid-external-id'
const transactionId = 'adb123def456'
const disputeTransactionId = 'vldb123def456'
const gatewayAccountId = 42
const serviceName = 'Test Service'

function formatDate (date) {
  const monthNames = [
    'Jan', 'Feb', 'Mar',
    'Apr', 'May', 'Jun', 'Jul',
    'Aug', 'Sep', 'Oct',
    'Nov', 'Dec'
  ]

  let day = date.getDate()
  day = day.toString().length > 1 ? day : '0' + day
  const monthIndex = date.getMonth()
  const year = date.getFullYear()

  return day + ' ' + monthNames[monthIndex] + ' ' + year + ' — '
}

function utcToDisplay (date) {
  return moment(date).tz('Europe/London').format('DD MMM YYYY — HH:mm:ss')
}

const defaultTransactionEvents = [{
  amount: defaultAmount,
  state: {
    finished: false,
    status: 'created'
  },
  resource_type: 'PAYMENT',
  event_type: 'PAYMENT_CREATED',
  timestamp: '2019-09-18T10:06:17.152Z',
  data: {}
}]

function defaultTransactionDetails (events, opts = {}) {
  return {
    amount: defaultAmount,
    state: { finished: true, status: 'success' },
    description: 'description',
    reference: 'ref188888',
    transaction_id: transactionId,
    email: 'j.doe@example.org',
    payment_provider: 'sandbox',
    created_date: '2018-05-01T13:27:00.057Z',
    delayed_capture: false,
    transaction_type: 'PAYMENT',
    account_id: gatewayAccountId,
    refund_summary_status: opts.refund_summary_status || 'available',
    refund_summary_available: opts.refund_amount_available || defaultAmount,
    refund_summary_submitted: opts.refund_summary_submitted || 0,
    gateway_transaction_id: 'a-gateway-transaction-id',
    cardholder_name: 'J Doe',
    card_brand: 'Visa',
    last_digits_card_number: '0002',
    expiry_date: '08/23',
    includeRefundSummary: true,
    includeSearchResultCardDetails: true,
    includeAddress: opts.includeAddress || true,
    events: events || defaultTransactionEvents
  }
}

function defaultDisputeDetails () {
  return {
    'parent_transaction_id': transactionId,
    'gatteway_account_id': gatewayAccountId,
    'transactions': [
      {
        'gateway_account_id': gatewayAccountId,
        'amount': 20000,
        'fee': 1500,
        'net_amount': -21500,
        'finished': true,
        'status': 'lost',
        'created_date': '2022-07-26T19:57:26.000Z',
        'type': 'dispute',
        'includePaymentDetails': true,
        'evidence_due_date': '2022-08-04T13:59:59.000Z',
        'reason': 'product_not_received',
        'transaction_id': disputeTransactionId,
        'parent_transaction_id': transactionId
      }
    ]
  }
}

describe('Transaction details page', () => {
  const transactionsUrl = `/account/${gatewayAccountExternalId}/transactions`
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const userEmail = 'a-user@example.com'

  const getStubs = (transactionDetails, additionalGatewayAccountOpts = {}, disputeTransactionsDetails) => {
    let stubs = [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName, email: userEmail }),
      gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
        gatewayAccountId,
        gatewayAccountExternalId,
        paymentProvider: transactionDetails.payment_provider,
        allowMoto: additionalGatewayAccountOpts.allow_moto
      }),
      transactionStubs.getLedgerTransactionSuccess({ transactionDetails }),
      transactionStubs.getLedgerEventsSuccess({ transactionId, events: transactionDetails.events }),
      stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, bankAccount: true, responsiblePerson: true, vatNumber: true, companyNumber: true })
    ]
    if (disputeTransactionsDetails) {
      stubs.push(transactionStubs.getLedgerDisputeTransactionsSuccess({ disputeTransactionsDetails }))
    }
    return stubs
  }

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  describe('page content', () => {
    it('should display transaction details correctly with optional data', function () {
      const transactionDetails = defaultTransactionDetails()
      transactionDetails.wallet_type = 'APPLE_PAY'
      transactionDetails.metadata = {
        key1: 123,
        key2: true,
        key3: 'some string'
      }
      transactionDetails.payment_provider = 'stripe'
      transactionDetails.fee = 100
      transactionDetails.net_amount = defaultAmount - 100
      transactionDetails.moto = true
      transactionDetails.delayed_capture = true
      transactionDetails.corporate_card_surcharge = 250
      transactionDetails.total_amount = 1250

      cy.task('setupStubs', getStubs(transactionDetails, { allow_moto: true }))
      cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)

      // Reference number
      cy.get('.transaction-details tbody').find('tr').first().find('td').first().should('have.text',
        transactionDetails.reference)
      // Status
      cy.get('.transaction-details tbody').find('tr').eq(2).find('td').first().should('contain',
        capitalise(transactionDetails.state.status))
      // Amount
      cy.get('.transaction-details tbody').find('tr').eq(3).find('td').first().should('have.text',
        `${convertPenceToPoundsFormatted(transactionDetails.total_amount)} (including a card fee of ${convertPenceToPoundsFormatted(transactionDetails.corporate_card_surcharge)})`)
      // PSP Fee
      cy.get('.transaction-details tbody').find('tr').eq(4).find('td').first().should('have.text',
        convertPenceToPoundsFormatted(transactionDetails.fee))
      // Net amount
      cy.get('.transaction-details tbody').find('tr').eq(5).find('td').first().should('have.text',
        convertPenceToPoundsFormatted(transactionDetails.net_amount))
      // Refund submitted
      cy.get('.transaction-details tbody').find('tr').eq(6).find('td').first().should('have.text',
        convertPenceToPoundsFormatted(transactionDetails.refund_summary_submitted))
      // Date created
      cy.get('.transaction-details tbody').find('tr').eq(7).find('td').first().should('contain',
        formatDate(new Date(transactionDetails.events[0].timestamp)))
      // Provider
      cy.get('.transaction-details tbody').find('tr').eq(8).find('td').first().should('have.text',
        capitalise(transactionDetails.payment_provider))
      // Provider ID
      cy.get('.transaction-details tbody').find('tr').eq(9).find('td').first().should('have.text',
        transactionDetails.gateway_transaction_id)
      // GOVUK Payment ID
      cy.get('.transaction-details tbody').find('tr').eq(10).find('td').first().should('have.text',
        transactionDetails.transaction_id)
      // Delayed capture
      cy.get('.transaction-details tbody').find('tr').eq(11).find('td').first().should('have.text',
        'On')
      // Moto
      cy.get('.transaction-details tbody').find('tr').eq(12).find('td').first().should('have.text',
        'Yes')
      // Payment method
      cy.get('.transaction-details tbody').find('tr').eq(13).find('td').first().should('have.text',
        transactionDetails.card_brand)
      // Name on card
      cy.get('.transaction-details tbody').find('tr').eq(14).find('td').first().should('have.text',
        transactionDetails.cardholder_name)
      // Card number
      cy.get('.transaction-details tbody').find('tr').eq(15).find('td').first().should('have.text',
        `**** **** **** ${transactionDetails.last_digits_card_number}`)
      // Card expiry date
      cy.get('.transaction-details tbody').find('tr').eq(16).find('td').first().should('have.text',
        transactionDetails.expiry_date)
      // Wallett type
      cy.get('.transaction-details tbody').find('tr').eq(17).find('td').first().should('have.text', 'Apple Pay')
      // Email
      cy.get('.transaction-details tbody').find('tr').eq(18).find('td').first().should('have.text',
        transactionDetails.email)
      // Metadata
      cy.get('h2').should('contain', 'Metadata')
      cy.get('th').contains('key1').siblings().first().should('contain', '123')
      cy.get('th').contains('key2').siblings().first().should('contain', 'true')
      cy.get('th').contains('key3').siblings().first().should('contain', 'some string')
    })

    it('should display transaction details and a list of history with no optional data', () => {
      const events = [{
        event_type: 'PAYMENT_CREATED',
        status: 'created',
        finished: false,
        amount: '1000',
        timestamp: '2018-12-24 13:21:05'
      }, {
        event_type: 'PAYMENT_STARTED',
        status: 'started',
        finished: false,
        amount: '1000',
        timestamp: '2018-12-24 13:23:12'
      }, {
        event_type: 'AUTHORISATION_SUCCEEDED',
        status: 'submitted',
        finished: false,
        amount: '1000',
        timestamp: '2018-12-24 12:05:43'
      }, {
        event_type: 'USER_APPROVED_FOR_CAPTURE',
        status: 'success',
        finished: true,
        amount: '1000',
        timestamp: '2018-12-24 12:05:43'
      }]
      const opts = {
        includeAddress: false
      }

      const transactionDetails = defaultTransactionDetails(events, opts)
      cy.task('setupStubs', getStubs(transactionDetails))

      cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)

      // Ensure page details match up
      // Reference number
      cy.get('.transaction-details tbody').find('tr').first().find('td').first().should('have.text',
        transactionDetails.reference)
      // Status
      cy.get('.transaction-details tbody').find('tr').eq(2).find('td').first().should('contain',
        capitalise(transactionDetails.state.status))
      // Amount
      cy.get('.transaction-details tbody').find('tr').eq(3).find('td').first().should('have.text',
        convertPenceToPoundsFormatted(transactionDetails.amount))
      // Refunded amount
      cy.get('.transaction-details tbody').find('tr').eq(4).find('td').first().should('have.text',
        convertPenceToPoundsFormatted(transactionDetails.refund_summary_submitted))
      // Date created
      cy.get('.transaction-details tbody').find('tr').eq(5).find('td').first().should('contain',
        formatDate(new Date(transactionDetails.events[0].timestamp)))
      // Provider
      cy.get('.transaction-details tbody').find('tr').eq(6).find('td').first().should('have.text',
        capitalise(transactionDetails.payment_provider))
      // Provider ID
      cy.get('.transaction-details tbody').find('tr').eq(7).find('td').first().should('have.text',
        transactionDetails.gateway_transaction_id)
      // GOVUK Payment ID
      cy.get('.transaction-details tbody').find('tr').eq(8).find('td').first().should('have.text',
        transactionDetails.transaction_id)
      // Payment method
      cy.get('.transaction-details tbody').find('tr').eq(9).find('td').first().should('have.text',
        transactionDetails.card_brand)
      // Name on card
      cy.get('.transaction-details tbody').find('tr').eq(10).find('td').first().should('have.text',
        transactionDetails.cardholder_name)
      // // Card number
      cy.get('.transaction-details tbody').find('tr').eq(11).find('td').first().should('have.text',
        `**** **** **** ${transactionDetails.last_digits_card_number}`)
      // Card expiry date
      cy.get('.transaction-details tbody').find('tr').eq(12).find('td').first().should('have.text',
        transactionDetails.expiry_date)
      // Email
      cy.get('.transaction-details tbody').find('tr').eq(13).find('td').first().should('have.text',
        transactionDetails.email)
      cy.get('#delayed-capture').should('not.exist')
      cy.get('.transaction-details tbody').should('not.contain', 'Wallet Type')
      cy.get('h2').should('not.contain', 'Metadata')
      cy.get('th').contains('MOTO:').should('not.exist')

      // History details
      cy.get('.transaction-events tbody').find('tr').eq(0).find('td').eq(0).should('contain',
        capitalise(events[3].status))
      cy.get('.transaction-events tbody').find('tr').eq(0).find('td').eq(1).should('contain',
        convertPenceToPoundsFormatted(events[3].amount))
      cy.get('.transaction-events tbody').find('tr').eq(0).find('td').eq(2).should('contain',
        formatDate(new Date(events[3].timestamp)))
      cy.get('.transaction-events tbody').find('tr').eq(1).find('td').eq(0).should('contain',
        capitalise(events[2].status))
      cy.get('.transaction-events tbody').find('tr').eq(1).find('td').eq(1).should('contain',
        convertPenceToPoundsFormatted(events[2].amount))
      cy.get('.transaction-events tbody').find('tr').eq(1).find('td').eq(2).should('contain',
        formatDate(new Date(events[2].timestamp)))
      cy.get('.transaction-events tbody').find('tr').eq(2).find('td').eq(0).should('contain',
        capitalise(events[1].status))
      cy.get('.transaction-events tbody').find('tr').eq(2).find('td').eq(1).should('contain',
        convertPenceToPoundsFormatted(events[1].amount))
      cy.get('.transaction-events tbody').find('tr').eq(2).find('td').eq(2).should('contain',
        formatDate(new Date(events[1].timestamp)))
      cy.get('.transaction-events tbody').find('tr').eq(3).find('td').eq(0).should('contain',
        capitalise(events[0].status))
      cy.get('.transaction-events tbody').find('tr').eq(3).find('td').eq(1).should('contain',
        convertPenceToPoundsFormatted(events[0].amount))
      cy.get('.transaction-events tbody').find('tr').eq(3).find('td').eq(2).should('contain',
        formatDate(new Date(events[0].timestamp)))
    })
  })

  describe('refunds', () => {
    it('should show success message when full refund is successful', () => {
      const transactionDetails = defaultTransactionDetails()
      const refundAmount = transactionDetails.amount + 1
      const stubs = [
        ...getStubs(transactionDetails),
        transactionStubs.postRefundSuccess(
          {
            gatewayAccountId, userExternalId, userEmail, transactionId: transactionDetails.transaction_id, refundAmount, refundAmountAvailable: transactionDetails.amount
          })
      ]
      cy.task('setupStubs', stubs)

      cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)

      cy.get('#refundForm').should('exist')

      // Click the refund button
      cy.get('.target-to-show--toggle').click()

      cy.get('.govuk-radios__input#full').should('be.checked')

      // Click the refund submit button
      cy.get('#refund-button').click()

      // Ensure the flash container is showing
      cy.get('.govuk-notification-banner--success').should('be.visible')

      cy.get('.govuk-notification-banner__heading').should('contain', 'Refund successful')
    })

    it('should fail when an invalid refund amount is specified', () => {
      const transactionDetails = defaultTransactionDetails()
      const refundAmount = transactionDetails.amount + 1
      const stubs = [
        ...getStubs(transactionDetails),
        transactionStubs.postRefundAmountNotAvailable(
          {
            gatewayAccountId, userExternalId, userEmail, transactionId: transactionDetails.transaction_id, refundAmount, refundAmountAvailable: transactionDetails.amount
          })
      ]
      cy.task('setupStubs', stubs)

      cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)

      // Click the refund button
      cy.get('.target-to-show--toggle').click()

      // Select partial refund
      cy.get('.govuk-radios__input#partial').click()
      cy.get('.govuk-radios__input#full').should('not.be.checked')
      cy.get('.govuk-radios__input#partial').should('be.checked')

      // Select partial refund
      cy.get('#refund-amount').type('10.01')

      // Click the refund submit button
      cy.get('#refund-button').click()

      // Ensure the flash container is showing
      cy.get('.govuk-error-summary').should('be.visible')

      cy.get('.govuk-error-summary').find('h2').should('contain', 'Refund failed')
      cy.get('.govuk-error-summary').find('ul.govuk-error-summary__list > li:nth-child(1)').should('contain', 'The amount you tried to refund is greater than the amount available to be refunded. Please try again.')
    })

    it('should allow a refund to be re-attempted in the event of a failed refund', () => {
      const aFailedRefundTransaction = defaultTransactionDetails()
      aFailedRefundTransaction.refund_summary_status = 'error'
      cy.task('setupStubs', getStubs(aFailedRefundTransaction))

      cy.visit(`${transactionsUrl}/${aFailedRefundTransaction.transaction_id}`)

      // Ensure the refund button is available
      cy.get('.target-to-show--toggle').should('be.visible')

      // Click the refund button
      cy.get('.target-to-show--toggle').click()

      // Select partial refund
      cy.get('#partial').click()

      // Select partial refund
      cy.get('#refund-amount').type(aFailedRefundTransaction.amount / 100)

      // Click the refund submit button
      cy.get('#refund-button').click()
    })

    it('should display full refund amount with corporate card surcharge when there is a corporate card surcharge', () => {
      const aCorporateCardSurchargeTransaction = defaultTransactionDetails()
      aCorporateCardSurchargeTransaction.corporate_card_surcharge = 250
      aCorporateCardSurchargeTransaction.total_amount = 1250
      cy.task('setupStubs', getStubs(aCorporateCardSurchargeTransaction))

      cy.visit(`${transactionsUrl}/${aCorporateCardSurchargeTransaction.transaction_id}`)

      // Click the refund button
      cy.get('.target-to-show--toggle').click()

      // Assert refund message
      cy.get('.govuk-radios__hint').first().should('contain', `Refund the full amount of ${convertPenceToPoundsFormatted(aCorporateCardSurchargeTransaction.refund_summary_available)} (including a card fee of ${convertPenceToPoundsFormatted(aCorporateCardSurchargeTransaction.corporate_card_surcharge)})`)
    })

    it('should display full refund amount without corporate card surcharge when there is no corporate card surcharge', () => {
      const transactionDetails = defaultTransactionDetails()
      cy.task('setupStubs', getStubs(transactionDetails))
      cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)

      // Click the refund button
      cy.get('.target-to-show--toggle').click()

      // Assert refund message
      cy.get('.govuk-radios__hint').first().should('contain', `Refund the full amount of ${convertPenceToPoundsFormatted(transactionDetails.refund_summary_available)}`)
    })
  })

  describe('Disputed payment', () => {
    it('should show refund unavailable message', () => {
      const disputedPaymentDetails = defaultTransactionDetails()
      disputedPaymentDetails.disputed = true
      disputedPaymentDetails.refund_summary_status = 'unavailable'

      cy.task('setupStubs', getStubs(disputedPaymentDetails))
      cy.visit(`${transactionsUrl}/${disputedPaymentDetails.transaction_id}`)

      cy.get('[data-cy=refund-container]').within(() => {
        cy.get('h2').contains('Refund').should('exist')
        cy.get('#refundForm').should('not.exist')

        cy.get('p').contains('You cannot refund this payment because it is being disputed.')
      })
    })

    it('should display dispute details', () => {
      const disputedPaymentDetails = defaultTransactionDetails()
      disputedPaymentDetails.disputed = true
      disputedPaymentDetails.refund_summary_status = 'unavailable'
      const disputeTransactionDetails = defaultDisputeDetails()

      cy.task('setupStubs', getStubs(disputedPaymentDetails, {}, disputeTransactionDetails))
      cy.visit(`${transactionsUrl}/${disputedPaymentDetails.transaction_id}`)

      cy.get('.transaction-details tbody').find('tr').eq(2).find('td').first().should('contain', 'Dispute lost to customer')

      cy.get('[data-cy=dispute-details]').contains('Dispute details').should('exist')
      cy.get('[data-cy=dispute-details-container]').within(() => {
        cy.get('[data-cy=dispute-state]').contains('Dispute lost to customer').should('exist')
        cy.get('[data-cy=dispute-amount]').contains('£200.00').should('exist')
        cy.get('[data-cy=dispute-net-amount]').contains('-£215.00').should('exist')
        cy.get('[data-cy=dispute-fee]').invoke('text').should('contain', '£15.00')
        cy.get('[data-cy=dispute-reason]').contains('Product not received').should('exist')
        cy.get('[data-cy=dispute-date]').contains(utcToDisplay('2022-07-26T19:57:26.000Z')).should('exist')
        cy.get('[data-cy=dispute-evidence-due-date]').contains(utcToDisplay('2022-08-04T13:59:59.000Z')).should('exist')
      })
    })
  })
})
