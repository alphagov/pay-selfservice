/* eslint no-global-assign: "off" */
/* eslint no-undef: "off" */
const analytics = require('../../../app/browsered/analytics')
const sinon = require('sinon')
const jsdom = require('jsdom')
const { expect } = require('chai')

describe('analytics setup', () => {
  beforeEach(() => {
    analyticsTrackingId = 'test-analytics-id'
    linkedTrackingId = 'linked-tracking-id'
    ga = sinon.spy()
  })
  it('should invoke analytics with correct params ', () => {
    window = new jsdom.JSDOM('', {
      url: 'https://selfservice.service.payments.gov.uk/search?from_date=2020-01-01'
    }).window
    document = window.document
    analytics.setupAnalytics()
    expect(ga.callCount).equals(11)
    expect(ga.getCall(0).calledWith('create', 'test-analytics-id', '.service.payments.gov.uk')).equals(true)
    expect(ga.getCall(1).calledWith('set', 'anonymizeIp', true)).equals(true)
    expect(ga.getCall(2).calledWith('set', 'displayFeaturesTask', null)).equals(true)
    expect(ga.getCall(3).calledWith('set', 'transport', 'beacon')).equals(true)

    expect(ga.getCall(4).calledWith('create',
      'linked-tracking-id', '.service.payments.gov.uk', 'govuk_shared', { allowLinker: true })).equals(true)
    expect(ga.getCall(5).calledWith('govuk_shared.require', 'linker')).equals(true)
    expect(ga.getCall(6).calledWith('govuk_shared.linker.set', 'anonymizeIp')).equals(true)
    expect(ga.getCall(7).calledWith('govuk_shared.linker:autoLink', ['www.gov.uk'])).equals(true)
    expect(ga.getCall(8).calledWith('set', 'page', '/search?from_date=2020-01-01')).equals(true)
  })

  it('should filter PII correctly ', () => {
    window = new jsdom.JSDOM('', {
      url: 'https://selfservice.service.payments.gov.uk/search?from_date=2020-01-01&email=test@example.org&to_date=2020-01-01'
    }).window
    document = window.document
    analytics.setupAnalytics()

    expect(ga.getCall(8).calledWith('set', 'page',
      '/search?from_date=2020-01-01&email=&to_date=2020-01-01')).equals(true)
  })
})
