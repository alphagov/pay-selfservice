'use strict';
var Sequelize = require('sequelize');
var testMode       = process.env.NODE_TEST_MODE || false;
// This will go away as soon database goes away (Sequelize dies)
function createInstance() {
  if(testMode) {
    return new Sequelize('database', 'username', 'password', {
      dialect: 'sqlite',
      storage: __dirname + '/../../database.sqlite',
      define: {
        syncOnAssociation: true
      },
      logging: false
    });
  }
  return new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    "logging": process.env.DATABASE_LOGGING ? process.env.DATABASE_LOGGING : false,
    native: true,
    dialectOptions: {
      ssl: true
    }
  });
}
module.exports = function () {
  return {
    sequelize: createInstance()
  };
}();
