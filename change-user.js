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
  .usage('Usage: $0 -u [current username] -n [new_username] -e [new_email]')
  .demand(['u'])
  .describe('u', 'current username')
  .describe('n', 'new username for the user')
  .describe('e', 'new email address for the user')
  .argv;

var currentUsername = argv.u;
var newUsername = argv.n || '';
var newEmail = argv.e || '';

User.findByUsername(currentUsername)
  .then(
    (user)=> {
      user.updateUserNameAndEmail(newEmail, newUsername).then(()=> {
        if (argv.n) {
          console.log('username:' + currentUsername + " updated to:" + newUsername);
        }
        if (argv.e) {
          console.log('email updated to:' + newEmail);
        }
        exit();
      }, ()=> console.log("BOOM"))
    },
    ()=> {
      console.log('cant find user');
      exit();
    }
  );
