var should = require('chai').should();
var renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;
var paths = require(__dirname + '/../../app/paths.js');

describe('The token view', function() {
  it('should render the number of active API keys for the account (for no keys)', function () {
    var templateData = {
      'tokens' : []
    };
    var body = renderTemplate('token', templateData);

    body.should.containSelector('h1').withText("API Keys");
    body.should.containSelector('#available-tokens').withText("There are no active API keys");
    body.should.containSelector('a[href="'+ paths.devTokens.create +'"]').withText('Generate a new key');
    body.should.containNoSelector('.key-list-item');
  });

  it('should render the active API keys for the account (for 1 key)', function () {
    var tokenLink = '550e8400-e29b-41d4-a716-446655440000',
        templateData = {
          'active_tokens' : [{
            "token_link": tokenLink,
            "description":"description token 1",
            "created_by":"user@email.com",
            "issued_date":"05 Sep 2016 - 11:30",
            "last_used":"05 Sep 2016 - 14:35"}
          ],
          'active_tokens_singular': true
        };
    var body = renderTemplate('token', templateData);

    body.should.containSelector('#available-tokens').withText("There is 1 active API key");
    body.should.containSelector('h3').withText("Active keys");

    var tokenContainerSelector = '#' + tokenLink;
    body.should.containSelector(tokenContainerSelector);
    body.should.containSelector(tokenContainerSelector + ' .heading-small').withText('description token 1');
    body.should.containSelector(tokenContainerSelector + ' div').withText("Created by: user@email.com");
    body.should.containSelector(tokenContainerSelector + ' div').withText("Date created: 05 Sep 2016 - 11:30");
    body.should.containSelector(tokenContainerSelector + ' div').withText("Last used: 05 Sep 2016 - 14:35");
  });

  it('should render the number of active API keys for the account (for 2 keys)', function () {
    var templateData = {
      'active_tokens': [
        {
          "token_link": "550e8400-e29b-41d4-a716-446655440000",
          "description": "description token 1",
          "created_by":"user1@email.com",
          "issued_date":"05 Sep 2016 - 11:30",
          "last_used":"05 Sep 2016 - 14:35"
        },
        {
          "token_link": "550e8400-e29b-41d4-a716-446655441234",
          "description": "description token 2",
          "created_by":"user2@email.com",
          "issued_date":"05 Sep 2016 - 15:30"
        }
      ]
    };
    var body = renderTemplate('token', templateData);

    body.should.containSelector('#available-tokens').withText("There are 2 active API keys");
    body.should.containSelector('h3').withText("Active keys");

    var tokenContainerSelector = '#550e8400-e29b-41d4-a716-446655440000';
    body.should.containSelector(tokenContainerSelector);
    body.should.containSelector(tokenContainerSelector + ' .heading-small').withText('description token 1');
    body.should.containSelector(tokenContainerSelector + ' div').withText("Created by: user1@email.com");
    body.should.containSelector(tokenContainerSelector + ' div').withText("Date created: 05 Sep 2016 - 11:30");
    body.should.containSelector(tokenContainerSelector + ' div').withText("Last used: 05 Sep 2016 - 14:35");

    tokenContainerSelector = '#550e8400-e29b-41d4-a716-446655441234';
    body.should.containSelector(tokenContainerSelector);
    body.should.containSelector(tokenContainerSelector + ' .heading-small').withText('description token 2');
    body.should.containSelector(tokenContainerSelector + ' div').withText("Created by: user2@email.com");
    body.should.containSelector(tokenContainerSelector + ' div').withText("Date created: 05 Sep 2016 - 15:30");
    body.should.containSelector(tokenContainerSelector + ' div').withText("Not used");
  });

  it('should render revoked tokens', function () {
    var templateData = {
      'active_tokens': [
        {
          "token_link": "550e8400-e29b-41d4-a716-446655441234",
          "description": "non-revoked token",
          "created_by":"user1@email.com",
          "issued_date":"05 Sep 2016 - 11:30",
          "last_used":"05 Sep 2016 - 14:35"
        }
      ],
      'revoked_tokens': [
        {
          "token_link": "550e8400-e29b-41d4-a716-446655440000",
          "description": "revoked token",
          "revoked": "18 Oct 2015",
          "created_by":"user2@email.com",
          "issued_date":"05 Sep 2016 - 15:30",
          "last_used":"05 Sep 2016 - 19:35"
        }
      ]
    };
    var body = renderTemplate('token', templateData);

    body.should.containSelector('h3').withText("Active keys");
    body.should.containSelector('h3').withText("Revoked keys");

    var tokenContainerSelector = '#550e8400-e29b-41d4-a716-446655440000';
    body.should.containSelector(tokenContainerSelector);
    body.should.containSelector(tokenContainerSelector + ' div').withText("Key was revoked on 18 Oct 2015");
    body.should.containSelector(tokenContainerSelector + ' div').withText("Created by: user2@email.com");
    body.should.containSelector(tokenContainerSelector + ' div').withText("Date created: 05 Sep 2016 - 15:30");
    body.should.containSelector(tokenContainerSelector + ' div').withText("Last used: 05 Sep 2016 - 19:35");
  });

});

describe('The generate token view', function() {
  describe('After a GET request', function() {
    it('should render a form to request a new token via a post request', function () {
      var templateData = {};
      var body = renderTemplate('token_generate', templateData);

      body.should.containSelector('.page-title').withText("API keys");

      body.should.containSelector('form')
        .withAttribute('action', paths.devTokens.create)
        .withAttribute('method', 'post');

      body.should.containTextarea('description')
        .withAttribute('maxlength', '100')
        .withAttribute('size', '150')
        .withLabel('Add a description for the key');

      body.should.containSelector('.button')
        .withAttribute("value", "Generate key")
        .withAttribute("type", "submit")
        .withAttribute("class", "button");

      body.should.containNoSelector('textarea#token');

      body.should.containSelector('a[href="' + paths.devTokens.index +'"]')
        .withText("Cancel");
    });

  });

  describe('After a POST request', function() {
    it('should render the account for which the token will be generated', function () {
      var templateData = {
        'token' : "550e8400-e29b-41d4-a716-446655440000",
        'description' : 'Test token'
      };

      var body = renderTemplate('token_generate', templateData);
      body.should.containSelector('.page-title').withText("API keys");
      body.should.containSelector('.heading-medium').withText("New key generated");
      body.should.containSelector('p').withText("Please copy this key now as it won’t be shown again");
    });

    it('should render the new generated token', function () {
      var templateData = {
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
        'token' : "550e8400-e29b-41d4-a716-446655440000",
        'description' : 'Test token'
      };

      var body = renderTemplate('token_generate', templateData);
      body.should.containSelector('.button')
        .withAttribute("href", paths.devTokens.index)
        .withText("Finish");
    });
  });
});
