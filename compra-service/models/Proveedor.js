const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Proveedor = sequelize.define('proveedores', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    ruc: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    razon_social: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    nombre_comercial: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    contacto_nombre: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contacto_telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    contacto_email: {
      type: DataTypes.STRING(100),
      allowNull: true
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
    tableName: 'proveedores'
  });

  return Proveedor;
};