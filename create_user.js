/*jshint esversion: 6 */

var User      = require(__dirname + '/app/models/user.js');
var logger    = require('winston');
user = {
   username: Math.random().toString(36).substring(7),
   password: "12345",
   email: "andrew.hilton@digital.cabinet-office.gov.uk",
   telephone_number: "07809610784",
   gateway_account_id: "12345"
 };
logger.debug('creating user',user);
User.create(user).then(()=> logger.debug('created user'),(err)=> logger.debug('failed to create user',err));
