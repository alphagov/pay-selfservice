var should = require('chai').should();
var renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;
var paths = require(__dirname + '/../../app/paths.js');

describe('The pagination links', function () {
  it('should display correct pagination links', function () {
    var templateData = {
      'total': 100,
      'results': [
          {
            'charge_id': '100',
            'amount': '50.00',
            'reference': 'ref1',
            'state_friendly': 'Testing2',
            'state': {
              'status': 'testing2',
              'finished': true
            },
            'created': '2016-01-11 01:01:01'
          },
          {
            'charge_id': '101',
            'amount': '20.00',
            'reference': 'ref1',
            'state_friendly': 'Testing2',
            'state': {
              'status': 'testing2',
              'finished': false
            },
            'created': '2016-01-11 01:01:01'
          }
      ],
      'filters': {'reference': 'ref1', 'state': 'Testing2', 'fromDate': '2015-01-11 01:01:01', 'toDate': '2015-01-11 01:01:01', 'pageSize': '100'},
      'paginationLinks': [
        { pageNumber: 1, pageName: 1 },
        { pageNumber: 2, pageName: 2 },
        { pageNumber: 3, pageName: 3 },
        { pageNumber: 2, pageName: 'next'},
        { pageNumber: 6, pageName: 'last' }
      ],
      'hasPaginationLinks': true,
      'selectedState': 'Testing2',
      'hasResults': true,
      'downloadTransactionLink':
          '/transactions/download?reference=ref1&state=Testing2&from_date=2%2F0%2F2015%2001%3A01%3A01&&to_date=2%2F0%2F2015%2001%3A01%3A01'
    };

    var body = renderTemplate('transactions/paginator', templateData);

    body.should.containSelector('#pagination');
    body.should.containSelector('#pagination');
    var paginationLinks = templateData.paginationLinks;

    for (var ctr = 0; ctr < paginationLinks.length; ctr++ ) {
      body.should.containSelector('.paginationForm.' + paginationLinks[ctr].pageName);
      body.should.containSelector('.paginationForm.' + paginationLinks[ctr].pageName + ' .state')
        .withAttribute('value','Testing2');
      body.should.containSelector('.paginationForm.' + paginationLinks[ctr].pageName + ' .ref')
        .withAttribute('value','ref1');
      body.should.containSelector('.paginationForm.' + paginationLinks[ctr].pageName + ' .fromDate')
        .withAttribute('value','2015-01-11 01:01:01');
      body.should.containSelector('.paginationForm.' + paginationLinks[ctr].pageName + ' .toDate')
        .withAttribute('value','2015-01-11 01:01:01');
      body.should.containSelector('.paginationForm.' + paginationLinks[ctr].pageName + ' .page')
        .withAttribute('value',String(paginationLinks[ctr].pageNumber));
      body.should.containSelector('.paginationForm.' + paginationLinks[ctr].pageName + ' .pageSize')
        .withAttribute('value', '100');
    }
  });
});