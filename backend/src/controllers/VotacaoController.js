import { Pessoa, Eleitor, Candidato, Urna } from '../models/index.js';
import { success, notFound } from '../helpers/response.js';

export const minhasEleicoes = async (req, res) => {
  try {
    const pessoa = await Pessoa.findOne({ where: { usuarios_id: req.usuario.id } });
    if (!pessoa) return notFound(res, 'Perfil de pessoa não encontrado para este usuário');

    const eleitores = await Eleitor.findAll({
      where: { pessoas_id: pessoa.id, status: 1 },
      include: [{
        association: 'eleicao',
        include: [
          { association: 'candidatos' },
          {
            association: 'urnas',
            where: { status: 1 },
            required: false,
          },
        ],
      }],
    });

    return success(res, eleitores);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
