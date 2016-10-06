'use strict'
var User 	= require('./app/models/user.js');
var logger  = require('winston');
var argv    = require('yargs')
  .usage('Usage: $0 -u [email]')
  .demand(['u'])
  .describe('u', 'user email address to be deleted from session')
  .argv;

var userEmail = argv.u;

logger.debug('Preparing to logout');

User.find(userEmail).then(
	(user)=>{
		user.logOut().then(
			()=> {logger.debug('USER LOGGED OUT')},
			()=> {logger.info('PROBLEM LOGGIN USER OUT')}
		)
	},
	()=> logger.info('CANT FIND USER')
);
