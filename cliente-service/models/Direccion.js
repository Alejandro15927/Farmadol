const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Direccion = sequelize.define('direcciones', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    cliente_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id'
      }
    },
    tipo: {
      type: DataTypes.ENUM('casa', 'trabajo', 'otro'),
      defaultValue: 'casa'
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    referencia: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    distrito: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    ciudad: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    departamento: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    codigo_postal: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    es_principal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false,
    tableName: 'direcciones'
  });

  return Direccion;
};