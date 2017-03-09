var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

var displayConverter = require('../../../app/utils/display_converter');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Display converter', function() {
  it('should add full type to account if type is test', function() {
    let data = displayConverter(null, {}, null, {type: 'test', payment_provider: 'sandbox'});

    expect(data.currentGatewayAccount).to.deep.equal({
      type: 'test',
      payment_provider: 'sandbox',
      full_type: 'sandbox test'
    })
  });


  it('should add full type to account if type is live', function() {
    let data = displayConverter(null, {}, null, {type: 'live', payment_provider: 'worldpay'});

    expect(data.currentGatewayAccount).to.deep.equal({
      type: 'live',
      payment_provider: 'worldpay',
      full_type: 'live'
    })
  });
});