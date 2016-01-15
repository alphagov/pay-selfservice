var moment = require('moment');
var changeCase = require('change-case');
var CURRENCY = '£';

//TODO: Ask Rory for the friendly text for the below order statuses
var TransactionView = function () {
    this.eventStatuses['CREATED'] = 'Payment of AMOUNT was created';
    this.eventStatuses['IN PROGRESS'] = 'Payment of AMOUNT is in progress';
    this.eventStatuses['ENTERING CARD DETAILS'] = 'Entered card details';
    this.eventStatuses['AUTHORISATION REJECTED'] = 'AUTHORISATION REJECTED';
    this.eventStatuses['AUTHORISATION SUBMITTED'] = 'AUTHORISATION SUBMITTED';
    this.eventStatuses['AUTHORISATION SUCCESS'] = 'Payment of AMOUNT was authorised';
    this.eventStatuses['READY_FOR_CAPTURE'] = 'READY_FOR_CAPTURE';
    this.eventStatuses['CAPTURE SUBMITTED'] = 'Payment of AMOUNT submitted';
    this.eventStatuses['CAPTURED'] = 'Payment of AMOUNT successfully captured';
    this.eventStatuses['SUCCEEDED'] = 'Payment of AMOUNT succeeded';
    this.eventStatuses['SYSTEM UNKNOWN'] = 'SYSTEM UNKNOWN';
    this.eventStatuses['SYSTEM CANCELLED'] = 'SYSTEM CANCELLED';
    this.eventStatuses['SYSTEM ERROR'] = 'SYSTEM ERROR';
};

TransactionView.prototype.eventStatuses = {};

/** prepares the transaction list view */
TransactionView.prototype.buildPaymentList = function (connectorData, gatewayAccountId) {
    connectorData.results.forEach(function (element) {
        element.amount = (element.amount / 100).toFixed(2);
        element.gateway_account_id = gatewayAccountId;
        element.reference = element.reference || ""; // tolerate missing reference
    });
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