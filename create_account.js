User = require('./app/models/user.js');
var genereateRandomUsername = function(){
  return  Math.random().toString(36).substring(7);
}();
createUser = function(params){
  User.create({
  username: params.username,
  password: params.password,
  gateway_account_id: params.gateway,
  email: params.email
}).then(function(user){
  console.log(JSON.stringify(user));
  process.exit();
},function(){
  process.exit(1);
});
};


if (process.env.TEST_ACCOUNT) {
  createUser({
    username: genereateRandomUsername,
    password: "password",
    gateway_account_id: process.env.GATEWAY_ACCOUNT_ID,
    email: genereateRandomUsername + "@hello.com"
  });
} else {
   createUser({
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
    gateway_account_id: process.env.GATEWAY_ACCOUNT_ID,
    email:process.env.EMAIL
  });
}



