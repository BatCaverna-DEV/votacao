import Usuario from './Usuario.js';
import Pessoa from './Pessoa.js';
import Eleicao from './Eleicao.js';
import Candidato from './Candidato.js';
import Eleitor from './Eleitor.js';
import Urna from './Urna.js';
import Voto from './Voto.js';

// Usuario 1:N Pessoa
Usuario.hasMany(Pessoa, { foreignKey: 'usuarios_id', as: 'pessoas' });
Pessoa.belongsTo(Usuario, { foreignKey: 'usuarios_id', as: 'usuario' });

// Eleicao 1:N Candidato
Eleicao.hasMany(Candidato, { foreignKey: 'eleicoes_id', as: 'candidatos' });
Candidato.belongsTo(Eleicao, { foreignKey: 'eleicoes_id', as: 'eleicao' });

// Eleicao 1:N Eleitor
Eleicao.hasMany(Eleitor, { foreignKey: 'eleicoes_id', as: 'eleitores' });
Eleitor.belongsTo(Eleicao, { foreignKey: 'eleicoes_id', as: 'eleicao' });

// Pessoa 1:N Eleitor
Pessoa.hasMany(Eleitor, { foreignKey: 'pessoas_id', as: 'participacoes' });
Eleitor.belongsTo(Pessoa, { foreignKey: 'pessoas_id', as: 'pessoa' });

// Eleicao 1:N Urna
Eleicao.hasMany(Urna, { foreignKey: 'eleicoes_id', as: 'urnas' });
Urna.belongsTo(Eleicao, { foreignKey: 'eleicoes_id', as: 'eleicao' });

// Candidato 1:N Voto
Candidato.hasMany(Voto, { foreignKey: 'candidatos_id', as: 'votos' });
Voto.belongsTo(Candidato, { foreignKey: 'candidatos_id', as: 'candidato' });

// Urna 1:N Voto
Urna.hasMany(Voto, { foreignKey: 'urnas_id', as: 'votos' });
Voto.belongsTo(Urna, { foreignKey: 'urnas_id', as: 'urna' });

export { Usuario, Pessoa, Eleicao, Candidato, Eleitor, Urna, Voto };
