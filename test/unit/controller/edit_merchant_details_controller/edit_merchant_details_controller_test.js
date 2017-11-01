const sinon = require('sinon')
const proxyquire = require('proxyquire')
const chai = require('chai')
const expect = chai.expect
const mockResponses = {}
const mockServiceService = {}
const random = require('../../../../app/utils/random')
const merchantDetailsCtrl = proxyquire('../../../../app/controllers/edit_merchant_details_controller', {
  '../utils/response': mockResponses,
  '../services/service_service': mockServiceService
})
let req, res

describe('when the request body is correct', () => {
  before(done => {
    mockServiceService.updateMerchantDetails = sinon.stub().resolves()
    mockResponses.response = sinon.spy()
    req = {
      correlationId: random.randomUuid(),
      body: {
        'merchant-name': 'name',
        'address-line1': 'line1',
        'address-city': 'city',
        'address-postcode': 'postcode',
        'address-country': 'AZ'
      }
    }
    res = {
      redirect: sinon.spy()
    }
    const result = merchantDetailsCtrl.post(req, res)
    if (result) {
      result.then(() => done()).catch(done)
    } else {
      done(new Error('Didn\'t return a promise'))
    }
  })

  it(`should call 'res.redirect' and set the success notification in the session`, () => {
    expect(req.session.pageData.editMerchantDetails.success).to.be.true // eslint-disable-line
    expect(req.session.pageData.editMerchantDetails).not.to.have.property('errors')
    expect(res.redirect.called).to.equal(true)
    expect(res.redirect.args[0]).to.include('/merchant-details')
  })
})
describe('when the request body is correct, but the update call fails', () => {
  before(done => {
    mockServiceService.updateMerchantDetails = sinon.stub().rejects(new Error('somet went wrong'))
    mockResponses.renderErrorView = sinon.spy()
    req = {
      correlationId: random.randomUuid(),
      body: {
        'merchant-name': 'name',
        'address-line1': 'line1',
        'address-city': 'city',
        'address-postcode': 'postcode',
        'address-country': 'AZ'
      }
    }
    res = {}
    const result = merchantDetailsCtrl.post(req, res)
    if (result) {
      result.then(() => done()).catch(done)
    } else {
      done(new Error('Didn\'t return a promise'))
    }
  })
  it(`should call 'responses.renderErrorView' with req, res and the error received from the client`, () => {
    expect(mockResponses.renderErrorView.called).to.equal(true)
    expect(mockResponses.renderErrorView.args[0]).to.include(req)
    expect(mockResponses.renderErrorView.args[0]).to.include(res)
    expect(mockResponses.renderErrorView.args[0][2] instanceof Error).to.equal(true)
    expect(mockResponses.renderErrorView.args[0][2].message).to.equal('somet went wrong')
  })
})
describe('when the request body is missing mandatory fields', () => {
  before(done => {
    mockResponses.response = sinon.spy()
    req = {
      correlationId: random.randomUuid(),
      body: {
        'address-city': 'city',
        'address-postcode': 'postcode',
        'address-country': 'AZ'
      }
    }
    res = {
      redirect: sinon.spy()
    }
    const result = merchantDetailsCtrl.post(req, res)
    if (result) {
      done(new Error('Returned a promise'))
    } else {
      done()
    }
  })

  it(`should call 'res.redirect' and set all the errors in the session`, () => {
    expect(req.session.pageData.editMerchantDetails.success).to.be.false // eslint-disable-line
    expect(req.session.pageData.editMerchantDetails.errors).to.deep.equal({
      'merchant-name': true,
      'address-line1': true
    })
    expect(res.redirect.called).to.equal(true)
    expect(res.redirect.args[0]).to.include('/merchant-details')
  })
})

describe('when the postcode is invalid and the country is set to GB', () => {
  before(done => {
    mockResponses.response = sinon.spy()
    req = {
      correlationId: random.randomUuid(),
      body: {
        'merchant-name': 'name',
        'address-line1': 'line1',
        'address-city': 'city',
        'address-postcode': 'postcode',
        'address-country': 'GB'
      }
    }
    res = {
      redirect: sinon.spy()
    }
    const result = merchantDetailsCtrl.post(req, res)
    if (result) {
      done(new Error('Returned a promise'))
    } else {
      done()
    }
  })

  it(`should call 'res.redirect' and set the invalid postcode error in the session`, () => {
    expect(req.session.pageData.editMerchantDetails.success).to.be.false // eslint-disable-line
    expect(req.session.pageData.editMerchantDetails.errors).to.deep.equal({'address-postcode': true})
    expect(res.redirect.called).to.equal(true)
    expect(res.redirect.args[0]).to.include('/merchant-details')
  })
})
