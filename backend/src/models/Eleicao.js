import { DataTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/database.js';

const Eleicao = sequelize.define('eleicoes', {
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
    comment: '0=inativa, 1=ativa, 2=encerrada',
  },
  inicio: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fim: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

Eleicao.beforeCreate((eleicao) => {
  if (!eleicao.id) eleicao.id = uuidv4();
});

export default Eleicao;
