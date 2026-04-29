import 'dotenv/config';
import sequelize from './src/config/database.js';
import './src/models/index.js';

console.log('Conectando ao banco...');

try {
  await sequelize.authenticate();
  console.log('Conexão OK.');

  await sequelize.sync({ alter: true });
  console.log('Tabelas sincronizadas com sucesso.');
} catch (err) {
  console.error('Erro:', err.message);
} finally {
  await sequelize.close();
}
