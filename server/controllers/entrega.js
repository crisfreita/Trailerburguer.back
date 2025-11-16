const AcessoDados = require("../db/acessodados");
const db = new AcessoDados();
const ReadCommandSql = require("../common/readCommandSql");
const readCommandSql = new ReadCommandSql();
const UsuarioAcessoToken = require("../common/protecaoAcesso");
const Acesso = new UsuarioAcessoToken();

const controllers = () => {
  const obterTiposEntrega = async (req) => {
    try {
      var ComandoSql = await readCommandSql.restornaStringSql(
        "obterTiposEntrega",
        "entrega"
      );
      var result = await db.Query(ComandoSql);

      return {
        status: "success",
        data: result,
      };
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: "Falha ao obter os tipos de entrega.",
      };
    }
  };

  const ativarTipoEntrega = async (req) => {
    try {
      let idtipoentrega = req.body.tipo;
      let ativo = req.body.ativar;

      var ComandoSql = await readCommandSql.restornaStringSql(
        "ativarTipoEntrega",
        "entrega"
      );
      var result = await db.Query(ComandoSql, {
        idtipoentrega: idtipoentrega,
        ativo: ativo,
      });

      return {
        status: "success",
        message: "Opção atualizada.",
      };
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: "Falha ao atualizar opção.",
      };
    }
  };

  const salvarTempoTipoEntrega = async (req) => {
    try {
      var ComandoSql = await readCommandSql.restornaStringSql(
        "salvarTempoTipoEntrega",
        "entrega"
      );
      var result = await db.Query(ComandoSql, req.body);

      return {
        status: "success",
        message: "Tempo atualizado.",
      };
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: "Falha ao atualizar o tempo.",
      };
    }
  };

  const obterTaxaEntregaAtiva = async (req) => {
    try {
      var ComandoSql = await readCommandSql.restornaStringSql(
        "obterTaxaEntregaAtiva",
        "entrega"
      );
      var result = await db.Query(ComandoSql);

      return {
        status: "success",
        data: result,
      };
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: "Falha ao obter a taxa de entrega.",
      };
    }
  };

  // ===========================================================
  // ✅ SALVAR LIMITE KM
  // ===========================================================
  const salvarLimiteKm = async (req) => {
    try {
      const { limite_km } = req.body;
      const idempresa = req.user.ide;

      if (!limite_km || limite_km <= 0) {
        return { status: "error", message: "Informe um limite válido." };
      }

      var ComandoSql = await readCommandSql.restornaStringSql(
        "salvarLimiteKm",
        "entrega"
      );
      await db.Query(ComandoSql, { idempresa, limite_km });

      return { status: "success", message: "Limite salvo com sucesso." };
    } catch (error) {
      console.log(error);
      return { status: "error", message: "Erro ao salvar limite." };
    }
  };

  // ===========================================================
  // ✅ OBTER LIMITE KM
  // ===========================================================
  const obterLimiteKm = async (req) => {
    try {
      const idempresa = req.user.ide;

      var ComandoSql = await readCommandSql.restornaStringSql(
        "obterLimiteKm",
        "entrega"
      );
      var result = await db.Query(ComandoSql, { idempresa });

      return {
        status: "success",
        limite_km: result.length ? result[0].limite_km : null,
      };
    } catch (error) {
      console.log(error);
      return { status: "error", message: "Erro ao obter limite." };
    }
  };

  // ===========================================================
  // ✅ REMOVER LIMITE KM
  // ===========================================================
  const removerLimiteKm = async (req) => {
    try {
      const idempresa = req.user.ide;

      var ComandoSql = await readCommandSql.restornaStringSql(
        "removerLimiteKm",
        "entrega"
      );
      await db.Query(ComandoSql, { idempresa });

      return { status: "success", message: "Limite removido." };
    } catch (error) {
      console.log(error);
      return { status: "error", message: "Erro ao remover limite." };
    }
  };

  return Object.create({
    obterTiposEntrega,
    ativarTipoEntrega,
    salvarTempoTipoEntrega,
    obterTaxaEntregaAtiva,
    salvarLimiteKm,
    obterLimiteKm,
    removerLimiteKm,
  });
};

module.exports = Object.assign({ controllers });
