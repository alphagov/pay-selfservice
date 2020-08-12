'use strict'

const userStubs = require('../../utils/user-stubs')
const gatewayAccountStubs = require('../../utils/gateway-account-stubs')
const transactionStubs = require('../../utils/transaction-stubs')

describe('Transactions list pagination', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const transactionsUrl = '/transactions'
  const serviceName = 'Test Service'
  const defaultAmount = 1000

  function generateTransactions (length) {
    const transactions = []
    for (let i = 0; i < length; i++) {
      transactions.push({
        reference: 'transaction' + i,
        amount: defaultAmount,
        type: 'payment'
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
      transactionCount: 3,
      transactions: generateTransactions(2),
      filters: filters,
      links: links || {}
    }
  }

  const getStubs = (transactionDetails) => {
    return [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName }),
      userStubs.getUsersSuccess(),
      gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId }),
      gatewayAccountStubs.getCardTypesSuccess(),
      transactionStubs.getLedgerTransactionsSuccess(transactionDetails)
    ]
  }

  describe('Default sandbox gateway transactions', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
    })
    describe('Pagination', () => {
      it('should default to page 1 and display_size 100', () => {
        const opts = transactionSearchResultOpts(600, 100, 1, {},
          { self: { href: '/v1/transactions?&page=&display_size=&state=' } })

        cy.task('setupStubs', getStubs(opts))
        cy.visit(transactionsUrl)
        cy.title().should('eq', `Transactions - ${serviceName} Sandbox test - GOV.UK Pay`)

        cy.get('form.paginationForm.page-1').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '1')
        })
        cy.get('button.pagination.1.active').should('exist')
        cy.get('form.paginationForm.page-2').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '2')
        })
        cy.get('button.pagination.2').should('exist')
        cy.get('form.paginationForm.page-3').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '3')
        })
        cy.get('button.pagination.3').should('exist')
        cy.get('form.paginationForm.page-next').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '2')
        })
        cy.get('button.pagination.next').should('exist')
        cy.get('form.paginationForm.page-last').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '6')
        })
        cy.get('button.pagination.last').should('exist')
      })

      it('should generate correct pagination data when no page number passed', () => {
        const opts = transactionSearchResultOpts(30, 5, '', {},
          { self: { href: '/v1/transactions?&page=&display_size=5&state=' } })

        cy.task('setupStubs', getStubs(opts))
        cy.visit(transactionsUrl + '?pageSize=5&page=')
        cy.title().should('eq', `Transactions - ${serviceName} Sandbox test - GOV.UK Pay`)

        cy.get('form.paginationForm.page-1').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '1')
        })
        cy.get('button.pagination.1.active').should('exist')
        cy.get('form.paginationForm.page-2').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '2')
        })
        cy.get('button.pagination.2').should('exist')
        cy.get('form.paginationForm.page-3').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '3')
        })
        cy.get('button.pagination.3').should('exist')
        cy.get('form.paginationForm.page-next').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '2')
        })
        cy.get('button.pagination.next').should('exist')
        cy.get('form.paginationForm.page-last').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '6')
        })
        cy.get('button.pagination.last').should('exist')
      })

      it('should generate correct pagination data when page number passed', () => {
        const opts = transactionSearchResultOpts(30, 5, 3, {},
          { self: { href: '/v1/transactions?&page=3&display_size=5&state=' } })

        cy.task('setupStubs', getStubs(opts))
        cy.visit(transactionsUrl + '?pageSize=5&page=3')
        cy.title().should('eq', `Transactions - ${serviceName} Sandbox test - GOV.UK Pay`)

        cy.get('form.paginationForm.page-previous').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '2')
        })
        cy.get('button.pagination.previous').should('exist')
        cy.get('form.paginationForm.page-1').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '1')
        })
        cy.get('button.pagination.1').should('exist')
        cy.get('form.paginationForm.page-2').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '2')
        })
        cy.get('button.pagination.2').should('exist')
        cy.get('form.paginationForm.page-3').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '3')
        })
        cy.get('button.pagination.3.active').should('exist')
        cy.get('form.paginationForm.page-4').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '4')
        })
        cy.get('button.pagination.4').should('exist')
        cy.get('form.paginationForm.page-5').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '5')
        })
        cy.get('button.pagination.5').should('exist')
        cy.get('form.paginationForm.page-next').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '4')
        })
        cy.get('button.pagination.next').should('exist')
        cy.get('form.paginationForm.page-last').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '6')
        })
        cy.get('button.pagination.last').should('exist')
      })

      it('should generate correct pagination data with different display size', () => {
        const opts = transactionSearchResultOpts(30, 2, 3, {},
          { self: { href: '/v1/transactions?&page=3&display_size=2&state=' } })

        cy.task('setupStubs', getStubs(opts))
        cy.visit(transactionsUrl + '?pageSize=2&page=3')
        cy.title().should('eq', `Transactions - ${serviceName} Sandbox test - GOV.UK Pay`)

        cy.get('form.paginationForm.page-previous').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '2')
        })
        cy.get('button.pagination.previous').should('exist')
        cy.get('form.paginationForm.page-1').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '1')
        })
        cy.get('button.pagination.1').should('exist')
        cy.get('form.paginationForm.page-2').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '2')
        })
        cy.get('button.pagination.2').should('exist')
        cy.get('form.paginationForm.page-3').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '3')
        })
        cy.get('button.pagination.3.active').should('exist')
        cy.get('form.paginationForm.page-4').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '4')
        })
        cy.get('button.pagination.4').should('exist')
        cy.get('form.paginationForm.page-5').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '5')
        })
        cy.get('button.pagination.5').should('exist')
        cy.get('form.paginationForm.page-next').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '4')
        })
        cy.get('button.pagination.next').should('exist')
        cy.get('form.paginationForm.page-last').should('exist').within(() => {
          cy.get('input[name="page"]').should('have.value', '15')
        })
        cy.get('button.pagination.last').should('exist')
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
