var response = require('../utils/response.js').response;
var auth = require('../services/auth_service.js');
var router = require('../routes.js');
var _ = require('lodash');

var {
  TYPES,
  connectorClient,
  renderConnectorError,
  redirectTo}  = require('./payment_types_controller.js');

module.exports.index = function (req, res) {

  var init = function () {
    var accountId = auth.get_account_id(req);

    connectorClient()
      .withGetAccountAcceptedCards(accountId, onSuccessGetAccountAcceptedCards)
      .on('connectorError', renderConnectorError(req, res, 'Unable to retrieve accepted card types for the account.'));
  };

  var onSuccessGetAccountAcceptedCards = function (acceptedCards) {
    var areAcceptedCardsAllDebit = false;

    if (acceptedCards['card_types'].length > 0) {
      areAcceptedCardsAllDebit = _.every(acceptedCards['card_types'], {'type': TYPES.DEBIT});
    }

    var model = {
      allCardOption: {
        type: TYPES.ALL,
        selected: areAcceptedCardsAllDebit ? '' : 'checked'
      },
      debitCardOption: {
        type: TYPES.DEBIT,
        selected: areAcceptedCardsAllDebit ? 'checked' : ''
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

