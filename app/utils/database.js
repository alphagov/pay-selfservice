'use strict'

const Sequelize = require('sequelize');

const sequelizeSession =  new Sequelize(
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

module.exports.deleteSession = function (userEmail, next) {

 // unfortunately, sequalize's query binding doesn't seem to work when the bind variable is inside a complex String/Json
 // Therefore we cannot use sql binding for `userEmail` below and using string concatenation.
  var checkUserQuery = 'delete from "Sessions" where data like \'%\' || \'"emails":[{"value":"' + userEmail+ '"}]\' || \'%\'';

  sequelizeSession.query(checkUserQuery)
    .spread(function(result, metadata) {
      next(metadata.rowCount);
    });

};
