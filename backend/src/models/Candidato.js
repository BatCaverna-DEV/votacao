import { DataTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/database.js';

const Candidato = sequelize.define('candidatos', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  descricao: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  numero: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  eleicoes_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
});

Candidato.beforeCreate((candidato) => {
  if (!candidato.id) candidato.id = uuidv4();
});

export default Candidato;
