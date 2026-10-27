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
    comment: '1=fechada, 2=aberta, 3=apurada',
  },
  eleicoes_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  eleitores_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Eleitor liberado pelo mesário que ainda não concluiu o voto',
  },
  sessao: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Sessão do dispositivo que está com a urna aberta',
  },
  ultimo_contato: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Último sinal de vida do dispositivo da sessão',
  },
});

Urna.beforeCreate((urna) => {
  if (!urna.id) urna.id = uuidv4();
});

export default Urna;
