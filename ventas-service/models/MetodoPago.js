const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MetodoPago = sequelize.define('metodos_pago', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    descripcion: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: false,
    tableName: 'metodos_pago'
  });

  return MetodoPago;
};