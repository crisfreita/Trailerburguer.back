const AcessoDados = require('../db/acessodados');
const db = new AcessoDados();

const ReadCommandSql = require('../common/readCommandSql');
const readCommandSql = new ReadCommandSql();

const UsuarioAcessoToken = require('../common/protecaoAcesso');
const Acesso = new UsuarioAcessoToken();

const controllers = () => {

  const obterCupomPercentual = async (req) => {
    try {
        const sql = await readCommandSql.restornaStringSql('obterCupomPercentual', 'cupom');
        const result = await db.Query(sql);
        return { status: 'success', data: result };
    } catch (error) {
        console.log(error);
        return { status: 'error', message: 'Erro ao obter cupom percentual.' };
    }
};

const salvarCupomDescontoPercentual = async (req) => {
  try {
    const { idcupom, valor, valor_minimo, validade } = req.body;

    if (!valor || !validade) {
      return { status: 'error', message: 'Dados obrigatórios ausentes.' };
    }

    if (idcupom > 0) {
      const verificar = await db.Query(
        await readCommandSql.restornaStringSql('obterCupomPorId', 'cupom'),
        { idcupom }
      );

      if (verificar.length > 0) {
        const remover = await readCommandSql.restornaStringSql('desativarCupomPorId', 'cupom');
        await db.Query(remover, { idcupom });
      }
    }

    const insert = await readCommandSql.restornaStringSql('salvarCupom', 'cupom');
    
    if (!insert) {
      throw new Error('Comando salvarCupom não encontrado no SQL.');
    }

    console.log('SQL que será executado:', insert); // debug

    await db.Query(insert, {
      tipo: 'percentual',
      valor,
      codigo: 'PERCENTUAL_' + Math.floor(Math.random() * 10000),
      valor_minimo: valor_minimo || 0,
      validade
    });

    return { status: 'success', message: 'Cupom percentual salvo com sucesso!' };

  } catch (error) {
    console.log('Erro salvarCupomDescontoPercentual:', error);
    return { status: 'error', message: 'Erro ao salvar cupom percentual.' };
  }
};


const salvarCupomDesconto = async (req) => {
    try {
        const { valor, codigo, valor_minimo, validade } = req.body;

        if (!valor || !codigo || !validade) {
            return { status: 'error', message: 'Dados obrigatórios ausentes.' };
        }

        const insert = await readCommandSql.restornaStringSql('salvarCupom', 'cupom');
        await db.Query(insert, {
            tipo: 'valor',
            valor: valor,
            codigo: codigo,
            valor_minimo: valor_minimo || 0,
            validade: validade
        });

        return { status: 'success', message: 'Cupom de valor salvo com sucesso!' };

    } catch (error) {
        console.log(error);
        return { status: 'error', message: 'Erro ao salvar cupom de valor.' };
    }
};

const obterCupomValor = async (req) => {
  try {
    const sql = `
      SELECT * 
      FROM cupomdesconto 
      WHERE tipo = 'valor' AND (apagado = 0 OR apagado IS NULL) 
      ORDER BY validade DESC 
      LIMIT 1
    `;
    const result = await db.Query(sql);
    return { status: 'success', data: result };
  } catch (error) {
    console.log(error);
    return { status: 'error', message: 'Erro ao obter cupom valor.' };
  }
};



const obterCupomPorCodigo = async (req) => {
  try {
    const { codigo } = req.params;

    const result = await db.Query(
      `SELECT * FROM cupomdesconto WHERE codigo = @codigo AND ativo = 1 AND validade >= CURDATE() LIMIT 1`,
      { codigo }
    );

    if (result.length === 0) {
      return { status: 'error', message: 'Cupom inválido, expirado ou inativo.' };
    }

    return { status: 'success', data: result[0] };
  } catch (error) {
    console.log(error);
    return { status: 'error', message: 'Erro ao buscar cupom.' };
  }
};


const listarCuponsDisponiveis = async (req) => {
  try {
    const sql = `
      SELECT codigo, tipo, valor, valor_minimo, validade
      FROM cupomdesconto
      WHERE apagado = 0
        AND validade >= CURDATE()
      ORDER BY validade ASC
    `;
    const result = await db.Query(sql);
    return { status: 'success', data: result };
  } catch (error) {
    console.log(error);
    return { status: 'error', message: 'Erro ao listar cupons.' };
  }
};




const buscarCupomPorCodigo = async (req) => {
  try {
    const { codigo } = req.params;

    const result = await db.Query(
      `SELECT * FROM cupomdesconto 
       WHERE codigo = @codigo 
         AND ativo = 1 
         AND validade >= CURDATE() 
         AND (apagado = 0 OR apagado IS NULL)
       LIMIT 1`,
      { codigo }
    );

    if (result.length === 0) {
      return { status: 'error', message: 'Cupom inválido, expirado, inativo ou removido.' };
    }

    return { status: 'success', data: result[0] };
  } catch (error) {
    console.log('Erro buscarCupomPorCodigo:', error);
    return { status: 'error', message: 'Erro ao buscar cupom por código.' };
  }
};


const listarTodosCupons = async (req) => {
  try {
    const sql = await readCommandSql.restornaStringSql('listarTodosCupons', 'cupom');
    const result = await db.Query(sql);
    return { status: 'success', data: result };
  } catch (error) {
    console.log(error);
    return { status: 'error', message: 'Erro ao listar todos os cupons.' };
  }
};

const removerCupomDesconto = async (req) => {
  try {
    const { idcupom } = req.body;

    if (!idcupom) {
      return { status: 'error', message: 'ID do cupom não informado.' };
    }

    const sql = await readCommandSql.restornaStringSql('removerCupomValor', 'cupom');
    const result = await db.Query(sql, { idcupom });

    if (result.rowsAffected === 0) {
      return { status: 'error', message: 'Nenhum cupom encontrado para remover.' };
    }

    return { status: 'success', message: 'Cupom removido com sucesso.' };
  } catch (error) {
    console.log(error);
    return { status: 'error', message: 'Erro ao remover cupom.' };
  }
};



  return Object.create({
    obterCupomPercentual
    , salvarCupomDescontoPercentual
    , salvarCupomDesconto
    , obterCupomValor
    , obterCupomPorCodigo
    , listarCuponsDisponiveis
    , buscarCupomPorCodigo
    , listarTodosCupons
    , removerCupomDesconto
  });

};

module.exports = Object.assign({ controllers });
