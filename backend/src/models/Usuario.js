import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/database.js';

const Usuario = sequelize.define('usuarios', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  username: {
    type: DataTypes.STRING(45),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(250),
    allowNull: false,
  },
  categoria: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '1=admin, 2=eleitor',
  },
});

Usuario.beforeCreate((usuario) => {
  if (!usuario.id) usuario.id = uuidv4();
});

Usuario.beforeSave(async (usuario) => {
  if (usuario.changed('password')) {
    usuario.password = await bcrypt.hash(usuario.password, 10);
  }
});

Usuario.prototype.verificarSenha = function (senha) {
  return bcrypt.compare(senha, this.password);
};

export default Usuario;
