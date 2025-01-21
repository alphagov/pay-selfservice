'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionStubs = require('../../stubs/transaction-stubs')

describe('Transactions list pagination', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const gatewayAccountExternalId = 'a-valid-external-id'
  const transactionsUrl = `/account/${gatewayAccountExternalId}/transactions`
  const serviceName = 'Test Service'
  const defaultAmount = 1000

  function generateTransactions (length) {
    const transactions = []
    for (let i = 0; i < length; i++) {
      transactions.push({
        reference: 'transaction' + i,
        amount: defaultAmount,
        type: 'payment',
        charge_id: 'charge_id'
      })
    }
    return transactions
  }

  function transactionSearchResultOpts (transactionLength, displaySize, page, filters, links) {
    return {
      gatewayAccountId,
      transactionLength: transactionLength || 50,
      displaySize: displaySize || 5,
      page: page || 1,
      transactionCount: 5,
      transactions: generateTransactions(5),
      filters,
      links: links || {}
    }
  }

  const getStubs = (transactionDetails) => {
    return [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName }),
      userStubs.getUsersSuccess(),
      gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId }),
      gatewayAccountStubs.getCardTypesSuccess(),
      transactionStubs.getLedgerTransactionsSuccess(transactionDetails)
    ]
  }

  describe('Default sandbox gateway transactions', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
    })
    describe('Pagination', () => {
      it('should display pagination links with previous page disabled for first page', () => {
        const opts = transactionSearchResultOpts(30, 5, 1, {},
          {
            self: { href: '/v1/transactions?&page=&display_size=5&state=' },
            next_page: { href: '/v1/transactions?&page=3&display_size=5&state=' }
          })

        cy.task('setupStubs', getStubs(opts))
        cy.visit(transactionsUrl + '?pageSize=5&page=')
        cy.title().should('eq', `Transactions - ${serviceName} Sandbox test - GOV.UK Pay`)

        cy.get('div.pagination').should('exist').should('have.length', 2)

        cy.get('nav.govuk-pagination')
          .should('exist')
          .and('have.attr', 'aria-label', 'Pagination')

        cy.get('ul.govuk-pagination__list')
          .first()
          .children('li.govuk-pagination__item')
          .should('have.length', 4)

        cy.get('ul.govuk-pagination__list').first().within((el) => {
          cy.get('a')
            .first()
            .should('exist')
            .and('have.attr', 'href', '/account/a-valid-external-id/transactions?pageSize=5&page=1')
            .and('contain.text', '1')
        })

        cy.get('li.govuk-pagination__item')
          .find('a.govuk-link.govuk-pagination__link')
          .should('have.attr', 'href', '/account/a-valid-external-id/transactions?pageSize=5&page=1')
          .and('have.attr', 'aria-label', 'Page 1')
          .and('contain.text', '1')

        cy.get('ul.govuk-pagination__list li.govuk-pagination__item')
          .eq(1) // Get the second list item (Page 2)
          .find('a.govuk-link.govuk-pagination__link')
          .should('have.attr', 'href', '/account/a-valid-external-id/transactions?pageSize=5&page=2')
          .and('contain.text', '2')

        cy.get('div.govuk-pagination__next a.govuk-link.govuk-pagination__link')
          .should('have.attr', 'href', '/account/a-valid-external-id/transactions?pageSize=5&page=2')
          .and('have.attr', 'rel', 'next')

        cy.get('div.govuk-pagination__next a.govuk-link.govuk-pagination__link')
          .first()
          .within(() => {
            cy.get('span.govuk-pagination__link-title').should('contain.text', ' Next')
          })

        cy.get('div.govuk-pagination__next svg.govuk-pagination__icon--next').should('exist')
      })

      it('should have both next and previous pagination links enabled, when ledger return both links ', () => {
        const opts = transactionSearchResultOpts(30, 5, 3, {},
          {
            self: { href: '/v1/transactions?&page=2&display_size=5&state=' },
            next_page: { href: '/v1/transactions?&page=3&display_size=5&state=' },
            prev_page: { href: '/v1/transactions?&page=1&display_size=5&state=' }
          })

        cy.task('setupStubs', getStubs(opts))
        cy.visit(transactionsUrl + '?pageSize=5&page=3')
        cy.title().should('eq', `Transactions - ${serviceName} Sandbox test - GOV.UK Pay`)

        cy.get('div.govuk-pagination__next a.govuk-link.govuk-pagination__link')
          .should('have.attr', 'href', '/account/a-valid-external-id/transactions?pageSize=5&page=4')
          .and('have.attr', 'rel', 'next')

        cy.get('div.govuk-pagination__prev a.govuk-link.govuk-pagination__link')
          .should('have.attr', 'href', '/account/a-valid-external-id/transactions?pageSize=5&page=2')
          .and('have.attr', 'rel', 'prev')

        cy.get('div.govuk-pagination__next a.govuk-link.govuk-pagination__link').should('have.length', 2)
          .first()
          .within(() => {
            cy.get('span.govuk-pagination__link-title').should('contain.text', ' Next')
          })

        cy.get('div.govuk-pagination__prev a.govuk-link.govuk-pagination__link').should('have.length', 2)
          .first()
          .within(() => {
            cy.get('span.govuk-pagination__link-title').should('contain.text', ' Previous')
          })
      })

      it('should display the next page as disabled, when ledger does not return next page', () => {
        const opts = transactionSearchResultOpts(30, 5, 6, {},
          {
            self: { href: '/v1/transactions?&page=2&display_size=5&state=' },
            prev_page: { href: '/v1/transactions?&page=1&display_size=5&state=' }
          })

        cy.task('setupStubs', getStubs(opts))
        cy.visit(transactionsUrl + '?pageSize=5&page=6')
        cy.title().should('eq', `Transactions - ${serviceName} Sandbox test - GOV.UK Pay`)

        cy.get('div.govuk-pagination__prev a.govuk-link.govuk-pagination__link')
          .should('have.attr', 'href', '/account/a-valid-external-id/transactions?pageSize=5&page=5')
          .and('have.attr', 'rel', 'prev')

        cy.get('div.govuk-pagination__prev a.govuk-link.govuk-pagination__link').should('have.length', 2)
          .first()
          .within(() => {
            cy.get('span.govuk-pagination__link-title').should('contain.text', ' Previous')
          })

        cy.get('div.govuk-pagination__next a.govuk-link.govuk-pagination__link')
          .should('not.exist')
      })

      it('should not display pagination links, when ledger does not provide both next and previous links', () => {
        const opts = transactionSearchResultOpts(5, 5, '', {}, {})

        cy.task('setupStubs', getStubs(opts))
        cy.visit(transactionsUrl + '?pageSize=5&page=')

        cy.get('div.govuk-pagination__next a.govuk-link.govuk-pagination__link')
          .should('not.exist')

        cy.get('div.govuk-pagination__prev a.govuk-link.govuk-pagination__link')
          .should('not.exist')
      })

      it('should navigate to next page correctly with all filters intact', () => {
        const opts = transactionSearchResultOpts(30, 5, 1, {
          reference: 'ref123',
          email: 'gds4',
          cardholder_name: 'doe',
          last_digits_card_number: '4242',
          from_date: '2018-05-03T00:00:00.000Z',
          to_date: '2018-05-04T00:00:01.000Z',
          card_brands: 'visa,master-card',
          payment_states: 'success'
        },
        {
          self: { href: '/v1/transactions?&page=2&display_size=5&state=' },
          next_page: { href: '/v1/transactions?&page=3&display_size=5&state=' }
        })

        const stubs = getStubs(opts)

        // stubs for next page
        opts.page = 2
        opts.links = { prev_page: { href: '/v1/transactions?&page=1&display_size=5&state=' } }
        stubs.push(transactionStubs.getLedgerTransactionsSuccess(opts))

        cy.task('setupStubs', stubs)
        cy.visit(transactionsUrl + '?pageSize=5&page=1&reference=ref123&email=gds4&cardholderName=doe&lastDigitsCardNumber=4242&fromDate=03%2F05%2F2018&fromTime=1%3A00%3A00&toDate=04%2F05%2F2018&toTime=1%3A00%3A00&brand=visa&brand=master-card&state=Success')

        cy.get('.govuk-pagination__next').first().click()

        cy.get('#reference').invoke('val').should('contain', 'ref123')
        cy.get('#fromDate').invoke('val').should('contain', '03/05/2018')
        cy.get('#fromTime').invoke('val').should('contain', '1:00:00')
        cy.get('#toDate').invoke('val').should('contain', '04/05/2018')
        cy.get('#toTime').invoke('val').should('contain', '1:00:00')
        cy.get('#email').invoke('val').should('contain', 'gds4')
        cy.get('#lastDigitsCardNumber').invoke('val').should('contain', '4242')
        cy.get('#cardholderName').invoke('val').should('contain', 'doe')
        cy.get('#state').invoke('text').should('contain', 'Success')
        cy.get('#card-brand').invoke('text').should('contain', 'Visa, Mastercard')
      })

      it('should return correct display size options when total over 500', () => {
        const opts = transactionSearchResultOpts(600, 100, 1, {},
          { self: { href: '/v1/transactions?&page=1&display_size=100&state=' } })
        cy.task('setupStubs', getStubs(opts))
        cy.visit(transactionsUrl + '?pageSize=100&page=1')
        cy.title().should('eq', `Transactions - ${serviceName} Sandbox test - GOV.UK Pay`)
        cy.get('#displaySize').should('contain', 'Results per page:')
        cy.get('#displaySize').should('contain', '100')
        cy.get('.displaySizeForm').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '1')
          cy.get('input[name="pageSize"]').should('have.value', '500')
        })
      })

      it('should return correct display size options when total between 100 and 500', () => {
        const opts = transactionSearchResultOpts(400, 100, 1, {},
          { self: { href: '/v1/transactions?&page=1&display_size=100&state=' } })
        cy.task('setupStubs', getStubs(opts))
        cy.visit(transactionsUrl + '?pageSize=100&page=1')
        cy.title().should('eq', `Transactions - ${serviceName} Sandbox test - GOV.UK Pay`)

        cy.get('#displaySize').should('contain', 'Results per page:')
        cy.get('#displaySize').should('contain', '100')
        cy.get('.displaySizeForm').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '1')
          cy.get('input[name="pageSize"]').should('have.value', '500')
        })
        cy.get('button.pay-button--as-link.displaySize').should('contain', 'Show all')
      })

      it('should return correct display size options when total under 100', () => {
        const opts = transactionSearchResultOpts(50, 100, 1, {})
        cy.task('setupStubs', getStubs(opts))
        cy.visit(transactionsUrl + '?pageSize=100&page=1')
        cy.title().should('eq', `Transactions - ${serviceName} Sandbox test - GOV.UK Pay`)

        cy.get('form.paginationForm').should('not.exist')
        cy.get('#displaySize').should('not.exist')
      })

      it('should return correct display size options when total under 1000', () => {
        const opts = transactionSearchResultOpts(150, 500, 1, {},
          { self: { href: '/v1/transactions?&page=1&display_size=500&state=' } })
        cy.task('setupStubs', getStubs(opts))
        cy.visit(transactionsUrl + '?pageSize=500&page=1')
        cy.title().should('eq', `Transactions - ${serviceName} Sandbox test - GOV.UK Pay`)

        cy.get('form.paginationForm').should('not.exist')
        cy.get('#displaySize').should('contain', 'Results per page:')
        cy.get('#displaySize').should('contain', '100')
        cy.get('.displaySizeForm').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '1')
          cy.get('input[name="pageSize"]').should('have.value', '100')
        })
        cy.get('button.pay-button--as-link.displaySize').should('contain', '100')
      })
    })
  })
})
