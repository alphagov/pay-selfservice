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

  it('should contain an empty header 2 element to be populated by javascript', function () {
    var templateData = {
      'account_id' : 12345,
      'tokens' : []
    };
    var body = renderTemplate('token', templateData);
    body.should.containSelector('h2#available-tokens').withText("");
  });

  it('should render the number of active developer keys for the account (for no keys)', function () {
    var templateData = {
      'account_id' : 12345,
      'tokens' : []
    };
    var body = renderTemplate('token', templateData);

    body.should.containSelector('h1').withText("Developer keys");

    body.should.containSelector('input#generateButton').withAttribute("value", "Generate a new key").withAttribute("type", "button");
    body.should.containSelector('a#generateLink').withAttribute("href", "/selfservice/tokens/12345/generate");

    body.should.containNoSelector('h3');

    body.should.containNoSelector('div[name=token-description]');
  });

  it('should render the number of active developer keys for the account (for 1 key)', function () {
    var templateData = {
      'account_id' : 12345,
      'tokens' : [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"description token 1"}]
    };
    var body = renderTemplate('token', templateData);

    body.should.containSelector('h1').withText("Developer keys");

    body.should.containSelector('input#generateButton').withAttribute("value", "Generate a new key").withAttribute("type", "button");
    body.should.containSelector('a#generateLink').withAttribute("href", "/selfservice/tokens/12345/generate");

    body.should.containSelector('h3').withText("Active keys");

    var parentDivSelector = 'div#550e8400-e29b-41d4-a716-446655440000';
    body.should.containSelector('div[name=token-description]');
    body.should.containSelector(parentDivSelector);
    body.should.containSelector(parentDivSelector + ' > div#description').withText('description token 1');
    body.should.containSelector(parentDivSelector + ' > a#edit').withText("Edit description");
    body.should.containSelector(parentDivSelector + ' > a#cancel').withAttribute("style", "display: none").withText("cancel");
    body.should.containSelector(parentDivSelector + ' > input#save').withAttribute("style", "display: none").withAttribute("type", "button").withAttribute("value", "Save changes");
    body.should.containSelector(parentDivSelector + ' > a#revoke').withText("Revoke key");
    body.should.containSelector(parentDivSelector + ' > div#revoke-message').withAttribute("style", "display: none");
    body.should.containSelector(parentDivSelector + ' > div#revoked').withAttribute("style", "display: none");
  });

  it('should render the number of active developer keys for the account (for 2 keys)', function () {
    var templateData = {
      'account_id' : 12345,
      'tokens' : [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"description token 1"},
                  {"token_link":"550e8400-e29b-41d4-a716-446655441234", "description":"description token 2"}]
    };
    var body = renderTemplate('token', templateData);

    body.should.containSelector('h1').withText("Developer keys");

    body.should.containSelector('input#generateButton').withAttribute("value", "Generate a new key").withAttribute("type", "button");
    body.should.containSelector('a#generateLink').withAttribute("href", "/selfservice/tokens/12345/generate");

    body.should.containSelector('h3').withText("Active keys");

    var parentDivSelect1 = 'div#550e8400-e29b-41d4-a716-446655440000';
    body.should.containSelector('div[name=token-description]');
    body.should.containSelector(parentDivSelect1);
    body.should.containSelector(parentDivSelect1 + ' > div#description').withText('description token 1');
    body.should.containSelector(parentDivSelect1 + ' > a#edit').withText("Edit description");
    body.should.containSelector(parentDivSelect1 + ' > a#cancel').withAttribute("style", "display: none").withText("cancel");
    body.should.containSelector(parentDivSelect1 + ' > input#save').withAttribute("style", "display: none").withAttribute("type", "button").withAttribute("value", "Save changes");
    body.should.containSelector(parentDivSelect1 + ' > a#revoke').withText("Revoke key");
    body.should.containSelector(parentDivSelect1 + ' > div#revoke-message').withAttribute("style", "display: none");
    body.should.containSelector(parentDivSelect1 + ' > div#revoked').withAttribute("style", "display: none");

    var parentDivSelect2 = 'div#550e8400-e29b-41d4-a716-446655441234';
    body.should.containSelector('div[name=token-description]');
    body.should.containSelector(parentDivSelect2);
    body.should.containSelector(parentDivSelect2 + ' > div#description').withText('description token 2');
    body.should.containSelector(parentDivSelect2 + ' > a#edit').withText("Edit description");
    body.should.containSelector(parentDivSelect2 + ' > a#cancel').withAttribute("style", "display: none").withText("cancel");
    body.should.containSelector(parentDivSelect2 + ' > input#save').withAttribute("style", "display: none").withAttribute("type", "button").withAttribute("value", "Save changes");
    body.should.containSelector(parentDivSelect2 + ' > a#revoke').withText("Revoke key");
    body.should.containSelector(parentDivSelect2 + ' > div#revoke-message').withAttribute("style", "display: none");
    body.should.containSelector(parentDivSelect2 + ' > div#revoked').withAttribute("style", "display: none");
  });

  it('should render revoked tokens', function () {
    var templateData = {
      'account_id' : 12345,
      'tokens' : [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"revoked token", "revoked": "18 Oct 2015"},
                  {"token_link":"550e8400-e29b-41d4-a716-446655441234", "description":"non-revoked token"}]
    };
    var body = renderTemplate('token', templateData);

    body.should.containSelector('h1').withText("Developer keys");

    body.should.containSelector('input#generateButton')
      .withAttribute("value", "Generate a new key")
      .withAttribute("type", "button");

    body.should.containSelector('a#generateLink')
      .withAttribute("href", "/selfservice/tokens/12345/generate");

    body.should.containSelector('h3').withText("Active keys");

    var parentDivSelect1 = 'div#550e8400-e29b-41d4-a716-446655440000';
    body.should.containSelector('div[name=token-description]');
    body.should.containSelector(parentDivSelect1);
    body.should.containSelector(parentDivSelect1 + ' > div#description').withText('revoked token');
    body.should.containNoSelector(parentDivSelect1 + ' > a#edit');
    body.should.containNoSelector(parentDivSelect1 + ' > a#cancel');
    body.should.containNoSelector(parentDivSelect1 + ' > input#save');
    body.should.containNoSelector(parentDivSelect1 + ' > a#revoke');
    body.should.containNoSelector(parentDivSelect1 + ' > div#revoke-message');
    body.should.containSelector(parentDivSelect1 + ' > div#revoked').withText("This key was successfully revoked on 18 Oct 2015. It will no longer enable integration with the platform.");

    var parentDivSelect2 = 'div#550e8400-e29b-41d4-a716-446655441234';
    body.should.containSelector('div[name=token-description]');
    body.should.containSelector(parentDivSelect2);
    body.should.containSelector(parentDivSelect2 + ' > div#description').withText('non-revoked token');
    body.should.containSelector(parentDivSelect2 + ' > a#edit').withText("Edit description");
    body.should.containSelector(parentDivSelect2 + ' > a#cancel').withAttribute("style", "display: none").withText("cancel");
    body.should.containSelector(parentDivSelect2 + ' > input#save').withAttribute("style", "display: none").withAttribute("type", "button").withAttribute("value", "Save changes");
    body.should.containSelector(parentDivSelect2 + ' > a#revoke').withText("Revoke key");
    body.should.containSelector(parentDivSelect2 + ' > div#revoke-message').withAttribute("style", "display: none");
    body.should.containSelector(parentDivSelect2 + ' > div#revoked').withAttribute("style", "display: none");

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
