var sequelizeConfig = require('../utils/sequelize_config.js');
var sequelizeConnection = sequelizeConfig.sequelize;
var Sequelize = require('sequelize');

var UserRole = sequelizeConnection.define('user_role', {
    role_id: {
      unique: true,
      type: Sequelize.INTEGER,
    },
    user_id: {
      unique: true,
      type: Sequelize.INTEGER,
    }
  },
  {
    tableName: 'user_role',
  });

module.exports = {
  sequelize: UserRole,
};
