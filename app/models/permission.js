var sequelizeConfig     = require('../utils/sequelize_config.js');
var sequelizeConnection = sequelizeConfig.sequelize;
var Sequelize           = require('sequelize');

var Permission = sequelizeConnection.define('permissions', {
  name: {
    unique: true,
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  }
});

module.exports = {
  sequelize: Permission,
};
