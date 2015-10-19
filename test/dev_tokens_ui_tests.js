var renderTemplate = require(__dirname + '/utils/html_assertions.js').render;
var should = require('chai').should();

describe('The token view', function() {

  it('should render the number of active developer keys for the account (for no keys)', function () {
    var templateData = {
      'account_id' : 12345,
      'tokens' : [],
      'header2': "There are no active developer keys"
    };
    var body = renderTemplate('token', templateData);
    body.should.containSelector('h1').withText("Developer keys");
    body.should.containSelector('h2').withText("There are no active developer keys");
    body.should.containNoSelector('h3');

    body.should.containNoSelector('div#550e8400-e29b-41d4-a716-446655440000-description');
    body.should.containNoSelector('a#550e8400-e29b-41d4-a716-446655440000-edit');
    body.should.containNoSelector('a#550e8400-e29b-41d4-a716-446655440000-cancel');
    body.should.containNoSelector('input#550e8400-e29b-41d4-a716-446655440000-save');
    body.should.containNoSelector('a#550e8400-e29b-41d4-a716-446655440000-revoke');
    body.should.containNoSelector('div#550e8400-e29b-41d4-a716-446655440000-revoke-message');
    body.should.containNoSelector('div#550e8400-e29b-41d4-a716-446655440000-revoked');

    body.should.containSelector('input#generateButton').withAttribute("value", "Generate a new key").withAttribute("type", "button");
    body.should.containSelector('a#generateLink').withAttribute("href", "/tokens/generate/12345");
  });

  it('should render the number of active developer keys for the account (for 1 key)', function () {
    var templateData = {
      'account_id' : 12345,
      'tokens' : [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"description token 1"}],
      'header2': "There is 1 active developer key"
    };
    var body = renderTemplate('token', templateData);

    body.should.containSelector('h1').withText("Developer keys");
    body.should.containSelector('h2').withText("There is 1 active developer key");
    body.should.containSelector('h3').withText("Active keys");

    body.should.containSelector('div#550e8400-e29b-41d4-a716-446655440000-description');
    body.should.containSelector('a#550e8400-e29b-41d4-a716-446655440000-edit').withText("Edit description");
    body.should.containSelector('a#550e8400-e29b-41d4-a716-446655440000-cancel').withAttribute("style", "display: none").withText("cancel");
    body.should.containSelector('input#550e8400-e29b-41d4-a716-446655440000-save').withAttribute("style", "display: none").withAttribute("type", "button").withAttribute("value", "Save changes");
    body.should.containSelector('a#550e8400-e29b-41d4-a716-446655440000-revoke').withText("Revoke key");
    body.should.containSelector('div#550e8400-e29b-41d4-a716-446655440000-revoke-message').withAttribute("style", "display: none");
    body.should.containSelector('div#550e8400-e29b-41d4-a716-446655440000-revoked').withAttribute("style", "display: none");

    body.should.containSelector('input#generateButton').withAttribute("value", "Generate a new key").withAttribute("type", "button");
    body.should.containSelector('a#generateLink').withAttribute("href", "/tokens/generate/12345");
  });

  it('should render the number of active developer keys for the account (for 2 keys)', function () {
    var templateData = {
      'account_id' : 12345,
      'tokens' : [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"description token 1"},
                  {"token_link":"550e8400-e29b-41d4-a716-446655441234", "description":"description token 2"}],
      'header2': "There are 2 active developer keys"
    };
    var body = renderTemplate('token', templateData);

    body.should.containSelector('h1').withText("Developer keys");
    body.should.containSelector('h2').withText("There are 2 active developer keys");
    body.should.containSelector('h3').withText("Active keys");

    body.should.containSelector('div#550e8400-e29b-41d4-a716-446655440000-description');
    body.should.containSelector('div#550e8400-e29b-41d4-a716-446655441234-description');
    body.should.containSelector('a#550e8400-e29b-41d4-a716-446655440000-edit').withText("Edit description");
    body.should.containSelector('a#550e8400-e29b-41d4-a716-446655441234-edit').withText("Edit description");
    body.should.containSelector('a#550e8400-e29b-41d4-a716-446655440000-cancel').withAttribute("style", "display: none").withText("cancel");
    body.should.containSelector('a#550e8400-e29b-41d4-a716-446655441234-cancel').withAttribute("style", "display: none").withText("cancel");
    body.should.containSelector('input#550e8400-e29b-41d4-a716-446655440000-save').withAttribute("style", "display: none").withAttribute("type", "button").withAttribute("value", "Save changes");
    body.should.containSelector('input#550e8400-e29b-41d4-a716-446655441234-save').withAttribute("style", "display: none").withAttribute("type", "button").withAttribute("value", "Save changes");
    body.should.containSelector('a#550e8400-e29b-41d4-a716-446655440000-revoke').withText("Revoke key");
    body.should.containSelector('a#550e8400-e29b-41d4-a716-446655441234-revoke').withText("Revoke key");
    body.should.containSelector('div#550e8400-e29b-41d4-a716-446655440000-revoke-message').withAttribute("style", "display: none");
    body.should.containSelector('div#550e8400-e29b-41d4-a716-446655441234-revoke-message').withAttribute("style", "display: none");
    body.should.containSelector('div#550e8400-e29b-41d4-a716-446655440000-revoked').withAttribute("style", "display: none");
    body.should.containSelector('div#550e8400-e29b-41d4-a716-446655441234-revoked').withAttribute("style", "display: none");

    body.should.containSelector('input#generateButton').withAttribute("value", "Generate a new key").withAttribute("type", "button");
    body.should.containSelector('a#generateLink').withAttribute("href", "/tokens/generate/12345");
  });

  it('should render revoked tokens', function () {
    var templateData = {
      'account_id' : 12345,
      'tokens' : [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"revoked token", "revoked": "18 Oct 2015"},
                  {"token_link":"550e8400-e29b-41d4-a716-446655441234", "description":"non-revoked token"}],
      'header2': "There is 1 active developer key"
    };
    var body = renderTemplate('token', templateData);

    body.should.containSelector('h1').withText("Developer keys");
    body.should.containSelector('h2').withText("There is 1 active developer key");
    body.should.containSelector('h3').withText("Active keys");

    body.should.containSelector('div#550e8400-e29b-41d4-a716-446655440000-description');
    body.should.containSelector('div#550e8400-e29b-41d4-a716-446655441234-description');

    body.should.containNoSelector('a#550e8400-e29b-41d4-a716-446655440000-edit');
    body.should.containSelector('a#550e8400-e29b-41d4-a716-446655441234-edit').withText("Edit description");

    body.should.containNoSelector('a#550e8400-e29b-41d4-a716-446655440000-cancel');
    body.should.containSelector('a#550e8400-e29b-41d4-a716-446655441234-cancel').withAttribute("style", "display: none").withText("cancel");

    body.should.containNoSelector('input#550e8400-e29b-41d4-a716-446655440000-save');
    body.should.containSelector('input#550e8400-e29b-41d4-a716-446655441234-save').withAttribute("style", "display: none").withAttribute("type", "button").withAttribute("value", "Save changes");

    body.should.containNoSelector('a#550e8400-e29b-41d4-a716-446655440000-revoke');
    body.should.containSelector('a#550e8400-e29b-41d4-a716-446655441234-revoke').withText("Revoke key");

    body.should.containNoSelector('div#550e8400-e29b-41d4-a716-446655440000-revoke-message');
    body.should.containSelector('div#550e8400-e29b-41d4-a716-446655441234-revoke-message').withAttribute("style", "display: none");

    body.should.containSelector('div#550e8400-e29b-41d4-a716-446655440000-revoked').withText("This key was successfully revoked on 18 Oct 2015. It will no longer enable integration with the platform.");
    body.should.containSelector('div#550e8400-e29b-41d4-a716-446655441234-revoked').withAttribute("style", "display: none");

    body.should.containNoSelector('span#550e8400-e29b-41d4-a716-446655440000-revoked-date');
    body.should.containSelector('span#550e8400-e29b-41d4-a716-446655441234-revoked-date');

    body.should.containSelector('input#generateButton').withAttribute("value", "Generate a new key").withAttribute("type", "button");
    body.should.containSelector('a#generateLink').withAttribute("href", "/tokens/generate/12345");

  });

});

