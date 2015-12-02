var renderTemplate = require(__dirname + '/utils/html_assertions.js').render;
var should = require('chai').should();

describe('The token view', function() {

  it('should contain a hidden div with the account id to be referenced from jquery', function () {
    var templateData = {
      'account_id' : 12345,
      'tokens' : []
    };
    var body = renderTemplate('token', templateData);
    body.should.containSelector('div#accountId').withAttribute("class", "hidden").withText(12345);
  });

  it('should render the number of active developer keys for the account (for no keys)', function () {
    var templateData = {
      'account_id' : 12345,
      'tokens' : []
    };
    var body = renderTemplate('token', templateData);

    body.should.containSelector('h1').withText("Developer keys");
    body.should.containSelector('#available-tokens').withText("There are no active developer keys");
    body.should.containSelector('a[href="/selfservice/tokens/12345/generate"]').withText('Generate a new key');
    body.should.containNoSelector('.key-list-item');
  });

  it('should render the active developer keys for the account (for 1 key)', function () {
    var tokenLink = '550e8400-e29b-41d4-a716-446655440000',
        templateData = {
          'account_id' : 12345,
          'active_tokens' : [{"token_link": tokenLink, "description":"description token 1"}],
          'active_tokens_singular': true
        };
    var body = renderTemplate('token', templateData);

    body.should.containSelector('#available-tokens').withText("There is 1 active developer key");
    body.should.containSelector('h3').withText("Active keys");

    var tokenContainerSelector = '#' + tokenLink;
    body.should.containSelector(tokenContainerSelector);
    body.should.containSelector(tokenContainerSelector + ' .heading-small').withText('description token 1');
  });

  it('should render the number of active developer keys for the account (for 2 keys)', function () {
    var templateData = {
      'account_id' : 12345,
      'active_tokens' : [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"description token 1"},
                  {"token_link":"550e8400-e29b-41d4-a716-446655441234", "description":"description token 2"}]
    };
    var body = renderTemplate('token', templateData);

    body.should.containSelector('#available-tokens').withText("There are 2 active developer keys");
    body.should.containSelector('h3').withText("Active keys");

    var tokenContainerSelector = '#550e8400-e29b-41d4-a716-446655440000';
    body.should.containSelector(tokenContainerSelector);
    body.should.containSelector(tokenContainerSelector + ' .heading-small').withText('description token 1');

    tokenContainerSelector = '#550e8400-e29b-41d4-a716-446655441234';
    body.should.containSelector(tokenContainerSelector);
    body.should.containSelector(tokenContainerSelector + ' .heading-small').withText('description token 2');
  });

  it('should render revoked tokens', function () {
    var templateData = {
      'account_id' : 12345,
      'active_tokens' : [{"token_link":"550e8400-e29b-41d4-a716-446655441234", "description":"non-revoked token"}],
      'revoked_tokens' : [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"revoked token", "revoked": "18 Oct 2015"}]
    };
    var body = renderTemplate('token', templateData);

    body.should.containSelector('h3').withText("Active keys");
    body.should.containSelector('h3').withText("Revoked keys");

    var tokenContainerSelector = '#550e8400-e29b-41d4-a716-446655440000';
    body.should.containSelector(tokenContainerSelector);
    body.should.containSelector(tokenContainerSelector + ' div').withText("Key was revoked on 18 Oct 2015");
  });

});

describe('The generate token view', function() {

  describe('After a GET request', function() {

    it('should render a form to request a new token via a post request', function () {
      var templateData = {
        'account_id' : 12345
      };

      var body = renderTemplate('token_generate', templateData);

      body.should.containSelector('.page-title').withText("Developer keys");

      body.should.containSelector('form')
        .withAttribute('action', '/selfservice/tokens/generate')
        .withAttribute('method', 'post');

      body.should.containTextarea('description')
        .withAttribute('maxlength', '100')
        .withAttribute('size', '150')
        .withLabel('Add a description for the key');

      body.should.containSelector('input#accountId')
        .withAttribute('id', 'accountId')
        .withAttribute('name', 'accountId')
        .withAttribute('type', 'hidden')
        .withAttribute('value', '12345');

      body.should.containSelector('.button')
        .withAttribute("value", "Generate key")
        .withAttribute("type", "submit")
        .withAttribute("class", "button");

      body.should.containNoSelector('textarea#token');

      body.should.containSelector('a[href="/selfservice/tokens/12345"]')
        .withText("Cancel");
    });

  });

  describe('After a POST request', function() {

    it('should render the account for which the token will be generated', function () {
      var templateData = {
        'account_id' : 12345,
        'token' : "550e8400-e29b-41d4-a716-446655440000",
        'description' : 'Test token'
      };
      var body = renderTemplate('token_generate', templateData);
      body.should.containSelector('.page-title').withText("Developer keys");
      body.should.containSelector('.heading-medium').withText("New key generated");
      body.should.containSelector('p').withText("Please copy this key now as it won’t be shown again");
    });

    it('should render the new generated token', function () {
      var templateData = {
        'account_id' : 12345,
        'token' : "550e8400-e29b-41d4-a716-446655440000",
        'description' : 'Test token'
      };
      var body = renderTemplate('token_generate', templateData);
      body.should.containTextarea('token')
        .withText("550e8400-e29b-41d4-a716-446655440000")
        .withLabel("Test token");
    });

    it('should render a Finish button', function () {
      var templateData = {
        'account_id' : 12345,
        'token' : "550e8400-e29b-41d4-a716-446655440000",
        'description' : 'Test token'
      };
      var body = renderTemplate('token_generate', templateData);

      body.should.containSelector('.button')
        .withAttribute("href", "/selfservice/tokens/12345")
        .withText("Finish");
    });

  });

});
