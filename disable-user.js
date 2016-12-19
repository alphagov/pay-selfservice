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
  .usage('Usage: $0 -u [username]')
  .demand(['u'])
  .describe('u', 'username of the user to be disabled')
  .argv;

var username = argv.u;

User.findByUsername(username)
  .then(
    (user)=>
      user.toggleDisabled(true).then(()=> {
        console.log('user disabled');
        exit();
      }),
    ()=> {
      console.log('cant find user');
      exit();
    }
  );
