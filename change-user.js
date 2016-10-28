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
  .usage('Usage: $0 -e [current_email] -n [new_email] -u [username]')
  .demand(['e'])
  .describe('e', 'current email address of the user')
  .describe('n', 'new email address for the user')
  .describe('u', 'new username for the user')
  .argv;

var oldEmail = argv.e;
var newEmail = argv.n || '';
var newUserName = argv.u || '';


User.find(oldEmail)
  .then(
    (user)=> {
      user.updateUserNameAndEmail(newEmail, newUserName).then(()=> {
        if (argv.n) {
          console.log('email:' + oldEmail + " updated to:" + newEmail);
        }
        if (argv.u) {
          console.log('username updated to:' + newUserName);
        }
        exit();
      }, ()=> console.log("BOOM"))
    },
    ()=> {
      console.log('cant find user');
      exit();
    }
  );
