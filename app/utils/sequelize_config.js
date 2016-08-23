'use strict';

var Sequelize = require('sequelize');
var instance = null;

function createInstance(){
    return new Sequelize(
      process.env.DATABASE_NAME,
      process.env.DATABASE_USER,
      process.env.DATABASE_PASSWORD, {
        "dialect": "postgres",
        "host": process.env.DATABASE_HOST,
        "port": process.env.DATABASE_PORT,
        "logging": false,
        "ssl": true,
        "native": true
    });
}


module.exports = function () {

  return {
    sequelize: createInstance()
};

}();
