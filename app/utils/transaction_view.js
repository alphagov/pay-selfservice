var CURRENCY = '£';

String.prototype.capitalize = function() {
    return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

var monthNames = ["January","February", "March",    "April",    "May",      "June",
                  "July",   "August",   "September","October",  "November", "December" ];

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
        event.updated2 = convertDate(event.updated);
    }.bind(this));

    chargeData.amount = CURRENCY + (chargeData.amount / 100).toFixed(2);
    chargeData['events'] = eventsData.events.reverse();
    delete chargeData['links'];
    delete chargeData['return_url'];
    return chargeData;
};

function convertDate(updated) {
  function pad(s) { return (s < 10) ? '0' + s : s; };
  var date = new Date(updated);
  return    pad(date.getDate()) +            " " +
            monthNames[date.getMonth()] +   " " +
            date.getFullYear() +            " " +
            pad(date.getHours()) +          ":" +
            pad(date.getMinutes()) +        ":" +
            pad(date.getSeconds());
}

exports.TransactionView = TransactionView;