describe('The generate token view', function() {

  describe('After a GET request', function() {

    it('should render a form to request a new token via a post request', function () {
      var templateData = {
        'account_id' : 12345
      };

      var body = renderTemplate('token_generate', templateData);

      body.should.containSelector('h1').withText("Developer keys");
      body.should.containSelector('form').withAttribute('id', 'generateForm').withAttribute('action', '/tokens/generate').withAttribute('method', 'POST');
      body.should.containInputField('description', 'text').withAttribute('maxlength', '100').withAttribute('size', '150').withLabel('description-lbl', 'Add a description for the key');
      body.should.containSelector('input#accountId').withAttribute('id', 'accountId').withAttribute('name', 'accountId').withAttribute('type', 'hidden').withAttribute('value', '12345');
      body.should.containSelector('input#generateButton').withAttribute("value", "Generate key").withAttribute("type", "submit").withAttribute("class", "button").withLabel('generateButton-lbl', 'When generated the key will only be shown once.');
      body.should.containNoSelector('p#token');
      body.should.containSelector('a#cancelLink').withAttribute("href", "/tokens/12345").withText("Cancel");

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
      body.should.containSelector('h1').withText("Developer keys");
      body.should.containSelector('h1').withText("New key generated for account '12345'");
      body.should.containSelector('h2').withText("Please copy this key now as it won't be shown again");
    });

    it('should render the new generated token', function () {
      var templateData = {
        'account_id' : 12345,
        'token' : "550e8400-e29b-41d4-a716-446655440000",
        'description' : 'Test token'
      };
      var body = renderTemplate('token_generate', templateData);
      body.should.containSelector('p#token').withText("550e8400-e29b-41d4-a716-446655440000").withLabel('token-lbl', "Test token");
    });

    it('should render a Finish button', function () {
      var templateData = {
        'account_id' : 12345,
        'token' : "550e8400-e29b-41d4-a716-446655440000",
        'description' : 'Test token'
      };
      var body = renderTemplate('token_generate', templateData);
      body.should.containSelector('input#finishButton').withAttribute("value", "Finish").withAttribute("type", "button");
      body.should.containSelector('a#finishLink').withAttribute("href", "/tokens/12345");
    });

  });

});