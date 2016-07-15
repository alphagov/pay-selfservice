var response = require('../utils/response.js').response;
var auth = require('../services/auth_service.js');
var router = require('../routes.js');

var {
  TYPES,
  connectorClient,
  renderConnectorError,
  reconcileCardsByBrand,
  inferAcceptedCardType}  = require('./payment_types_controller.js');

module.exports.showSummary = function (req, res) {

  var init = function () {
    connectorClient()
      .withGetAllCardTypes(onSuccessGetAllCards)
      .on('connectorError', renderConnectorError(req, res, 'Unable to retrieve card types.'));
  };

  var onSuccessGetAllCards = function (allCards) {
    var onSuccessGetAccountAcceptedCards = function (acceptedCards) {
      var acceptedType = inferAcceptedCardType(acceptedCards['card_types']);

      var model = {
        isAcceptedTypeAll: acceptedType === TYPES.ALL,
        isAcceptedTypeDebit: acceptedType === TYPES.DEBIT,
        brands: reconcileCardsByBrand(acceptedType, acceptedCards['card_types'], allCards['card_types'])
      };

      response(req.headers.accept, res, "payment_types_summary", model);
    };

    var accountId = auth.get_gateway_account_id(req);

    connectorClient()
      .withGetAccountAcceptedCards(accountId, onSuccessGetAccountAcceptedCards)
      .on('connectorError', renderConnectorError(req, res, 'Unable to retrieve accepted card types for the account.'));
  };

  init();
};

