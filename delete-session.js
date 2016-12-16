'use strict'
var User 	= require('./app/models/user.js');
var logger  = require('winston');
var argv    = require('yargs')
  .usage('Usage: $0 -u [username]')
  .demand(['u'])
  .describe('u', 'username of the user to be deleted from session')
  .argv;

var username = argv.u;

logger.debug('Preparing to logout');

User.findByUsername(username).then(
	(user)=>{
		user.logOut().then(
			()=> {logger.debug('USER LOGGED OUT')},
			()=> {logger.info('PROBLEM LOGGIN USER OUT')}
		)
	},
	()=> logger.info('CANT FIND USER')
);
