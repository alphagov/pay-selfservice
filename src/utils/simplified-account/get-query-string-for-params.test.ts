import { expect } from 'chai'
import { describe, it, beforeEach, afterEach } from 'mocha'
import sinon from 'sinon'
import querystring from 'querystring'
import getQueryStringForParams, { QueryParams } from './get-query-string-for-params'
import { fromDateToApiFormat, toDateToApiFormat } from './dates'

describe('getQueryStringForParams utils tests', () => {
  let clock: sinon.SinonFakeTimers

  beforeEach(() => {
    clock = sinon.useFakeTimers(new Date())
  })

  afterEach(() => {
    clock.restore()
    sinon.restore()
  })

  it('builds full query string with arrays and pagination', () => {
    const params: QueryParams = {
      reference: 'ref123',
      email: 'a@b.com',
      cardholderName: 'John Doe',
      lastDigitsCardNumber: '1234',
      brand: ['Visa', 'Mastercard'],
      gatewayPayoutId: 'gp1',
      fromDate: '1/1/2025',
      fromTime: '00:00:00',
      toDate: '1/1/2025',
      toTime: '12:34:56',
      feeHeaders: 'fee-header',
      motoHeader: 'moto-header',
      metadataValue: 'meta',
      agreementId: 'agr',
      page: 2,
      pageSize: 50,
      payment_states: ['success', 'failed'],
      refund_states: 'pending',
      dispute_states: ['open'],
    }

    const qs = getQueryStringForParams(params)
    const parsed = querystring.parse(qs)

    expect(parsed.reference).to.equal('ref123')
    expect(parsed.email).to.equal('a@b.com')
    expect(parsed.cardholder_name).to.equal('John Doe')
    expect(parsed.last_digits_card_number).to.equal('1234')
    expect(parsed.card_brand).to.equal('Visa,Mastercard')
    expect(parsed.gateway_payout_id).to.equal('gp1')
    expect(parsed.fee_headers).to.equal('fee-header')
    expect(parsed.moto_header).to.equal('moto-header')
    expect(parsed.metadata_value).to.equal('meta')
    expect(parsed.agreement_id).to.equal('agr')

    expect(parsed.from_date).to.equal(fromDateToApiFormat('1/1/2025', '00:00:00'))
    expect(parsed.to_date).to.equal(toDateToApiFormat('1/1/2025', '12:34:56'))

    expect(parsed.page).to.equal('2')
    expect(parsed.display_size).to.equal('50')

    expect(parsed.payment_states).to.equal('success,failed')
    expect(parsed.refund_states).to.equal('pending')
    expect(parsed.dispute_states).to.equal('open')
  })

  it('flattens card brands when requested and removes original card_brand key', () => {
    const params: QueryParams = {
      brand: ['Visa', 'Amex'],
    }

    const qs = getQueryStringForParams(params, false, true)
    const parsed = querystring.parse(qs)

    expect(parsed.card_brands).to.equal('Visa,Amex')
    expect(parsed.card_brand).to.be.undefined
  })

  it('omits empty or falsy params when removeEmptyParams is true', () => {
    const params: QueryParams = {
      reference: '',
      email: undefined,
      brand: [],
      fromDate: '32/13/2025',
      page: undefined,
    }

    const qs = getQueryStringForParams(params, true)
    const parsed = querystring.parse(qs)

    expect(parsed.reference).to.be.undefined
    expect(parsed.email).to.be.undefined

    expect(parsed.card_brand).to.be.undefined

    expect(parsed.from_date).to.be.undefined

    expect(parsed.page).to.equal('1')
    expect(parsed.display_size).to.equal('100')
  })

  it('ignores pagination when ignorePagination flag is true', () => {
    const params: QueryParams = {
      page: 10,
      pageSize: 999,
    }

    const qs = getQueryStringForParams(params, false, false, true)
    const parsed = querystring.parse(qs)

    expect(parsed.page).to.be.undefined
    expect(parsed.display_size).to.be.undefined
  })

  it('handles missing date/time inputs: fromDate missing => empty from_date, toDate missing => to_date default', () => {
    const qs = getQueryStringForParams({ fromTime: '00:00:00', toDate: '1/1/2025' })
    const parsed = querystring.parse(qs)

    expect(parsed.from_date).to.equal(fromDateToApiFormat(undefined, '00:00:00'))
    expect(parsed.to_date).to.equal(toDateToApiFormat('1/1/2025', undefined))
  })
})
