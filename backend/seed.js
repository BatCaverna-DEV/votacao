import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import sequelize from './src/config/database.js';
import './src/models/index.js';
import { Usuario, Pessoa, Eleicao, Candidato, Urna, Eleitor } from './src/models/index.js';

await sequelize.authenticate();

const senhaHash = await bcrypt.hash('123456', 10);

// --- Usuário administrador ---
const admin = { id: uuidv4(), username: 'admin', password: senhaHash, categoria: 1 };

// --- Usuários eleitores (14) ---
const nomes = [
  'Ana Lima',        'Carlos Souza',    'Fernanda Costa',  'Rafael Oliveira',
  'Juliana Martins', 'Bruno Pereira',   'Camila Alves',    'Diego Ferreira',
  'Larissa Rocha',   'Thiago Mendes',   'Mariana Gomes',   'Felipe Cardoso',
  'Patrícia Lopes',  'Rodrigo Nunes',
];

const cursos = [
  'Engenharia de Software', 'Sistemas de Informação', 'Ciência da Computação',
  'Análise e Desenvolvimento de Sistemas', 'Tecnologia em Redes',
];

const eleitoresUsuarios = nomes.map((nome, i) => ({
  id: uuidv4(),
  username: nome.toLowerCase().replace(/\s+/g, '.').normalize('NFD').replace(/[̀-ͯ]/g, ''),
  password: senhaHash,
  categoria: 2,
  _nome: nome,
  _matricula: `2024${String(1001 + i).padStart(5, '0')}`,
  _curso: cursos[i % cursos.length],
  _email: `${nome.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')}${1001 + i}@faculdade.edu.br`,
}));

// --- Pessoa do admin ---
const pessoaAdmin = {
  id: uuidv4(),
  nome: 'Administrador Geral',
  matricula: 'ADM001',
  email: 'admin@faculdade.edu.br',
  curso: null,
  usuarios_id: admin.id,
};

// --- Pessoas dos eleitores ---
const pessoasEleitores = eleitoresUsuarios.map(u => ({
  id: uuidv4(),
  nome: u._nome,
  matricula: u._matricula,
  email: u._email,
  curso: u._curso,
  usuarios_id: u.id,
}));

// --- Eleição ---
const eleicaoId = uuidv4();
const eleicao = {
  id: eleicaoId,
  descricao: 'Eleição do Diretório Acadêmico 2024',
  status: 1,
  inicio: new Date('2024-05-01'),
  fim: new Date('2024-05-31'),
};

// --- Candidatos (3 reais + Nulo + Branco) ---
const candidatos = [
  { id: uuidv4(), numero: 10, descricao: 'Chapa Renovação',  eleicoes_id: eleicaoId },
  { id: uuidv4(), numero: 20, descricao: 'Chapa Progresso',  eleicoes_id: eleicaoId },
  { id: uuidv4(), numero: 30, descricao: 'Chapa Unidade',    eleicoes_id: eleicaoId },
  { id: uuidv4(), numero: 95, descricao: 'Voto Nulo',        eleicoes_id: eleicaoId },
  { id: uuidv4(), numero: 99, descricao: 'Voto em Branco',   eleicoes_id: eleicaoId },
];

// --- Urnas ---
const urnas = [
  { id: uuidv4(), descricao: 'Urna 01 – Bloco A', status: 1, eleicoes_id: eleicaoId },
  { id: uuidv4(), descricao: 'Urna 02 – Bloco B', status: 1, eleicoes_id: eleicaoId },
  { id: uuidv4(), descricao: 'Urna 03 – Online',  status: 1, eleicoes_id: eleicaoId },
];

// --- Inserção ---
await Usuario.bulkCreate([admin], { ignoreDuplicates: true });
await Usuario.bulkCreate(
  eleitoresUsuarios.map(({ _nome, _matricula, _curso, _email, ...u }) => u),
  { ignoreDuplicates: true }
);

await Pessoa.bulkCreate([pessoaAdmin], { ignoreDuplicates: true });
await Pessoa.bulkCreate(pessoasEleitores, { ignoreDuplicates: true });

await Eleicao.bulkCreate([eleicao], { ignoreDuplicates: true });
await Candidato.bulkCreate(candidatos, { ignoreDuplicates: true });
await Urna.bulkCreate(urnas, { ignoreDuplicates: true });

// --- Eleitores (14 pessoas inscritas na eleição) ---
const eleitores = pessoasEleitores.map(p => ({
  id: uuidv4(),
  status: 0,
  pessoas_id: p.id,
  eleicoes_id: eleicaoId,
}));
await Eleitor.bulkCreate(eleitores, { ignoreDuplicates: true });

await sequelize.close();

console.log('✔  Seed concluído!');
console.log('   Admin          : admin (senha: 123456)');
console.log('   Eleitores      : 14 usuários (senha: 123456)');
console.log('   Eleição        : Eleição do Diretório Acadêmico 2024');
console.log('   Candidatos     : Chapa Renovação (10), Chapa Progresso (20), Chapa Unidade (30), Voto Nulo (95), Voto em Branco (99)');
console.log('   Urnas          : Urna 01 – Bloco A / Urna 02 – Bloco B / Urna 03 – Online');
