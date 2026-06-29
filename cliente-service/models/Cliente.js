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
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    telefono_alternativo: {
      type: DataTypes.STRING(20),
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
    estado_civil: {
      type: DataTypes.ENUM('soltero', 'casado', 'divorciado', 'viudo'),
      allowNull: true
    },
    ocupacion: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    fecha_registro: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    ultima_compra: {
      type: DataTypes.DATE,
      allowNull: true
    },
    total_compras: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_gastado: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    promedio_gasto: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    puntos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    nivel: {
      type: DataTypes.ENUM('bronce', 'plata', 'oro', 'platino', 'diamante'),
      defaultValue: 'bronce'
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
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