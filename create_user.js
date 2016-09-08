/*jshint esversion: 6 */
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL NOT SET, have you used ./env.sh?');
  exit();
  return;
}

var User = require(__dirname + '/app/models/user.js');
user = {
   username: Math.random().toString(36).substring(7),
   password: "12345",
   email: "andrew.hilton@digital.cabinet-office.gov.uk",
   telephone_number: "07809610784",
   gateway_account_id: "12345"
 };
console.log('creating user',user);
User.create(user).then(()=> console.log('created user'),(err)=> console.log('failed to create user',err));
