'use strict';

const Sequelize = require('sequelize');

const sequelizeSession =  new Sequelize(process.env.DATABASE_URL,{
    dialect: 'postgres',
    protocol: 'postgres',
    "logging": false,
    native: true,
    dialectOptions: {
        ssl: true
    }
});

module.exports.deleteSession = function (userEmail, next) {

  // unfortunately, sequalize's query binding doesn't seem to work when the bind variable is inside a complex String/Json
  // Therefore we cannot use sql binding for `userEmail` below and using string concatenation.
  // This should not be a problem given this is a backend webops operation and the emails address is not something
  // we expect to collect from external user input.
  var checkUserQuery = 'delete from "Sessions" where data like \'%\' || \'"emails":[{"value":"' + userEmail + '"}]\' || \'%\'';

  sequelizeSession.query(checkUserQuery)
    .spread(function (result, metadata) {
      next(metadata.rowCount);
    });

};
