var renderTemplate = require(__dirname + '/utils/html_assertions.js').render;
var should = require('chai').should();

describe('The token view', function() {

  it('should render the account for which the token will be generated', function () {
    var templateData = {
      'account_id' : 12345
    };
    var body = renderTemplate('token', templateData);
    body.should.containSelector('h1').withText("Generate developer tokens for account '12345'");
  });

  it('should render the number of active developer keys for the account (for no keys)', function () {
    var templateData = {
      'account_id' : 12345,
      'tokens' : [],
      'header2': "There are no active developer keys"
    };
    var body = renderTemplate('token', templateData);
    body.should.containSelector('h1').withText("Generate developer tokens for account '12345'");
    body.should.containSelector('h2').withText("There are no active developer keys");
  });

  it('should render the number of active developer keys for the account (for 1 key)', function () {
    var templateData = {
      'account_id' : 12345,
      'tokens' : [{"token_id":1, "description":"token 1"}],
      'header2': "There is 1 active developer key"
    };
    var body = renderTemplate('token', templateData);

    body.should.containSelector('h1').withText("Generate developer tokens for account '12345'");
    body.should.containSelector('h2').withText("There is 1 active developer key");
    body.should.containSelector('h3').withText("Active keys");
    body.should.containSelector('b#1-description');
  });

  it('should render the number of active developer keys for the account (for 2 key)', function () {
    var templateData = {
      'account_id' : 12345,
      'tokens' : [{"token_id":1, "description":"token 1"},{"token_id":2, "description":"token 2"}],
      'header2': "There are 2 active developer keys"
    };
    var body = renderTemplate('token', templateData);

    body.should.containSelector('h1').withText("Generate developer tokens for account '12345'");
    body.should.containSelector('h2').withText("There are 2 active developer keys");
    body.should.containSelector('h3').withText("Active keys");
    body.should.containSelector('b#1-description');
    body.should.containSelector('b#2-description');
  });

  it('should render a button to generate new developer keys when there are no issued tokens', function () {
    var templateData = {
      'account_id' : 12345,
       'tokens' : []
    };
    var body = renderTemplate('token', templateData);
    body.should.containSelector('input#generateButton').withAttribute("value", "Generate a new key").withAttribute("type", "button");
    body.should.containSelector('a#generateLink').withAttribute("href", "/tokens/generate/12345");
  });

  it('should render a button to generate new developer keys when there are issued tokens', function () {
    var templateData = {
      'account_id' : 12345,
      'tokens' : [{"token_id":1, "description":"token 1"},{"token_id":2, "description":"token 2"}]
    };
    var body = renderTemplate('token', templateData);
    body.should.containSelector('input#generateButton').withAttribute("value", "Generate a new key").withAttribute("type", "button");
    body.should.containSelector('a#generateLink').withAttribute("href", "/tokens/generate/12345");
  });

});

describe('The generate token view', function() {

  describe('After a GET request', function() {

    it('should render the account for which the token will be generated', function () {
      var templateData = {
        'account_id' : 12345
      };
      var body = renderTemplate('token_generate', templateData);
      body.should.containSelector('h1').withText("Generate developer tokens for account '12345'");
    });

    it('should render a form to request a new token via a post request', function () {
      var templateData = {
        'account_id' : 12345
      };
      var body = renderTemplate('token_generate', templateData);
      body.should.containSelector('form').withAttribute('id', 'generateForm').withAttribute('action', '/tokens/generate').withAttribute('method', 'POST');
      body.should.containInputField('description', 'text').withAttribute('maxlength', '100').withAttribute('size', '150').withLabel('description-lbl', 'Add a description for the key');
      body.should.containSelector('input#accountId').withAttribute('id', 'accountId').withAttribute('name', 'accountId').withAttribute('type', 'hidden').withAttribute('value', '12345');
      body.should.containSelector('input#generateButton').withAttribute("value", "Generate key").withAttribute("type", "submit").withAttribute("class", "button").withLabel('generateButton-lbl', 'When generated the key will only be shown once.');
      body.should.containNoSelector('p#token');
    });

    it('should render a cancel link', function () {
      var templateData = {
        'account_id' : 12345
      };
      var body = renderTemplate('token_generate', templateData);
      body.should.containSelector('a#cancelLink').withAttribute("href", "/tokens/12345").withText("Cancel");
    });

  });

  describe('After a POST request', function() {

    it('should render the account for which the token will be generated', function () {
      var templateData = {
        'account_id' : 12345,
        'token' : 112233,
        'description' : 'Test token'
      };
      var body = renderTemplate('token_generate', templateData);
      body.should.containSelector('h1').withText("New key generated for account '12345'");
      body.should.containSelector('h2').withText("Please copy this key now as it won't be shown again");
    });

    it('should render the new generated token', function () {
      var templateData = {
        'account_id' : 12345,
        'token' : 112233,
        'description' : 'Test token'
      };
      var body = renderTemplate('token_generate', templateData);
      body.should.containSelector('p#token').withText("112233").withLabel('token-lbl', "Test token");
    });

    it('should render a Finish button', function () {
      var templateData = {
        'account_id' : 12345,
        'token' : 112233,
        'description' : 'Test token'
      };
      var body = renderTemplate('token_generate', templateData);
      body.should.containSelector('input#finishButton').withAttribute("value", "Finish").withAttribute("type", "button");
      body.should.containSelector('a#finishLink').withAttribute("href", "/tokens/12345");
    });

  });

});