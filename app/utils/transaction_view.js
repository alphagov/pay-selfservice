var CURRENCY = '£';

String.prototype.capitalize = function() {
    return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

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
TransactionView.prototype.buildPaymentList = function (connectorData) {
    connectorData.results.forEach(function (element) {
        element.amount = (element.amount / 100).toFixed(2);
        element.reference = element.reference || ""; // tolerate missing reference
    });
    return connectorData;
};

TransactionView.prototype.buildPaymentView = function (chargeData, eventsData) {
    eventsData.events.forEach(function (event) {
        event.status = this.eventStatuses[event.status];
        event.status = event.status.replace('AMOUNT', CURRENCY + (chargeData.amount / 100).toFixed(2));
        if (event.updated.month) {
            event.updated.month = event.updated.month.toLowerCase().capitalize();
        }

        //This is a workaround to add a left zero to any time value lower than 10.
        if (event.updated.second < 10) {
            event.updated.second = '0'+event.updated.second;
        }
        if (event.updated.minute < 10) {
            event.updated.minute = '0'+event.updated.minute;
        }
        if (event.updated.hour < 10 ) {
            event.updated.hour = '0'+event.updated.hour;
        }
    }.bind(this));

    chargeData.amount = CURRENCY + (chargeData.amount / 100).toFixed(2);
    chargeData['events'] = eventsData.events.reverse();
    delete chargeData['links'];
    delete chargeData['return_url'];
    return chargeData;
};

exports.TransactionView = TransactionView;