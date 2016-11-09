var sequelizeConfig = require('../utils/sequelize_config.js');
var sequelizeConnection = sequelizeConfig.sequelize;
var Sequelize = require('sequelize');
var Permission = require('./permission.js').sequelize;

var Role = sequelizeConnection.define('role', {
  description: {
    unique: true,
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  }
});

Role.belongsToMany(Permission, {as: 'permissions', through: 'role_permission'});
Role.sequelize.sync();

module.exports = {
  sequelize: Role,
};
