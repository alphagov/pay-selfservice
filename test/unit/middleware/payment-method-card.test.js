'use strict'

const sinon = require('sinon')
const chai = require('chai')
const { expect } = chai
const chaiAsPromised = require('chai-as-promised')
const paymentMethodIsCard = require('../../../app/middleware/payment-method-card.js')

let res
let next

chai.use(chaiAsPromised)

describe('user has payment-method-card middleware', () => {
  beforeEach(() => {
    res = {
      setHeader: sinon.spy(),
      status: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
  })

  it('should call next when user is within card payment service', done => {
    const req = { account: { paymentMethod: 'card' } }

    paymentMethodIsCard(req, res, next)

    expect(next.called).to.be.true // eslint-disable-line

    done()
  })

  it('should redirect to error page if the user is using direct debit', done => {
    const req = { account: { paymentMethod: 'direct debit' } }

    paymentMethodIsCard(req, res, next)

    expect(next.notCalled).to.be.true // eslint-disable-line
    expect(res.status.calledWith(403))
    expect(res.render.calledWith('error'))

    done()
  })
})
