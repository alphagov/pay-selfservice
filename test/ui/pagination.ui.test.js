'use strict'

const { render } = require('../test-helpers/html-assertions.js')

describe('The pagination links', function () {
  it('should display correct pagination links for all filters', () => {
    const filters = {
      reference: 'ref1',
      email: 'abc@example.com',
      state: 'Cancelled',
      selectedStates: [
        'Cancelled'
      ],
      payment_states: [
        'cancelled'
      ],
      fromDate: '2015-01-11',
      toDate: '2016-01-11',
      fromTime: '01:01:01',
      toTime: '02:02:02',
      pageSize: '100'
    }

    const templateData = transactionsTemplateData(filters)
    const body = render('transactions/paginator', templateData)

    body.should.containSelector('div.pagination')

    templateData.paginationLinks.forEach((link) => {
      body.should.containSelector('.paginationForm.page-' + link.pageName)
      body.should.containSelector('.paginationForm.page-' + link.pageName + '  [name="state"]')
        .withAttribute('value', 'Cancelled')
      body.should.containSelector('.paginationForm.page-' + link.pageName + '  [name="reference"]')
        .withAttribute('value', 'ref1')
      body.should.containSelector('.paginationForm.page-' + link.pageName + ' [name="email"]')
        .withAttribute('value', 'abc@example.com')
      body.should.containSelector('.paginationForm.page-' + link.pageName + '  [name="fromDate"]')
        .withAttribute('value', '2015-01-11')
      body.should.containSelector('.paginationForm.page-' + link.pageName + ' [name="toDate"]')
        .withAttribute('value', '2016-01-11')
      body.should.containSelector('.paginationForm.page-' + link.pageName + '  [name="page"]')
        .withAttribute('value', String(link.pageNumber))
      body.should.containSelector('.paginationForm.page-' + link.pageName + '  [name="pageSize"]')
        .withAttribute('value', '100')
      body.should.containSelector('.paginationForm.page-' + link.pageName + '  [name="fromTime"]')
        .withAttribute('value', '01:01:01')
      body.should.containSelector('.paginationForm.page-' + link.pageName + ' [name="toTime"]')
        .withAttribute('value', '02:02:02')
    })
  })

  it('should display correct pagination links for transactions filtered by multiple payment states', () => {
    const filters = {
      state: ['Cancelled', 'In Progress'],
      selectedStates: [
        'Cancelled',
        'In Progress'
      ],
      payment_states: [
        'cancelled',
        'created',
        'started',
        'submitted'
      ],
      pageSize: '100'
    }

    const templateData = transactionsTemplateData(filters)
    const body = render('transactions/paginator', templateData)

    body.should.containSelector('div.pagination')

    templateData.paginationLinks.forEach((link) => {
      body.should.containSelector('.paginationForm.page-' + link.pageName)
      body.should.containSelector('.paginationForm.page-' + link.pageName + '  [name="state"][value="Cancelled"]')
      body.should.containSelector('.paginationForm.page-' + link.pageName + '  [name="state"][value="In Progress"]')
      body.should.containSelector('.paginationForm.page-' + link.pageName + '  [name="page"]')
        .withAttribute('value', String(link.pageNumber))
      body.should.containSelector('.paginationForm.page-' + link.pageName + '  [name="pageSize"]')
        .withAttribute('value', '100')
    })
  })

  const transactionsTemplateData = (filters = {}) => {
    return {
      total: 100,
      results: [
        {
          charge_id: '100',
          amount: '50.00',
          reference: 'ref1',
          state_friendly: 'Testing2',
          state: {
            status: 'testing2',
            finished: true
          },
          card_brand: 'Visa',
          created: '2016-01-11 01:01:01'
        },
        {
          charge_id: '101',
          amount: '20.00',
          reference: 'ref1',
          state_friendly: 'Testing2',
          state: {
            status: 'testing2',
            finished: false
          },
          card_brand: 'Visa',
          created: '2016-01-11 01:01:01'
        }
      ],
      filters: filters,
      paginationLinks: [
        { pageNumber: 1, pageName: 1 },
        { pageNumber: 2, pageName: 2 },
        { pageNumber: 3, pageName: 3 },
        { pageNumber: 2, pageName: 'next' },
        { pageNumber: 6, pageName: 'last' }
      ],
      hasPaginationLinks: true,
      selectedState: 'Testing2',
      hasResults: true,
      downloadTransactionLink:
        '/transactions/download?reference=ref1&state=Testing2&from_date=2%2F0%2F2015%2001%3A01%3A01&&to_date=2%2F0%2F2015%2001%3A01%3A01'
    }
  }
})
