import { DataTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/database.js';
import { TIPO_VOTO } from '../helpers/voto.js';

const Voto = sequelize.define('votos', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  // Votos em branco e nulos não pertencem a nenhum candidato
  candidatos_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  urnas_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  tipo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: TIPO_VOTO.NOMINAL,
    comment: '1=nominal, 2=branco, 3=nulo',
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  validate: {
    candidatoConformeTipo() {
      if (this.tipo === TIPO_VOTO.NOMINAL && !this.candidatos_id) {
        throw new Error('Voto nominal precisa de um candidato');
      }
      if (this.tipo !== TIPO_VOTO.NOMINAL && this.candidatos_id) {
        throw new Error('Votos em branco e nulos não podem ter candidato');
      }
    },
  },
});

Voto.beforeCreate((voto) => {
  if (!voto.id) voto.id = uuidv4();
});

export default Voto;
