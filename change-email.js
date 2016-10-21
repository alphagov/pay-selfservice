'use strict';
var exit = ()=> process.exit();
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL NOT SET, have you used ./env.sh?');
  exit();
  return;
}

var User = require('./app/models/user.js');

var chalk = require('chalk');
var argv = require('yargs')
  .usage('Usage: $0 -u [current_email] -n [new_email] ')
  .demand(['u'])
  .describe('u', 'user email address to be disabled')
  .argv;

var oldEmail = argv.u;
var newEmail = argv.n;


User.find(oldEmail)
  .then(
    (user)=> {
      user.updateUserNameAndEmail(newEmail).then(()=> {
        console.log('email:' + oldEmail + " updated to:" + newEmail);
        exit();
      }, ()=> console.log("BOOM")) 
    },
    ()=> {
      console.log('cant find user');
      exit();
    }
  );