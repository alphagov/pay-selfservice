var ConnectorClient = require('../services/connector_client.js').ConnectorClient;
// THIS SHOUDL BE REPLACED BYT EH FRONTEND VIEWS FRAMEWORK
var renderErrorView = require('../utils/response.js').renderErrorView;
var querystring = require('querystring');
var _ = require('lodash');

var TYPES = {ALL: "ALL", DEBIT: "DEBIT"};

module.exports.TYPES = TYPES;

module.exports.connectorClient = function () {
  return new ConnectorClient(process.env.CONNECTOR_URL);
};


// WHY NOT JUST RETURN THE DATA IN THE FORMAT NEEDED FROM CONNECTOR?
// IF WE ARE SPLITTING CONENCTORS SPECIFICALLY I THINK IT MAKES MORE SENSE
// THE ROUTE NAME IS NOT VERY RESTFUL
// OR AT LEAST HIDE THIS, BASICALLY DATA NORMALISATION
// YAGNI
module.exports.reconcileCardsByBrand = function (acceptedType, acceptedCards, allCards) {
  var reconciledCardTypes = _.map(allCards, function (card) {
    return {
      "id": "payment-types-" + card['brand'] + "-brand",
      "value": card['brand'],
      "label": card['label'],
      "available": (acceptedType === TYPES.ALL) || (card['type'] === TYPES.DEBIT),
      "selected": ((acceptedCards.length < 1) || _.some(acceptedCards, {'id': card['id']})) ? 'checked' : ''
    };
  });

  return _
    .chain(reconciledCardTypes)
    .groupBy('id')
    .map(function (cardsById) {
      var first = _.first(cardsById);
      first['available'] = _.some(cardsById, {'available': true});
      first['selected'] = _.some(cardsById, {'selected': 'checked'}) ? 'checked' : '';
      return first;
    })
    .sortBy(function (card) {
      return !card['available'];
    })
    .value();
};

module.exports.redirectTo = function (response, path, query) {
  // QUERYSTRING SHOUDL BE HANDLED BY ROUTE GENERATION< FRONTEND DOES THIS BETTER
  response.redirect(303, path + "?" + querystring.stringify(query));
};

module.exports.renderConnectorError = function (request, response, errorMessage) {
  return function (connectorError) {
    if (connectorError) {
      // VIEWS LIBRARY FROM FRONTEND WOULD BE GOOD
      renderErrorView(request, response, 'Internal server error');
      return;
    }

    renderErrorView(request, response, errorMessage);
  }
};

module.exports.inferAcceptedCardType = function (acceptedCards) {
  var areAcceptedCardsAllDebit = false;

  if (acceptedCards.length > 0) {
    areAcceptedCardsAllDebit = _.every(acceptedCards, {'type': TYPES.DEBIT});
  }

  return areAcceptedCardsAllDebit ?  TYPES.DEBIT: TYPES.ALL;
}

// NOT IMMEDIATELY OBVIOUS WHAT THESE ROUTES ARE DOING ARE THEY ALL USED?


