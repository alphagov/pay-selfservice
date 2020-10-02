/* eslint no-global-assign: "off" */
/* eslint no-undef: "off" */
const analytics = require('../../../app/browsered/analytics')
const sinon = require('sinon')
const jsdom = require('jsdom')

describe('analytics setup', () => {
  beforeEach(() => {
    analyticsTrackingId = 'test-analytics-id'
    linkedTrackingId = 'linked-tracking-id'
    ga = sinon.spy()
  })
  it('should invoke analytics with correct params ', () => {
    window = new jsdom.JSDOM(``, {
      url: 'https://example.org/search?from_date=2020-01-01'
    }).window
    document = window.document
    analytics.setupAnalytics()
    expect(ga.callCount).toBe(11)
    expect(ga.getCall(0).calledWith('create', 'test-analytics-id', 'auto')).toBe(true)
    expect(ga.getCall(1).calledWith('set', 'anonymizeIp', true)).toBe(true)
    expect(ga.getCall(2).calledWith('set', 'displayFeaturesTask', null)).toBe(true)
    expect(ga.getCall(3).calledWith('set', 'transport', 'beacon')).toBe(true)

    expect(ga.getCall(4).calledWith('create',
      'linked-tracking-id', 'auto', 'govuk_shared', { 'allowLinker': true })).toBe(true)
    expect(ga.getCall(5).calledWith('govuk_shared.require', 'linker')).toBe(true)
    expect(ga.getCall(6).calledWith('govuk_shared.linker.set', 'anonymizeIp')).toBe(true)
    expect(ga.getCall(7).calledWith('govuk_shared.linker:autoLink', ['www.gov.uk'])).toBe(true)
    expect(ga.getCall(8).calledWith('set', 'page', '/search?from_date=2020-01-01')).toBe(true)
  })

  it('should filter PII correctly ', () => {
    window = new jsdom.JSDOM(``, {
      url: 'https://example.org/search?from_date=2020-01-01&email=test@example.org&to_date=2020-01-01'
    }).window
    document = window.document
    analytics.setupAnalytics()

    expect(ga.getCall(8).calledWith('set', 'page',
      '/search?from_date=2020-01-01&email=&to_date=2020-01-01')).toBe(true)
  })
})
