import 'dotenv/config';
import app from './src/app.js';
import sequelize from './src/config/database.js';

const PORT = process.env.PORT || 3000;

try {
  await sequelize.authenticate();
  console.log('Conexão com o banco de dados estabelecida.');

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} [${process.env.NODE_ENV}]`);
  });
} catch (error) {
  console.error('Não foi possível conectar ao banco de dados:', error);
  process.exit(1);
}
