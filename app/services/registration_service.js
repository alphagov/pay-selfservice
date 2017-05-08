const q = require('q');
const logger = require('winston');

let getAdminUsersClient = require('./clients/adminusers_client');
let paths = require(__dirname + '/../paths.js');
let commonPassword = require('common-password');
const MIN_PASSWORD_LENGTH = 10;

module.exports = {

  getValidatedInvite: function (code, correlationId) {

    return getAdminUsersClient({correlationId: correlationId}).getValidatedInvite(code);
  }
};
