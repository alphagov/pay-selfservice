var TransactionView = function () {
    this.eventStatuses['CREATED'] = 'Payment of £50.00 was created';
    this.eventStatuses['IN PROGRESS'] = 'Payment of £50.00 is in progress';
    this.eventStatuses['SUCCEEDED'] = 'Payment of £50.00 successfully captured';
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

/** prepares the transaction details view
 * TODO: This is a cheap rendering process with hardcoded amount.
 *    Need to process this correctly using the amount formatted in £ and correct template strings
 *    Speak to Rory/Till for the correct wording for events status templates
 */
TransactionView.prototype.buildPaymentView = function (chargeData, eventsData) {
    eventsData.events.forEach(function (event) {
        event.status = this.eventStatuses[event.status];
    }.bind(this));

    chargeData['events'] = eventsData.events;
    delete chargeData['links'];
    delete chargeData['return_url'];
    return chargeData;
};

exports.TransactionView = TransactionView;