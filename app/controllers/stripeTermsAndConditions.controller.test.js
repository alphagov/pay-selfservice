const controller = require('./stripeTermsAndConditions.controller')
const sinon = require('sinon')

const req = {}
const res = {
  render: sinon.spy()
}

describe('Stripe terms and conditions controller', function () {
  it('should render page', function () {
    controller.get(req, res)
    sinon.assert.calledWith(res.render, 'policy/stripe-terms-and-conditions/stripe-terms-and-conditions')
  })
})
