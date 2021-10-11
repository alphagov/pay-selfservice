'use strict'

const sinon = require('sinon')
const { expect } = require('chai')
const controller = require('../../../../app/controllers/make-a-demo-payment/edit.controller')

describe('Edit demo payment', () => {
  let res, next
  beforeEach(() => {
    res = {
      render: sinon.spy(),
      redirect: sinon.spy()
    }
    next = sinon.spy()
  })

  describe('Update payment amount controller', () => {
    it('should render with error if amount is blank', () => {
      const req = {
        body: {
          'payment-amount': ''
        },
        session: {
          pageData: {
            makeADemoPayment: {
              paymentAmount: 2000
            }
          }
        }
      }
      controller.updateAmount(req, res, next)
      const errorMatcher = sinon.match.has(
        'errors',
        sinon.match.has('amount', 'Enter an amount in pounds and pence using digits and a decimal point. For example “10.50”'))
      const amountMatcher = sinon.match.has('paymentAmount', 2000)
      sinon.assert.calledWith(res.render, 'dashboard/demo-payment/edit-amount', errorMatcher)
      sinon.assert.calledWith(res.render, 'dashboard/demo-payment/edit-amount', amountMatcher)
      expect(req.session.pageData.makeADemoPayment.paymentAmount).to.equal(2000)
    })

    it('should render with error if amount is not valid currency', () => {
      const req = {
        body: {
          'payment-amount': '20.000'
        },
        session: {
          pageData: {
            makeADemoPayment: {
              paymentAmount: 2000
            }
          }
        }
      }
      controller.updateAmount(req, res, next)
      const errorMatcher = sinon.match.has(
        'errors',
        sinon.match.has('amount', 'Enter an amount in pounds and pence using digits and a decimal point. For example “10.50”'))
      const amountMatcher = sinon.match.has('paymentAmount', 2000)
      sinon.assert.calledWith(res.render, 'dashboard/demo-payment/edit-amount', errorMatcher)
      sinon.assert.calledWith(res.render, 'dashboard/demo-payment/edit-amount', amountMatcher)
      expect(req.session.pageData.makeADemoPayment.paymentAmount).to.equal(2000)
    })

    it('should render with error if amount is above the maximum', () => {
      const req = {
        body: {
          'payment-amount': '200000'
        },
        session: {
          pageData: {
            makeADemoPayment: {
              paymentAmount: 2000
            }
          }
        }
      }
      controller.updateAmount(req, res, next)
      const errorMatcher = sinon.match.has(
        'errors',
        sinon.match.has('amount', 'Enter an amount under £100,000'))
      const amountMatcher = sinon.match.has('paymentAmount', 2000)
      sinon.assert.calledWith(res.render, 'dashboard/demo-payment/edit-amount', errorMatcher)
      sinon.assert.calledWith(res.render, 'dashboard/demo-payment/edit-amount', amountMatcher)
      expect(req.session.pageData.makeADemoPayment.paymentAmount).to.equal(2000)
    })

    it('should redirect to index if valid amount', () => {
      const accountExternalId = 'an-external-id'
      const req = {
        account: {
          external_id: accountExternalId
        },
        body: {
          'payment-amount': '99999.99'
        },
        session: {
          pageData: {
            makeADemoPayment: {
              paymentAmount: 2000
            }
          }
        }
      }
      controller.updateAmount(req, res, next)
      sinon.assert.calledWith(res.redirect, `/account/${accountExternalId}/make-a-demo-payment`)
      expect(req.session.pageData.makeADemoPayment.paymentAmount).to.equal(9999999)
    })
  })
})
