var renderTemplate = require(__dirname + '/utils/html_assertions.js').render;
var should = require('chai').should();

describe('The charge view', function() {

  it('should render the amount', function () {
    var templateData = {
      'amount' : '50.00'
    };

    var body = renderTemplate('charge', templateData);
    body.should.containSelector('#amount').withText('£50.00');
  });

  it('should have a submit form.', function () {
    var postAction = "/post_card_path";
    var templateData = {
      'post_card_action' : postAction
    };

    var body = renderTemplate('charge', templateData);

    body.should.containSelector('form#cardDetails').withAttributes(
        {
          action: postAction,
          method: "POST",
          name: "cardDetails"
        });
  });

  it('should have a \'Back to service\' button.', function () {
    var serviceUrl = "http://example.com/service";
    var templateData = {
      'service_url' : serviceUrl
    };

    var body = renderTemplate('charge', templateData);
    body.should.containSelector('#back').withAttribute('href', serviceUrl);
  });

  it('should not show the \'Back to service\' when no service_url passed.', function () {
    var body = renderTemplate('charge', {});
    body.should.not.containSelector('#back');
  });

  it('should have a \'Make payment\' button.', function () {
    var body = renderTemplate('charge', {});
    body.should.containInputField('submitCardDetails', 'submit');
  });

  it('should show all input fields.', function () {
     var body = renderTemplate('charge', {'charge_id' : '1234'});
     body.should.containInputField('cardNo', 'text').withAttribute('maxlength', '19').withLabel('cardNo-lbl', 'Card number');
     body.should.containInputField('cvc', 'text').withAttribute('maxlength', '3').withLabel('cvc-lbl', 'Card security code');
     body.should.containInputField('expiryDate', 'text').withAttribute('maxlength', '5').withLabel('expiryDate-lbl', 'Expiry date');
     body.should.containInputField('cardholderName', 'text').withAttribute('maxlength', '200').withLabel('cardholderName-lbl', 'Name on card');
     body.should.containInputField('addressLine1', 'text').withAttribute('maxlength', '100').withLabel('addressLine1-lbl', 'Billing address');
     body.should.containInputField('addressLine2', 'text').withAttribute('maxlength', '100');
     body.should.containInputField('addressLine3', 'text').withAttribute('maxlength', '100');
     body.should.containInputField('addressCity', 'text').withAttribute('maxlength', '100').withLabel('addressCity-lbl', 'Town or city');
     body.should.containInputField('addressCounty', 'text').withAttribute('maxlength', '100').withLabel('addressCounty-lbl', 'County');
     body.should.containInputField('addressPostcode', 'text').withAttribute('maxlength', '10').withLabel('addressPostcode-lbl', 'Postcode');
     body.should.containInputField('chargeId', 'hidden').withAttribute('value', '1234');
  });
});

describe('The confirm view', function () {

  it('should render cardNumber, expiryDate, amount and cardholder details fields', function () {
    var templateData = {
      'cardNumber': "************5100",
      'expiryDate': "11/99",
      'amount': "10.00",
      'cardholderName': 'Francisco Blaya-Gonzalvez',
      'address': '1 street lane, avenue city, AB1 3DF',
      'serviceName': 'Service 1'
    };

    var body = renderTemplate('confirm', templateData);
    body.should.containSelector('#cardNumber').withText('************5100');
    body.should.containSelector('#expiryDate').withText('11/99');
    body.should.containSelector('#amount').withText('£10.00');
    body.should.containSelector('#cardholderName').withText('Francisco Blaya-Gonzalvez');
    body.should.containSelector('#address').withText('1 street lane, avenue city, AB1 3DF');
    body.should.containSelector('#serviceName').withText('Service 1');

  });

  it('should render a back link', function () {
    var body = renderTemplate('confirm', {backUrl: 'some.url'});
    body.should.containSelector('a#back').withText("Back").withAttribute("href", "some.url");
  });

  it('should render a confirm button', function () {
    var body = renderTemplate('confirm', {confirmUrl: '/card_details/123/confirm', 'charge_id': 1234});
    body.should.containSelector('form#confirmation').withAttributes(
        {
          action: '/card_details/123/confirm',
          method: "POST"
        });
    body.should.containSelector('button#confirm').withText("Confirm");
    body.should.containInputField('chargeId', 'hidden').withAttribute('value', '1234');
  });
  
});