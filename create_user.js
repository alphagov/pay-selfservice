/*jshint esversion: 6 */
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL NOT SET, have you used ./env.sh?');
  exit();
  return;
}

var User      = require(__dirname + '/app/models/user.js');
var logger    = require('winston');
user = {
   username: Math.random().toString(36).substring(7),
   password: "1234567890",
   email: "andrew.hilton1@digital.cabinet-office.gov.uk",
   telephone_number: "07809610784",
   gateway_account_id: "12345"
 };
logger.debug('creating user',user);
User.create(user).then(()=> logger.info('created user'),(err)=> logger.info('failed to create user',err));
