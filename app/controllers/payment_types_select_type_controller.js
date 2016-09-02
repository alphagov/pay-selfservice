var response = require('../utils/response.js').response;
var auth = require('../services/auth_service.js');
var router = require('../routes.js');
var _ = require('lodash');

var {
  TYPES,
  connectorClient,
  renderConnectorError,
  redirectTo,
  inferAcceptedCardType}  = require('./payment_types_controller.js');

module.exports.selectType = function (req, res) {

  var init = function () {
    var accountId = auth.get_gateway_account_id(req);

    connectorClient()
      .withGetAccountAcceptedCards(accountId, onSuccessGetAccountAcceptedCards)
      .on('connectorError', renderConnectorError(req, res, 'Unable to retrieve accepted card types for the account.'));
  };

  var onSuccessGetAccountAcceptedCards = function (acceptedCards) {
    var acceptedType = inferAcceptedCardType(acceptedCards['card_types']);

    var model = {
      allCardOption: {
        type: TYPES.ALL,
        selected: acceptedType === TYPES.ALL ? 'checked' : ''
      },
      debitCardOption: {
        type: TYPES.DEBIT,
        selected: acceptedType === TYPES.DEBIT ? 'checked' : ''
      }
    };

    response(req.headers.accept, res, "payment_types_select_type", model);
  };

  init();
};

module.exports.updateType = function (req, res) {

  var init = function () {
    redirectTo(res, router.paths.paymentTypes.selectBrand, {
      "acceptedType": req.body['payment-types-card-type']
    });
  };

  init();
};

