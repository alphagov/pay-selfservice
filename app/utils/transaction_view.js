var changeCase = require('change-case');
var CURRENCY = '£';
var dates = require('../utils/dates.js');
var router = require('../routes.js');

var querystring = require('querystring');
var TransactionView = function () {
    this.eventStates['created'] = 'Service created payment of AMOUNT';
    this.eventStates['started'] = 'User started payment of AMOUNT';
    this.eventStates['submitted'] = 'User submitted payment details for payment of AMOUNT';
    this.eventStates['confirmed'] = 'Payment of AMOUNT confirmed by payment provider';
    this.eventStates['error'] = 'Error processing payment of AMOUNT';
    this.eventStates['failed'] = 'User failed to complete payment of AMOUNT';
    this.eventStates['cancelled'] = 'Service cancelled payment of AMOUNT';
    this.eventStates['captured'] = 'Money collected for payment of AMOUNT';
};

TransactionView.prototype.eventStates = {};

/** prepares the transaction list view */
TransactionView.prototype.buildPaymentList = function (connectorData, gatewayAccountId, filters) {
    connectorData.filters = filters;
    connectorData.hasFilters = Object.keys(filters).length !== 0;
    connectorData.hasResults = connectorData.results.length !== 0;
    connectorData.eventStates = Object.keys(this.eventStates).map(function(str) {
        var value = {};
        value.text = changeCase.upperCaseFirst(str.toLowerCase());
        if(str === filters.state) {
            value.selected = true;
        }
        return { "key": str, "value": value};
    });

    connectorData.results.forEach(function (element) {
        element.state_friendly = changeCase.upperCaseFirst(element.state.status.toLowerCase());
        element.amount  = (element.amount / 100).toFixed(2);
        element.updated = dates.utcToDisplay(element.updated);
        element.created = dates.utcToDisplay(element.created_date);
        element.gateway_account_id = gatewayAccountId;
        element.link    = router.generateRoute(router.paths.transactions.show,{
            chargeId: element.charge_id
        });
        delete element.created_date;
    });

    // TODO normalise fromDate and ToDate so you can just pass them through no problem
    connectorData.downloadTransactionLink = router.generateRoute(
        router.paths.transactions.download,{
        reference: filters.reference,
        status: filters.status,
        from_date: filters.fromDate,
        to_date: filters.toDate
    });

    return connectorData;
};

TransactionView.prototype.buildPaymentView = function (chargeData, eventsData) {
    eventsData.events.forEach(function (event) {
        event.state_friendly = this.eventStates[event.state.status];
        if (event.state_friendly) {
          event.state_friendly = event.state_friendly.replace('AMOUNT', CURRENCY + (chargeData.amount / 100).toFixed(2));
        }
        
        event.updated_friendly = dates.utcToDisplay(event.updated);
    }.bind(this));

    chargeData.state_friendly = changeCase.upperCaseFirst(chargeData.state.status.toLowerCase());

    chargeData.amount = CURRENCY + (chargeData.amount / 100).toFixed(2);
    chargeData.payment_provider = changeCase.upperCaseFirst(chargeData.payment_provider);
    chargeData.updated =  dates.utcToDisplay(eventsData.events[0].updated);
    chargeData['events'] = eventsData.events.reverse();
    delete chargeData['links'];
    delete chargeData['return_url'];
    return chargeData;
};
exports.TransactionView = TransactionView;
