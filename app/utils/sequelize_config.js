'use strict';

var Sequelize = require('sequelize');
var instance = null;

function createInstance(){
    return new Sequelize(process.env.DATABASE_URL,{
    dialect: 'postgres',
    protocol: 'postgres',
    "logging": false,
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
