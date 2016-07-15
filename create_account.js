User = require('./app/models/user.js');
var genereateRandomUsername = function(){
  return  Math.random().toString(36).substring(7);
}();
User.create({
  username: genereateRandomUsername,
  password: 'password',
  gateway_account_id: process.env.GATEWAY_ACCOUNT_ID,
  email: genereateRandomUsername + "@hello.com"
}).then(function(user){
  console.log(JSON.stringify(user));
  process.exit();
},function(){
  process.exit(1);
});


