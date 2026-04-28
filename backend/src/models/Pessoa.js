import { DataTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/database.js';

const Pessoa = sequelize.define('pessoas', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  matricula: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  curso: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  usuarios_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
});

Pessoa.beforeCreate((pessoa) => {
  if (!pessoa.id) pessoa.id = uuidv4();
});

export default Pessoa;
