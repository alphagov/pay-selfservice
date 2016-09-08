'use strict'

var database = require('./app/utils/database.js');
var User     = require('./app/models/user.js');

var chalk = require('chalk');
var argv = require('yargs')
  .usage('Usage: $0 -u [email]')
  .demand(['u'])
  .describe('u', 'user email address to be deleted from session')
  .argv;

var userEmail = argv.u;


User.find(userEmail)
  .then(
    (user)=> user.toggleDisabled(true).then(()=> console.log('user disabled') ),
    ()=> console.log('cant find user')
  );
