var chai = require('chai');
var displayConverter = require('../../../app/utils/display_converter');

const expect = chai.expect;

describe('Display converter', function () {
  it('should add full_type to account if type is test', function () {
    let data = displayConverter({
      account: {
        type: 'test',
        payment_provider: 'sandbox'
      }
    }, {}, null);

    expect(data.currentGatewayAccount).to.deep.equal({
      type: 'test',
      payment_provider: 'sandbox',
      full_type: 'sandbox test'
    })
  });


  it('should add full_type with value live to account if type is live', function () {
    let data = displayConverter({
      account: {
        type: 'live',
        payment_provider: 'worldpay'
      }
    }, {}, {});

    expect(data.currentGatewayAccount).to.deep.equal({
      type: 'live',
      payment_provider: 'worldpay',
      full_type: 'live'
    })
  });
});
