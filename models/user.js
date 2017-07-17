'use strict';
module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    name: DataTypes.STRING,
    lastname: DataTypes.STRING,
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    company: DataTypes.STRING,
		campusId: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        models.Campus.hasMany(User, { constraints: true, foreignKey: 'campusId' });
      }
    }
  });
  return User;
};
