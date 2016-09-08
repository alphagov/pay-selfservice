'use strict';
var exit = ()=> process.exit();
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL NOT SET, have you used ./env.sh?');
  exit();
  return;
}

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
    (user)=>{
      console.log(user.generateOTP());
      exit();
    },
    ()=> {
      console.log('cant find user');
      exit();
    }
  );
