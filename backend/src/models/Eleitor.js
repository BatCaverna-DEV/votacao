import { DataTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/database.js';

const Eleitor = sequelize.define('eleitores', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '0=não votou, 1=votou',
  },
  pessoas_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  eleicoes_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
});

Eleitor.beforeCreate((eleitor) => {
  if (!eleitor.id) eleitor.id = uuidv4();
});

export default Eleitor;
