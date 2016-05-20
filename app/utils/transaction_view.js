var _ = require('lodash');
var changeCase = require('change-case');
var dates = require('../utils/dates.js');
var router = require('../routes.js');
var qs = require('qs');
var querystring = require('querystring');
var Paginator = require('./paginator');
var check = require('check-types');

const PAGINATION_SPREAD = 2;
const CURRENCY = '£';
const eventStates = {
        'created': 'Service created payment of AMOUNT',
        'started':'User started payment of AMOUNT',
        'submitted': 'User submitted payment details for payment of AMOUNT',
        'success': 'Payment of AMOUNT succeeded',
        'error': 'Error processing payment of AMOUNT',
        'failed': 'User failed to complete payment of AMOUNT',
        'cancelled': 'Service cancelled payment of AMOUNT'
};

function getPaginationLinks(connectorData) {
  if (connectorData.total) {
    var paginator = new Paginator(connectorData.total, getCurrentPageSize(connectorData), getCurrentPageNumber(connectorData));
    return paginator.getLast() > 1 ? paginator.getNamedCentredRange(PAGINATION_SPREAD, true, true) : null;
  }
}

function getCurrentPageNumber (connectorData) {
    var selfLink = connectorData._links && connectorData._links.self;
    var pageNumber;

    if (selfLink) {
        pageNumber = Number(qs.parse(selfLink.href).page);
        if (check.number(pageNumber) && pageNumber > 0) {
            return pageNumber;
        }
    }
}

function getCurrentPageSize (connectorData) {
    var selfLink = connectorData._links && connectorData._links.self;
    var limit;

    if (selfLink) {
        limit = Number(qs.parse(selfLink.href).display_size);
        if (check.number(limit) && limit > 0) {
            return limit;
        }
    }
}

module.exports = {
    /** prepares the transaction list view */
    buildPaymentList: function (connectorData, gatewayAccountId, filters) {
        connectorData.filters = filters;
        connectorData.hasFilters = Object.keys(filters).length !== 0;
        connectorData.hasResults = connectorData.results.length !== 0;
        connectorData.total = connectorData.total || (connectorData.results && connectorData.results.length);
        connectorData.paginationLinks = getPaginationLinks(connectorData);
        connectorData.hasPaginationLinks = !!getPaginationLinks(connectorData);
        connectorData.eventStates = Object.keys(eventStates).map(function(str) {
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
        to_date: filters.toDate, 
        fromTime: filters.fromTime,
        toTime:filters.toTime
    });

        return connectorData;
    },

    buildPaymentView: function (chargeData, eventsData) {
        eventsData.events.forEach(function (event) {
            event.state_friendly = eventStates[event.state.status];
            if (event.state_friendly) {
                event.state_friendly = event.state_friendly.replace('AMOUNT', CURRENCY + (chargeData.amount / 100).toFixed(2));
            }

            event.updated_friendly = dates.utcToDisplay(event.updated);
        });

        chargeData.state_friendly = changeCase.upperCaseFirst(chargeData.state.status.toLowerCase());


        chargeData.amount = CURRENCY + (chargeData.amount / 100).toFixed(2);
        chargeData.payment_provider = changeCase.upperCaseFirst(chargeData.payment_provider);
        chargeData.updated =  dates.utcToDisplay(eventsData.events[0] && eventsData.events[0].updated);
        chargeData['events'] = eventsData.events.reverse();
        delete chargeData['links'];
        delete chargeData['return_url'];
        return chargeData;
    }
};
