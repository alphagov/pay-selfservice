var request = require('supertest');
var portfinder = require('portfinder');
var nock = require('nock');
var app = require(__dirname + '/../server.js').getApp;
var should = require('chai').should();

var winston = require('winston');

portfinder.getPort(function(err, connectorPort) {

  var localServer = 'http://localhost:' + connectorPort;

  var gatewayAccountId = 452345;
  var connectorChargesPath = '/v1/frontend/charges';
  var txListPath = '/transactions/' + gatewayAccountId;

  var connectorMock = nock(localServer);

  function connector_expects() {
    return connectorMock.get(connectorChargePath + "?gatewayAccountId=" + gatewayAccountId);
  }

  function get_transaction_list() {
    return request(app)
        .get(txListPath)
        .set('Accept', 'application/json');
  }

  beforeEach(function() {
    nock.cleanAll();
  });

  before(function () {
    // Disable logging.
    winston.level = 'none';
  });

  describe('The /transactions endpoint', function() {
    it('should return a list of transactions for the gateway account', function (done) {
      get_transaction_list()
        .expect(200, { 'result': [

                      ]})
                    'amount': '23.45',
                    'charge_id': chargeId,
                    'service_url': serviceUrl,
                    'post_card_action': frontendCardDetailsPath
      get_charge_request(app, cookieValue, chargeId)
          .expect(function (res) {
            var session = cookie.decrypt(res, chargeId);
            should.equal(session.amount, 2345);
          })
          .expect(200, {
            'amount': '23.45',
            'charge_id': chargeId,
            'service_url': serviceUrl,
            'post_card_action': frontendCardDetailsPath
      }).end(done);
    });

    it('should send clean card data to connector', function(done) {
      var cookieValue = cookie.create(chargeId);

      default_connector_response_for_get_charge(connectorPort, chargeId, 'CREATED');

      connector_expects(minimum_connector_card_data('5105105105105100'))
          .reply(204);

      post_charge_request(cookieValue, minimum_form_card_data('5105 1051 0510 5100'))
          .expect(303)
          .expect('Location', frontendCardDetailsPath + '/' + chargeId + '/confirm')
          .end(done);
    });

    it('should send card data including optional fields to connector', function (done) {
      var cookieValue = cookie.create(chargeId);

      default_connector_response_for_get_charge(connectorPort, chargeId, 'CREATED');

      var card_data = full_connector_card_data('5105105105105100');

      connector_expects(card_data).reply(204);

      var form_data = minimum_form_card_data('5105105105105100');
      form_data.addressLine2 = card_data.address.line2;
      form_data.addressLine3 = card_data.address.line3;
      form_data.addressCity = card_data.address.city;
      form_data.addressCounty = card_data.address.county;

      post_charge_request(cookieValue, form_data)
          .expect(303)
          .expect('Location', frontendCardDetailsPath + '/' + chargeId + '/confirm')
          .end(done);
    });

    it('should add card data including optional fields to the chargeIds session', function (done) {
      var cookieValue = cookie.create(chargeId);

      default_connector_response_for_get_charge(connectorPort, chargeId, 'CREATED');

      connectorMock.post(connectorChargePath + chargeId + '/cards').reply(204);

      var card_data = full_connector_card_data('5105105105105100');
      var form_data = minimum_form_card_data('5105105105105100');

      form_data.addressLine2 = card_data.address.line2;
      form_data.addressLine3 = card_data.address.line3;
      form_data.addressCity = card_data.address.city;
      form_data.addressCounty = card_data.address.county;

      var address = '32 Whip Ma Whop Ma Avenue, bla bla, blublu, London, Greater London, Y1 1YN';

      post_charge_request(cookieValue, form_data)
          .expect(303, {})
          .expect(function(res) {
                    var session = cookie.decrypt(res, chargeId);
                    should.equal(session.cardNumber, "************5100");
                    should.equal(session.expiryDate, '11/99');
                    should.equal(session.cardholderName, 'Jimi Hendrix');
                    should.equal(session.address, address);
                    should.equal(session.serviceName, "Demo Service");
                  })
          .end(done);
    });

    it('show an error page when authorization was refused', function(done) {
      var cookieValue = cookie.create(chargeId);

      default_connector_response_for_get_charge(connectorPort, chargeId, 'CREATED');

      connector_expects(minimum_connector_card_data('5105105105105100'))
          .reply(400, {'message': 'This transaction was declined.'});

      post_charge_request(cookieValue, minimum_form_card_data('5105105105105100'))
          .expect(200, {'message': 'Payment could not be processed, please contact your issuing bank'})
          .end(done);
    });

    it('show an error page when the chargeId is not found on the session', function(done) {
      var cookieValue = cookie.create();

      var card_data = minimum_connector_card_data('5105105105105100');
      card_data.address.line2 = 'bla bla';
      card_data.address.line3 = 'blublu';
      card_data.address.city = 'London';
      card_data.address.county = 'Greater London';
      card_data.address.country = 'GB';

      connector_expects(card_data).reply(204);

      var form_data = minimum_form_card_data('5105105105105100');
      form_data.addressLine2 = card_data.address.line2;
      form_data.addressLine3 = card_data.address.line3;
      form_data.addressCity = card_data.address.city;
      form_data.addressCounty = card_data.address.county;

      post_charge_request(cookieValue, form_data)
        .expect(200, {
          'message' : 'There is a problem with the payments platform'
        }, done);
    });

    it('shows an error when a card is submitted that does not pass the luhn algorithm', function (done) {
      var cookieValue = cookie.create(chargeId);

      post_charge_request(cookieValue, minimum_form_card_data('1111111111111111'))
          .expect(200, {'message': 'You probably mistyped the card number. Please check and try again.'})
          .end(done);
    });

    it('should ignore empty/null address lines when second address line populated', function (done) {
      var cookieValue = cookie.create(chargeId);

      var card_data = minimum_connector_card_data('5105105105105100');
      card_data.address.line1 = 'bla bla';
      card_data.address.line2 = 'blublu';
      delete card_data.address.line3;

      default_connector_response_for_get_charge(connectorPort, chargeId, 'CREATED');
      connector_expects(card_data).reply(204);
      var form_data = minimum_form_card_data('5105105105105100');
      form_data.addressLine1 = '';
      form_data.addressLine2 = card_data.address.line1;
      form_data.addressLine3 = card_data.address.line2;

      post_charge_request(cookieValue, form_data)
                .expect(303, EMPTY_BODY)
                .expect('Location', frontendCardDetailsPath + '/' + chargeId + '/confirm')
                .end(done);
    });

    it('should ignore empty/null address lines when only third address line populated', function (done) {
      var cookieValue = cookie.create(chargeId);

      var card_data = minimum_connector_card_data('5105105105105100');
      card_data.address.line1 = 'bla bla';
      delete card_data.address.line2;
      delete card_data.address.line3;

      default_connector_response_for_get_charge(connectorPort, chargeId, 'CREATED');

      connector_expects(card_data).reply(204);
      var form_data = minimum_form_card_data('5105105105105100');
      form_data.addressLine1 = '';
      form_data.addressLine2 = '';
      form_data.addressLine3 = card_data.address.line1;

      post_charge_request(cookieValue, form_data)
                .expect(303, EMPTY_BODY)
                .expect('Location', frontendCardDetailsPath + '/' + chargeId + '/confirm')
                .end(done);
    });

    it('should pass through empty address lines when the first and third address line are populated', function (done) {
      var cookieValue = cookie.create(chargeId);

      var card_data = minimum_connector_card_data('5105105105105100');
      card_data.address.line1 = '31 gated avenue';
      card_data.address.line2 = 'Hampshire';
      delete card_data.address.line3;

      default_connector_response_for_get_charge(connectorPort, chargeId, 'CREATED');

      connector_expects(card_data).reply(204);
      var form_data = minimum_form_card_data('5105105105105100');
      form_data.addressLine1 = card_data.address.line1;
      form_data.addressLine2 = '';
      form_data.addressLine3 = card_data.address.line2;

      post_charge_request(cookieValue, form_data)
                .expect(303, EMPTY_BODY)
                .expect('Location', frontendCardDetailsPath + '/' + chargeId + '/confirm')
                .end(done);
    });

    it('show an error page when the chargeId is not found on the session', function(done) {
      var cookieValue = cookie.create();

      connectorMock.post(connectorChargePath + chargeId + '/cards', {
        'card_number' : '5105105105105100',
        'cvc' : '234',
        'expiry_date' : '11/99'
      }).reply(400, { 'message': 'This transaction was declined.' });

      request(app)
        .post(frontendCardDetailsPath)
        .set('Cookie', ['session_state=' + cookieValue])
        .send({
          'chargeId'  : chargeId,
          'cardNo'    : '5105 1051 0510 5100',
          'cvc'       : '234',
          'expiryDate': '11/99'
        })
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Accept', 'application/json')
        .expect(function(res) {
          should.not.exist(res.headers['set-cookie']);
        })
        .expect(200, {
          'message' : 'There is a problem with the payments platform'
        }, done);
    });

  });

  describe('The /card_details/charge_id/confirm endpoint', function () {
    var fullSessionData = {
      'amount': 1000,
      'cardNumber': "************5100",
      'expiryDate': "11/99",
      'cardholderName': 'T Eulenspiegel',
      'address': 'Kneitlingen, Brunswick, Germany',
      'serviceName': 'Pranks incorporated'
    };

    it('should return the data needed for the UI', function (done) {

      default_connector_response_for_get_charge(connectorPort, chargeId, 'AUTHORISATION SUCCESS');

      request(app)
        .get(frontendCardDetailsPath + '/' + chargeId + '/confirm')
        .set('Cookie', ['session_state=' + cookie.create(chargeId, fullSessionData)])
        .set('Accept', 'application/json')
        .expect(200, {
          'cardNumber': "************5100",
          'expiryDate': "11/99",
          'amount': "10.00",
          'cardholderName': "T Eulenspiegel",
          'address': 'Kneitlingen, Brunswick, Germany',
          'serviceName': 'Pranks incorporated',
          'backUrl': frontendCardDetailsPath + '/' + chargeId,
          'confirmUrl':  frontendCardDetailsPath + '/' + chargeId + '/confirm',
          'charge_id': chargeId
        }, done);
    });

    function missing_field_test(missing_field) {
      return function (done) {

        var sessionData = JSON.parse(JSON.stringify(fullSessionData));
        delete sessionData[missing_field];

        request(app)
            .get(frontendCardDetailsPath + '/' + chargeId + '/confirm')
            .set('Cookie', ['session_state=' + cookie.create(chargeId, sessionData)])
            .set('Accept', 'application/json')
            .expect(200, {
              'message': 'Session expired'
            }, done);
      };
    }

    ['amount', 'expiryDate', 'cardNumber', 'cardholderName', 'address', 'serviceName'].map(function (missing_field) {
      it('should display Session expired message if ' + missing_field + ' is not in the session', missing_field_test(missing_field));
    });

    it('should post to the connector capture url looked up from the connector when a post arrives', function (done) {
      default_connector_response_for_get_charge(connectorPort, chargeId, "CREATED");
      connectorMock.post(connectorChargePath + chargeId + "/capture", {}).reply(204);

      request(app)
          .post(frontendCardDetailsPath + '/' + chargeId + '/confirm')
          .set('Cookie', ['session_state=' + cookie.create(chargeId)])
          .set('Accept', 'application/json')
          .expect(303, {})
          .expect('Location', frontendCardDetailsPath + '/' + chargeId + '/confirmed')
          .end(done);
    });

    it('should produce an error if the connector responds with a 404 for the charge', function (done) {
      connectorMock.get(connectorChargePath + chargeId).reply(404);

      request(app)
          .post(frontendCardDetailsPath + '/' + chargeId + '/confirm')
          .set('Cookie', ['session_state=' + cookie.create(chargeId)])
          .set('Accept', 'application/json')
          .expect(200, {'message': 'There is a problem with the payments platform'}, done);
    });


    it('should produce an error if the connector returns a non-204 status', function (done) {
      default_connector_response_for_get_charge(connectorPort, chargeId, "CREATED");
      connectorMock.post(connectorChargePath + chargeId + "/capture", {}).reply(500);

      request(app)
          .post(frontendCardDetailsPath + '/' + chargeId + '/confirm')
          .set('Cookie', ['session_state=' + cookie.create(chargeId)])
          .set('Accept', 'application/json')
          .expect(200, {'message': 'There is a problem with the payments platform'}, done);
    });

    it('should produce an error if the connector is unreachable for the confirm', function (done) {
      default_connector_response_for_get_charge(connectorPort, chargeId, "CREATED");
      request(app)
          .post(frontendCardDetailsPath + '/' + chargeId + '/confirm')
          .set('Cookie', ['session_state=' + cookie.create(chargeId)])
          .set('Accept', 'application/json')
          .expect(200, {'message': 'There is a problem with the payments platform'}, done);
    });
  });
});
