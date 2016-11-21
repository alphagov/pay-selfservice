'use strict';
var Sequelize = require('sequelize');
function createInstance() {

  if(process.env.DATABASE_URL.startsWith('sqlite')) {
    return new Sequelize('database', 'username', 'password', {
      dialect: 'sqlite',
      // - default ':memory:'
      storage: __dirname + '/database.sqlite',
      define: {
        syncOnAssociation: true
      }
    });
  }
  return new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    "logging": process.env.DATABASE_LOGGING ? process.env.DATABASE_LOGGING : false,
    native: true,
    dialectOptions: {
      ssl: true
    },
    define: {
      syncOnAssociation: true
    }
  });
}
module.exports = function () {
  return {
    sequelize: createInstance()
  };
}();
