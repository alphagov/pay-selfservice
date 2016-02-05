var moment = require('moment');
var changeCase = require('change-case');
var CURRENCY = '£';
var querystring = require('querystring');

var DOWNLOAD_TRANSACTION_BASE_LINK = "/selfservice/transactions/download";

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
    });

    var filterQuery = querystring.stringify({
        reference: filters.reference,
        status: filters.status,
        from_date: filters.fromDate,
        to_date: filters.toDate
    });

    connectorData.downloadTransactionLink = DOWNLOAD_TRANSACTION_BASE_LINK + "?" + filterQuery;

    return connectorData;
};

TransactionView.prototype.buildPaymentView = function (chargeData, eventsData) {
    eventsData.events.forEach(function (event) {
        event.status = this.eventStatuses[event.status];
        event.status = event.status.replace('AMOUNT', CURRENCY + (chargeData.amount / 100).toFixed(2));
        event.updated_friendly = convertDate(event.updated);
    }.bind(this));

    chargeData.amount = CURRENCY + (chargeData.amount / 100).toFixed(2);
    chargeData.payment_provider = changeCase.upperCaseFirst(chargeData.payment_provider);
    chargeData.updated = eventsData.events[0].updated;
    chargeData['events'] = eventsData.events.reverse();
    delete chargeData['links'];
    delete chargeData['return_url'];
    return chargeData;
};

function convertDate(updated) {
  var date = new Date(updated);
  return moment(date).format('DD MMMM YYYY HH:mm:ss');
}

exports.TransactionView = TransactionView;