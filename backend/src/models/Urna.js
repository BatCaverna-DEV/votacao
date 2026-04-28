import { DataTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/database.js';

const Urna = sequelize.define('urnas', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  descricao: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '0=inativa, 1=ativa',
  },
  eleicoes_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
});

Urna.beforeCreate((urna) => {
  if (!urna.id) urna.id = uuidv4();
});

export default Urna;
