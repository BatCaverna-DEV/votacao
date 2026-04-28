import { DataTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/database.js';

const Voto = sequelize.define('votos', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  candidatos_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  urnas_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
});

Voto.beforeCreate((voto) => {
  if (!voto.id) voto.id = uuidv4();
});

export default Voto;
