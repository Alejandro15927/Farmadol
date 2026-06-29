const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cliente = sequelize.define('clientes', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    tipo_documento: {
      type: DataTypes.ENUM('DNI', 'RUC', 'CE', 'PASAPORTE'),
      allowNull: false,
      defaultValue: 'DNI'
    },
    numero_documento: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    nombres: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    apellidos: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    razon_social: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fecha_nacimiento: {
      type: DataTypes.DATE,
      allowNull: true
    },
    genero: {
      type: DataTypes.ENUM('M', 'F', 'OTRO'),
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
    tableName: 'clientes'
  });

  return Cliente;
};