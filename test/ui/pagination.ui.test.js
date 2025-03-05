'use strict'

const { render } = require('@test/test-helpers/html-assertions')

describe('The pagination links', function () {
  it('should display correct pagination links with the correct href links when on first page', () => {
    const templateData = transactionsTemplateData(filters(1), getAllLinks(3))
    const body = render('transactions/paginator', templateData)

    body.should.containSelector('div.pagination')
    body.should.not.containSelector('div.govuk-pagination__prev').withText('Previous page')
    body.should.containSelector('div.govuk-pagination__next').withText('Next page')
    body.should.containSelector('div.govuk-pagination__next a.govuk-link.govuk-pagination__link[href="/all-service-transactions/test?page=2"]').withAttribute('rel', 'next')
    body.should.containSelector('a.govuk-link.govuk-pagination__link[href="/all-service-transactions/test?page=1"]').withText('1')
    body.should.containSelector('a.govuk-link.govuk-pagination__link[href="/all-service-transactions/test?page=2"]').withText('2')
    body.should.containSelector('a.govuk-link.govuk-pagination__link[href="/all-service-transactions/test?page=3"]').withText('3')
    body.should
      .containSelector('div.govuk-pagination__next a.govuk-link.govuk-pagination__link span.govuk-pagination__link-title')
      .withText('Next')
  })

  it('should display ellipsis instead if two less or two more than current page but not first or last page', () => {
    const templateData = transactionsTemplateData(filters(5), getAllLinks(10))
    const body = render('transactions/paginator', templateData)

    body.should.containSelector('div.pagination')
    body.should.containSelector('div.govuk-pagination__prev')
    body.should.containSelector('a.govuk-link.govuk-pagination__link').withText('Previous page')
    body.should.containSelector('div.govuk-pagination__next').withText('Next page')
    body.should.containSelector('a.govuk-link.govuk-pagination__link[href="/all-service-transactions/test?page=1"]').withText('1')
    body.should.containSelector('li.govuk-pagination__item.govuk-pagination__item--ellipses').withText('⋯')
    body.should.containSelector('a.govuk-link.govuk-pagination__link[href="/all-service-transactions/test?page=10"]').withText('10')
  })

  it('should display correct pagination links with the correct href links when on last page', () => {
    const templateData = transactionsTemplateData(filters(10), getAllLinks(10))
    const body = render('transactions/paginator', templateData)

    body.should.containSelector('div.pagination')
    body.should.containSelector('div.govuk-pagination__prev')
    body.should.containSelector('div.govuk-pagination__prev').withText('Previous page')
    body.should.not.containSelector('div.govuk-pagination__next').withText('Next page')
    body.should.containSelector('div.govuk-pagination__prev a.govuk-link.govuk-pagination__link[href="/all-service-transactions/test?page=9"]').withAttribute('rel', 'prev')
    body.should.containSelector('a.govuk-link.govuk-pagination__link[href="/all-service-transactions/test?page=10"]').withText('10')
    body.should.containSelector('a.govuk-link.govuk-pagination__link[href="/all-service-transactions/test?page=9"]').withText('9')
    body.should.not.containSelector('a.govuk-link.govuk-pagination__link[href="/all-service-transactions/test?page=8"]').withText('8')
    body.should.containSelector('li.govuk-pagination__item.govuk-pagination__item--ellipses').withText('⋯')
    body.should
      .containSelector('div.govuk-pagination__prev a.govuk-link.govuk-pagination__link span.govuk-pagination__link-title')
      .withText('Previous')
  })

  const filters = (pageNum) => ({ page: pageNum })

  const getAllLinks = (numPages) => {
    return Array.from({ length: numPages }, (_, index) =>
      `/all-service-transactions/test?page=${index + 1}`
    )
  }

  const getPrevAndNextLinks = (page, pageCount) => {
    return {
      prev: page > 1 ? `/all-service-transactions/test?page=${page - 1}` : null,
      next: page < pageCount ? `/all-service-transactions/test?page=${page + 1}` : null
    }
  }

  const transactionsTemplateData = (filters, getAllLinks) => {
    const paginationLinks = getPrevAndNextLinks(filters.page, getAllLinks.length)

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
      filters,
      getAllLinks,
      previousPage: paginationLinks.prev,
      nextPage: paginationLinks.next,
      hasPaginationLinks: true,
      selectedState: 'Testing2',
      hasResults: true
    }
  }
})
