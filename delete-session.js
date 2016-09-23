'use strict'

var database = require('./app/utils/database.js');
var logger   = require('winston');
var argv     = require('yargs')
  .usage('Usage: $0 -u [email]')
  .demand(['u'])
  .describe('u', 'user email address to be deleted from session')
  .argv;

var userEmail = argv.u;

logger.debug('Preparing to delete session for: ' + userEmail);

database.deleteSession(userEmail, function (result, err) {

  if (result === 1) {
    logger.debug('Deleted user session');

  } else if (result === 0) {
    logger.debug('Session for the provided email was not found');
  }
});
