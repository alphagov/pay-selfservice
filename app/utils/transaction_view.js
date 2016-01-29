var changeCase = require('change-case');
var CURRENCY = '£';
var dates = require('../utils/dates.js');


var TransactionView = function () {
    this.eventStatuses['CREATED'] = 'Payment of AMOUNT was created';
    this.eventStatuses['IN PROGRESS'] = 'Payment of AMOUNT is in progress';
    this.eventStatuses['SUCCEEDED'] = 'Payment of AMOUNT succeeded';
};

TransactionView.prototype.eventStatuses = {};

/** prepares the transaction list view */
TransactionView.prototype.buildPaymentList = function (connectorData, gatewayAccountId, filters) {
    connectorData.filters = filters;
    connectorData.hasFilters = Object.keys(filters).length != 0;
    connectorData.hasResults = connectorData.results.length !== 0;
    connectorData.eventStatuses = Object.keys(this.eventStatuses).map(function(str) {
        var value = {};
        value.text = changeCase.upperCaseFirst(str.toLowerCase());
        if(str === filters.status) {
            value.selected = true;
        }
        return { "key": str, "value": value};
    });

    connectorData.results.forEach(function (element) {
        element.amount = (element.amount / 100).toFixed(2);
        element.gateway_account_id = gatewayAccountId;
        element.reference = element.reference || ""; // tolerate missing reference
        element.updated = dates.utcToDisplay(element.updated);
    });
    return connectorData;
};

TransactionView.prototype.buildPaymentView = function (chargeData, eventsData) {
    eventsData.events.forEach(function (event) {
        event.status = this.eventStatuses[event.status];
        event.status = event.status.replace('AMOUNT', CURRENCY + (chargeData.amount / 100).toFixed(2));
        event.updated_friendly = dates.utcToDisplay(event.updated);
    }.bind(this));

    chargeData.amount = CURRENCY + (chargeData.amount / 100).toFixed(2);
    chargeData.payment_provider = changeCase.upperCaseFirst(chargeData.payment_provider);
    chargeData.updated =  dates.utcToDisplay(eventsData.events[0].updated);
    chargeData['events'] = eventsData.events.reverse();
    delete chargeData['links'];
    delete chargeData['return_url'];
    return chargeData;
};
exports.TransactionView = TransactionView;
