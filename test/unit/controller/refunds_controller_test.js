'use strict'

// NPM dependencies
const sinon = require('sinon')
const {expect} = require('chai')
const nock = require('nock')

// Custom dependencies
const refundController = require('../../../app/controllers/transactions/transaction_refund_controller.js')

// Global setup
let req, res

describe('Refund scenario:', function () {
  beforeEach(function () {
    req = {}
    req.headers = {
      'x-request-id': '1234'
    }
    req.user = {
      externalId: '92734386'
    }
    req.service = {
      gatewayAccountIds: ['123', '456']
    }
    req.gateway_account = {
      currentGatewayAccountId: '123'
    }
    req.params = {
      chargeId: '123456'
    }
    req.body = {
      'refund-type': 'full',
      'refund-amount-available-in-pence': '5000',
      'full-amount': '5000'
    }
    req.flash = sinon.spy()

    res = {
      redirect: sinon.spy()
    }
  })

  it('should redirect back to transaction details and show refund sucess message', function (done) {
    var mockRefundResponse = {
      'refund_id': 'Just looking the status code of the response at the moment'
    }
    nock(process.env.CONNECTOR_URL).post('/v1/api/accounts/' + '123' + '/charges/' + '123456' + '/refunds', {
      'user_external_id': req.user.externalId,
      'amount': 500000,
      'refund_amount_available': 5000
    })
    .reply(202, mockRefundResponse)

    refundController(req, res).then(() => {
      expect(res.redirect.calledWith('/transactions/123456')).to.equal(true)
      expect(req.flash.calledWith('generic', '<h2>Refund successful</h2> It may take up to 6 days to process.')).to.equal(true)
    }).should.notify(done)
  })

  it('should redirect back to transaction details and show error message if refund amount is greater than initial charge', function (done) {
    var mockRefundResponse = {
      'refund_id': 'Just looking the status code of the response at the moment'
    }
    nock(process.env.CONNECTOR_URL).post('/v1/api/accounts/' + '123' + '/charges/' + '123456' + '/refunds', {
      'user_external_id': req.user.externalId,
      'amount': 600000,
      'refund_amount_available': 5000
    })
    .reply(400, mockRefundResponse)

    refundController(req, res).catch(() => {
      expect(res.redirect.calledWith('/transactions/123456')).to.equal(true)
      expect(req.flash.calledWith('genericError', '<h2>Select another amount</h2> The amount you tried to refund is greater than the transaction total')).to.equal(true)
    }).should.notify(done)
  })

  it('should redirect back to transaction details and show error message if refund amount is smaller than minimum accepted', function (done) {
    var mockRefundResponse = {
      'refund_id': 'Just looking the status code of the response at the moment'
    }
    nock(process.env.CONNECTOR_URL).post('/v1/api/accounts/' + '123' + '/charges/' + '123456' + '/refunds', {
      'user_external_id': req.user.externalId,
      'amount': 1,
      'refund_amount_available': 5000
    })
    .reply(400, mockRefundResponse)

    refundController(req, res).catch(() => {
      expect(res.redirect.calledWith('/transactions/123456')).to.equal(true)
      expect(req.flash.calledWith('genericError', '<h2>Select another amount</h2> The amount you tried to refund is less than the accepted minimum for this transaction.')).to.equal(true)
    }).should.notify(done)
  })

  it('should redirect back to transaction details and show error message if refund request has already been submitted', function (done) {
    var mockRefundResponse = {
      'message': 'Precondition Failed!'
    }
    nock(process.env.CONNECTOR_URL).post('/v1/api/accounts/' + '123' + '/charges/' + '123456' + '/refunds', {
      'user_external_id': req.user.externalId,
      'amount': 1,
      'refund_amount_available': 5000
    })
    .reply(400, mockRefundResponse)

    refundController(req, res).catch(() => {
      expect(res.redirect.calledWith('/transactions/123456')).to.equal(true)
      expect(req.flash.calledWith('genericError', '<h2>Repeat request</h2> This refund request has already been submitted. Refresh your transactions list.')).to.equal(true)
    }).should.notify(done)
  })

  it('should redirect back to transaction details and show error message if refund request has already been fully refunded', function (done) {
    var mockRefundResponse = {
      'reason': 'full'
    }
    nock(process.env.CONNECTOR_URL).post('/v1/api/accounts/' + '123' + '/charges/' + '123456' + '/refunds', {
      'user_external_id': req.user.externalId,
      'amount': 1,
      'refund_amount_available': 5000
    })
    .reply(400, mockRefundResponse)

    refundController(req, res).catch(() => {
      expect(res.redirect.calledWith('/transactions/123456')).to.equal(true)
      expect(req.flash.calledWith('Repeat request<h2> This </h2>refund request has already been submitted. Refresh your transactions list.')).to.equal(true)
    }).should.notify(done)
  })

  it('should redirect back to transaction details and show error message if unexpected error has occured', function (done) {
    var mockRefundResponse = {
      'message': 'what happeneeed!'
    }
    nock(process.env.CONNECTOR_URL).post('/v1/api/accounts/' + '123' + '/charges/' + '123456' + '/refunds', {
      'user_external_id': req.user.externalId,
      'amount': 1,
      'refund_amount_available': 5000
    })
    .reply(400, mockRefundResponse)

    refundController(req, res).catch(() => {
      expect(res.redirect.calledWith('/transactions/123456')).to.equal(true)
      expect(req.flash.calledWith('genericError', '<h2>Refund failed</h2> We couldn’t process this refund. Try again later.')).to.equal(true)
    }).should.notify(done)
  })
})
