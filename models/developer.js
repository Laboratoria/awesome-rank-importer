'use strict';
module.exports = function(sequelize, DataTypes) {
  var Developer = sequelize.define('Developer', {
    name: DataTypes.STRING,
    lastname: DataTypes.STRING,
    age: DataTypes.INTEGER,
    campusId: DataTypes.INTEGER,
    photoUrl: DataTypes.STRING,
    title: DataTypes.STRING,
    captainLink: DataTypes.STRING,
		squadId: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
        models.Campus.hasMany(Developer, { constraints: true, foreignKey: 'campusId' });
        models.Squad.hasMany(Developer, { constraints: true, foreignKey: 'squadId' });
      }
    }
  });
  return Developer;
};
