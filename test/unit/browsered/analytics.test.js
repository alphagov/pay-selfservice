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
    setupWindow('https://selfservice.service.payments.gov.uk/search?fromDate=2020-01-01')
    analytics.setupAnalytics()
    expect(ga.callCount).equals(12)
    expect(ga.getCall(0).calledWith('create', 'test-analytics-id', '.service.payments.gov.uk')).equals(true)
    expect(ga.getCall(1).calledWith('set', 'anonymizeIp', true)).equals(true)
    expect(ga.getCall(2).calledWith('set', 'displayFeaturesTask', null)).equals(true)
    expect(ga.getCall(3).calledWith('set', 'transport', 'beacon')).equals(true)

    expect(ga.getCall(4).calledWith('create',
      'linked-tracking-id', '.service.payments.gov.uk', 'govuk_shared', { 'allowLinker': true })).equals(true)
    expect(ga.getCall(5).calledWith('govuk_shared.require', 'linker')).equals(true)
    expect(ga.getCall(6).calledWith('govuk_shared.set', 'anonymizeIp')).equals(true)
    expect(ga.getCall(7).calledWith('govuk_shared.linker:autoLink', ['www.gov.uk'])).equals(true)
    expect(ga.getCall(8).calledWith('set', 'location', 'https://selfservice.service.payments.gov.uk/search?fromDate=2020-01-01')).equals(true)
    expect(ga.getCall(9).calledWith('govuk_shared.set', 'location', 'https://selfservice.service.payments.gov.uk/search?fromDate=2020-01-01')).equals(true)
  })

  describe('filter PII', () => {
    it('should redact fields where the user can freely enter text', () => {
      setupWindow('https://selfservice.service.payments.gov.uk/search?fromDate=2020-01-01&email=test@example.test&toDate=2020-01-01&reference=a-unique-reference&lastDigitsCardNumber=1234&cardholderName=A+Test+User')
      analytics.setupAnalytics()
      sinon.assert.calledWith(ga, 'set', 'location', 'https://selfservice.service.payments.gov.uk/search?fromDate=2020-01-01&email=USER_PROVIDED_VALUE_WAS_REMOVED&toDate=2020-01-01&reference=USER_PROVIDED_VALUE_WAS_REMOVED&lastDigitsCardNumber=1234&cardholderName=USER_PROVIDED_VALUE_WAS_REMOVED')
    })

    it('should do nothing if freely editable fields are not used', () => {
      setupWindow('https://selfservice.service.payments.gov.uk/search?fromDate=2020-01-01&email=&toDate=2020-01-01&reference=&cardholderName=')
      analytics.setupAnalytics()
      sinon.assert.calledWith(ga, 'set', 'location', 'https://selfservice.service.payments.gov.uk/search?fromDate=2020-01-01&email=&toDate=2020-01-01&reference=&cardholderName=')
    })
  })
})

function setupWindow(url) {
  window = new jsdom.JSDOM('', { url }).window
  document = window.document
}