'use strict'

var database = require('./app/utils/database.js');
var chalk = require('chalk');
var argv = require('yargs')
  .usage('Usage: $0 -u [email]')
  .demand(['u'])
  .describe('u', 'user email address to be deleted from session')
  .argv;

var userEmail = argv.u;

console.log(chalk.yellow('Preparing to delete session for: ' + userEmail));

database.deleteSession(userEmail, function (result, err) {

  if (result === 1) {
    console.log(chalk.green('Deleted session for: ' + userEmail));

  } else if (result === 0) {
    console.log(chalk.yellow('Session for : [' + userEmail + '] not found'));
  }
});
