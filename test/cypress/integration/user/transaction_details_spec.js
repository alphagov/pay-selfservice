const capitalise = string => string[0].toUpperCase() + string.slice(1)
const convertAmounts = val => '£' + (val / 100).toFixed(2)

function formatDate (date) {
  const monthNames = [
    'January', 'February', 'March',
    'April', 'May', 'June', 'July',
    'August', 'September', 'October',
    'November', 'December'
  ]

  let day = date.getDate()
  day = day.toString().length > 1 ? day : '0' + day
  const monthIndex = date.getMonth()
  const year = date.getFullYear()

  return day + ' ' + monthNames[monthIndex] + ' ' + year + ' — '
}

describe('Transactions details page', () => {
  const transactionsUrl = `/transactions`

  const selfServiceUsers = require('../../../fixtures/config/self_service_user.json')

  const selfServiceDefaultUser = selfServiceUsers.config.users.filter(fil => fil.isPrimary === 'true')[0]

  const gatewayAccount = selfServiceDefaultUser.gateway_accounts.filter(fil => fil.isPrimary === 'true')[0]

  const aSmartpayCharge = selfServiceDefaultUser.sections.transactions.data[0]
  const aSmartpayChargeDetails = selfServiceDefaultUser.sections.transactions.details_data[0]

  const aFailedRefundCharge = selfServiceDefaultUser.sections.transactions.data.filter(fil => fil.state.status === 'error')[0]

  beforeEach(() => {
    cy.setCookie('session', Cypress.env('encryptedSessionCookie'))
    cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountCookie'))
  })

  describe('page content', () => {
    it('should display transaction details correctly when delayed capture is OFF', () => {
      cy.visit(`${transactionsUrl}/${aSmartpayCharge.charge_id}`)

      // Ensure page title is correct
      cy.title().should('eq', `Transaction details ${aSmartpayCharge.reference} - System Generated test - GOV.UK Pay`)

      // Ensure page details match up

      // Reference number
      cy.get('.transaction-details tbody').find('tr').first().find('td').eq(1).should('have.text',
        aSmartpayCharge.reference)
      // Status
      cy.get('.transaction-details tbody').find('tr').eq(2).find('td').eq(1).should('have.text',
        capitalise(aSmartpayCharge.state.status))
      // Amount
      cy.get('.transaction-details tbody').find('tr').eq(3).find('td').eq(1).should('have.text',
        convertAmounts(aSmartpayCharge.amount))
      // Refunded amount
      cy.get('.transaction-details tbody').find('tr').eq(4).find('td').eq(1).should('have.text',
        convertAmounts(aSmartpayChargeDetails.refund_summary.amount_submitted))
      // Date created
      cy.get('.transaction-details tbody').find('tr').eq(5).find('td').eq(1).should('contain',
        formatDate(new Date(aSmartpayChargeDetails.charge_events[0].updated)))
      // Provider
      cy.get('.transaction-details tbody').find('tr').eq(6).find('td').eq(1).should('have.text',
        capitalise(gatewayAccount.name))
      // Provider ID
      cy.get('.transaction-details tbody').find('tr').eq(7).find('td').eq(1).should('have.text',
        aSmartpayCharge.gateway_transaction_id)
      // GOVUK Payment ID
      cy.get('.transaction-details tbody').find('tr').eq(8).find('td').eq(1).should('have.text',
        aSmartpayCharge.charge_id)
      // Payment method
      cy.get('.transaction-details tbody').find('tr').eq(9).find('td').eq(1).should('have.text',
        aSmartpayCharge.card_details.card_brand)
      // Name on card
      cy.get('.transaction-details tbody').find('tr').eq(10).find('td').eq(1).should('have.text',
        aSmartpayCharge.card_details.cardholder_name)
      // Card number
      cy.get('.transaction-details tbody').find('tr').eq(11).find('td').eq(1).should('have.text',
        `**** **** **** ${aSmartpayCharge.card_details.last_digits_card_number}`)
      // Card expiry date
      cy.get('.transaction-details tbody').find('tr').eq(12).find('td').eq(1).should('have.text',
        aSmartpayCharge.card_details.expiry_date)
      // Email
      cy.get('.transaction-details tbody').find('tr').eq(13).find('td').eq(1).should('have.text',
        aSmartpayCharge.email)
      cy.get('#delayed-capture').should('not.exist')
    })

    it('should display transaction details correctly when delayed capture is ON', () => {
      const chargeWithDelayedCapture = selfServiceDefaultUser.sections.transactions.data[1]
      const chargeDetails = selfServiceDefaultUser.sections.transactions.details_data.filter(item => item.charge_id === chargeWithDelayedCapture.charge_id)[0]

      cy.visit(`${transactionsUrl}/${chargeWithDelayedCapture.charge_id}`)

      // Ensure page title is correct
      cy.title().should('eq', `Transaction details ${chargeWithDelayedCapture.reference} - System Generated test - GOV.UK Pay`)

      // Ensure page details match up

      // Reference number
      cy.get('.transaction-details tbody').find('tr').first().find('td').eq(1).should('have.text',
        chargeWithDelayedCapture.reference)
      // Status
      cy.get('.transaction-details tbody').find('tr').eq(2).find('td').eq(1).should('have.text',
        capitalise(chargeWithDelayedCapture.state.status))
      // Amount
      cy.get('.transaction-details tbody').find('tr').eq(3).find('td').eq(1).should('have.text',
        convertAmounts(chargeWithDelayedCapture.amount))
      // Refunded amount
      cy.get('.transaction-details tbody').find('tr').eq(4).find('td').eq(1).should('have.text',
        convertAmounts(chargeDetails.refund_summary.amount_submitted))
      // Date created
      cy.get('.transaction-details tbody').find('tr').eq(5).find('td').eq(1).should('contain',
        formatDate(new Date(chargeDetails.charge_events[0].updated)))
      // Provider
      cy.get('.transaction-details tbody').find('tr').eq(6).find('td').eq(1).should('have.text',
        capitalise(gatewayAccount.name))
      // Provider ID
      cy.get('.transaction-details tbody').find('tr').eq(7).find('td').eq(1).should('have.text',
        chargeWithDelayedCapture.gateway_transaction_id)
      // GOVUK Payment ID
      cy.get('.transaction-details tbody').find('tr').eq(8).find('td').eq(1).should('have.text',
        chargeWithDelayedCapture.charge_id)
      // Delayed capture
      cy.get('.transaction-details tbody').find('tr').eq(9).find('td').eq(1).should('have.text',
        'On')
      // Payment method
      cy.get('.transaction-details tbody').find('tr').eq(10).find('td').eq(1).should('have.text',
        chargeWithDelayedCapture.card_details.card_brand)
      // Name on card
      cy.get('.transaction-details tbody').find('tr').eq(11).find('td').eq(1).should('have.text',
        chargeWithDelayedCapture.card_details.cardholder_name)
      // Card number
      cy.get('.transaction-details tbody').find('tr').eq(12).find('td').eq(1).should('have.text',
        `**** **** **** ${chargeWithDelayedCapture.card_details.last_digits_card_number}`)
      // Card expiry date
      cy.get('.transaction-details tbody').find('tr').eq(13).find('td').eq(1).should('have.text',
        chargeWithDelayedCapture.card_details.expiry_date)
      // Email
      cy.get('.transaction-details tbody').find('tr').eq(14).find('td').eq(1).should('have.text',
        chargeWithDelayedCapture.email)
    })
  })

  describe('refunds', () => {
    it('should fail when an invalid refund amount is specified', () => {
      cy.visit(`${transactionsUrl}/${aSmartpayCharge.charge_id}`)

      // Click the refund button
      cy.get('.refund__toggle').click()

      // Select partial refund
      cy.get('#partial').click()

      // Select partial refund
      cy.get('#refund-amount').type(aSmartpayCharge.amount + 1)

      // Click the refund submit button
      cy.get('.refund__submit-button').click()

      // Ensure the flash container is showing
      cy.get('.flash-container').should('be.visible')

      cy.get('.flash-container').find('.error-summary').should('contain', 'The amount you tried to refund is greater than the transaction total')
    })

    it('should allow a refund to be re-attempted in the event of a failed refund', () => {
      cy.visit(`${transactionsUrl}/${aFailedRefundCharge.charge_id}`)

      // Ensure the refund button is available
      cy.get('.refund__toggle').should('be.visible')
      cy.get('.refund__toggle').should('be.enabled')

      // Click the refund button
      cy.get('.refund__toggle').click()

      // Select partial refund
      cy.get('#partial').click()

      // Select partial refund
      cy.get('#refund-amount').type(aFailedRefundCharge.amount / 100)

      // Click the refund submit button
      cy.get('.refund__submit-button').click()
    })
  })
})
