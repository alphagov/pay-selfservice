let should = require('chai').should();
let renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;
let paths = require(__dirname + '/../../app/paths.js');

describe('The token view', function() {

  it('should render the number of active API keys for the account (for no keys)', function () {

    let templateData = {
      "active": true,
      "header": 'available-tokens',
      "token_state": 'active',
      "tokens": [],
      "tokens_singular": false,
      permissions: {
        tokens_create: true
      }
    };
    let body = renderTemplate('token', templateData);

    body.should.containSelector('h1').withText("API Keys");
    body.should.containSelector('#available-tokens').withText("There are no active API keys");
    body.should.containSelector('a[href="'+ paths.devTokens.create +'"]').withText('Generate a new key');
    body.should.containNoSelector('.key-list-item');
  });

  it('should render the number of revoked API keys for the account (for no keys)', function () {

    let templateData = {
      "active": false,
      "header": 'revoked-tokens',
      "token_state": 'revoked',
      "tokens": [],
      "tokens_singular": false
    };

    let body = renderTemplate('token', templateData);

    body.should.containSelector('h1').withText("API Keys");
    body.should.containSelector('#revoked-tokens').withText("There are no revoked API keys");
    body.should.containNoSelector('.key-list-item');
  });

  it('should render the active API keys for the account (for 1 key)', function () {

    let tokenLink = '550e8400-e29b-41d4-a716-446655440000',
      templateData = {
        "active": true,
        "header": 'available-tokens',
        "token_state": 'active',
        'tokens' : [{
          "token_link": tokenLink,
          "description":"description token 1",
          "created_by":"user@email.com",
          "issued_date":"05 Sep 2016 - 11:30",
          "last_used":"05 Sep 2016 - 14:35"}
        ],
        'tokens_singular': true
      };
    let body = renderTemplate('token', templateData);

    body.should.containSelector('#available-tokens').withText("There is 1 active API key");

    let tokenContainerSelector = '#' + tokenLink;
    body.should.containSelector(tokenContainerSelector);
    body.should.containNoSelector('.js-toggle-description');
    body.should.containSelector(tokenContainerSelector + ' .heading-small').withText('description token 1');
    body.should.containSelector('#created-by-' + tokenLink).withText("Created by: user@email.com");
    body.should.containSelector('#date-created-' + tokenLink).withText("Date created: 05 Sep 2016 - 11:30");
    body.should.containSelector('#date-used-' + tokenLink).withText("Last used: 05 Sep 2016 - 14:35");
  });

  it('should render the active API keys for the account (for 1 key) and not ab', function () {

    let tokenLink = '550e8400-e29b-41d4-a716-446655440000',
      templateData = {
        "active": true,
        "header": 'available-tokens',
        "token_state": 'active',
        'tokens' : [{
          "token_link": tokenLink,
          "description":"description token 1",
          "created_by":"user@email.com",
          "issued_date":"05 Sep 2016 - 11:30",
          "last_used":"05 Sep 2016 - 14:35"}
        ],
        'tokens_singular': true,
        permissions: {
          tokens_update: true
        }
      };
    
    let body = renderTemplate('token', templateData);

    body.should.containSelector('#available-tokens').withText("There is 1 active API key");

    let tokenContainerSelector = '#' + tokenLink;
    body.should.containSelector('.js-toggle-description');
    body.should.containSelector(tokenContainerSelector);
    body.should.containSelector(tokenContainerSelector + ' .heading-small').withText('description token 1');
    body.should.containSelector('#created-by-' + tokenLink).withText("Created by: user@email.com");
    body.should.containSelector('#date-created-' + tokenLink).withText("Date created: 05 Sep 2016 - 11:30");
    body.should.containSelector('#date-used-' + tokenLink).withText("Last used: 05 Sep 2016 - 14:35");
  });
  
  it('should render the revoked API keys for the account (for 1 key)', function () {
    let tokenLink = '550e8400-e29b-41d4-a716-446655440000',
      templateData = {
        "active": false,
        "header": 'revoked-tokens',
        "token_state": 'revoked',
        "tokens_singular": true,
        'tokens' : [{
          "token_link": tokenLink,
          "description":"description token 1",
          "created_by":"user@email.com",
          "revoked": "05 Sep 2016",
          "issued_date":"05 Sep 2016 - 11:30",
          "last_used":"05 Sep 2016 - 14:35"}
        ]
      };
    let body = renderTemplate('token', templateData);

    body.should.containSelector('#revoked-tokens').withText("There is 1 revoked API key");

    let tokenContainerSelector = '#' + tokenLink;
    body.should.containSelector(tokenContainerSelector);
    body.should.containSelector(tokenContainerSelector + ' .heading-small').withText('description token 1');
    body.should.containSelector(tokenContainerSelector + ' div').withText("Key was revoked on 05 Sep 2016");
  });

  it('should render the number of active API keys for the account (for 2 keys)', function () {
    let templateData = {
      "active": true,
      "header": 'available-tokens',
      "token_state": 'active',
      "tokens_singular": false,
      'tokens': [
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
    let body = renderTemplate('token', templateData);

    body.should.containSelector('#available-tokens').withText("There are 2 active API keys");

    let tokenLink1 = '550e8400-e29b-41d4-a716-446655440000'
    let tokenContainerSelector = '#' + tokenLink1;
    body.should.containSelector(tokenContainerSelector);
    body.should.containSelector(tokenContainerSelector + ' .heading-small').withText('description token 1');
    body.should.containSelector('#created-by-' + tokenLink1).withText("Created by: user1@email.com");
    body.should.containSelector('#date-created-' + tokenLink1).withText("Date created: 05 Sep 2016 - 11:30");
    body.should.containSelector('#date-used-' + tokenLink1).withText("Last used: 05 Sep 2016 - 14:35");

    let tokenLink2 = '550e8400-e29b-41d4-a716-446655441234'
    tokenContainerSelector = '#' + tokenLink2;
    body.should.containSelector(tokenContainerSelector);
    body.should.containSelector(tokenContainerSelector + ' .heading-small').withText('description token 2');
    body.should.containSelector('#created-by-' + tokenLink2).withText("Created by: user2@email.com");
    body.should.containSelector('#date-created-' + tokenLink2).withText("Date created: 05 Sep 2016 - 15:30");
    body.should.containSelector(tokenContainerSelector + ' .key-list-item-meta p').withText("Not used");
  });

  it('should render the number of revoked API keys for the account (for 2 keys)', function () {
    let templateData = {
      "active": false,
      "header": 'revoked-tokens',
      "token_state": 'revoked',
      "tokens_singular": false,
      'tokens': [
        {
          "token_link": "550e8400-e29b-41d4-a716-446655440000",
          "description": "revoked token",
          "revoked": "05 Sep 2016",
          "created_by":"user1@email.com",
          "issued_date":"05 Sep 2016 - 15:30",
          "last_used":"05 Sep 2016 - 19:35"
        },
        {
          "token_link": "550e8400-e29b-41d4-a716-446655441234",
          "description": "revoked token 2",
          "revoked": "08 Sep 2016",
          "created_by":"user2@email.com",
          "issued_date":"07 Sep 2016 - 15:30",
          "last_used":"07 Sep 2016 - 19:35"
        }
      ]
    };
    let body = renderTemplate('token', templateData);

    body.should.containSelector('#revoked-tokens').withText("There are 2 revoked API keys");

    let tokenContainerSelector = '#550e8400-e29b-41d4-a716-446655440000';
    body.should.containSelector(tokenContainerSelector);
    body.should.containSelector(tokenContainerSelector + ' .heading-small').withText('revoked token');
    body.should.containSelector(tokenContainerSelector + ' div').withText("Created by: user1@email.com");
    body.should.containSelector(tokenContainerSelector + ' div').withText("Date created: 05 Sep 2016 - 15:30");
    body.should.containSelector(tokenContainerSelector + ' div').withText("Last used: 05 Sep 2016 - 19:35");
    body.should.containSelector(tokenContainerSelector + ' div').withText("Key was revoked on 05 Sep 2016");

    tokenContainerSelector = '#550e8400-e29b-41d4-a716-446655441234';
    body.should.containSelector(tokenContainerSelector);
    body.should.containSelector(tokenContainerSelector + ' .heading-small').withText('revoked token 2');
    body.should.containSelector(tokenContainerSelector + ' div').withText("Created by: user2@email.com");
    body.should.containSelector(tokenContainerSelector + ' div').withText("Date created: 07 Sep 2016 - 15:30");
    body.should.containSelector(tokenContainerSelector + ' div').withText("Last used: 07 Sep 2016 - 19:35");
    body.should.containSelector(tokenContainerSelector + ' div').withText("Key was revoked on 08 Sep 2016");
  });
});
describe('The generate token view', function() {
  describe('After a GET request', function() {
    it('should render a form to request a new token via a post request', function () {
      let templateData = {};
      let body = renderTemplate('token_generate', templateData);

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
      let templateData = {
        'token' : "550e8400-e29b-41d4-a716-446655440000",
        'description' : 'Test token'
      };

      let body = renderTemplate('token_generate', templateData);
      body.should.containSelector('.page-title').withText("API keys");
      body.should.containSelector('.heading-medium').withText("New key generated");
      body.should.containSelector('p').withText("Please copy this key now as it won’t be shown again");
    });

    it('should render the new generated token', function () {
      let templateData = {
        'token' : "550e8400-e29b-41d4-a716-446655440000",
        'description' : 'Test token'
      };

      let body = renderTemplate('token_generate', templateData);
      body.should.containTextarea('token')
        .withText("550e8400-e29b-41d4-a716-446655440000")
        .withLabel("Test token");
    });

    it('should render a Finish button', function () {
      let templateData = {
        'token' : "550e8400-e29b-41d4-a716-446655440000",
        'description' : 'Test token'
      };

      let body = renderTemplate('token_generate', templateData);
      body.should.containSelector('.button')
        .withAttribute("href", paths.devTokens.index)
        .withText("Finish");
    });
  });
});
