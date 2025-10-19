const AcessoDados = require("../db/acessodados");
const db = new AcessoDados();
const ReadCommandSql = require("../common/readCommandSql");
const readCommandSql = new ReadCommandSql();

const controllers = () => {
  // Lista todas as promoções
  const listarTodas = async (req) => {
    try {
      const ComandoSql = await readCommandSql.restornaStringSql(
        "listarTodas",
        "promocao"
      );
      const result = await db.Query(ComandoSql);

      return { status: "success", data: result };
    } catch (error) {
      console.log(error);
      return { status: "error", message: "Falha ao obter promoções." };
    }
  };

  // Obter promoção por ID
  const obterPorId = async (req) => {
    try {
      const ComandoSql = await readCommandSql.restornaStringSql(
        "obterPorId",
        "promocao"
      );
      const result = await db.Query(ComandoSql, { idpromocao: req.params.id });

      if (result.length === 0) {
        return { status: "error", message: "Promoção não encontrada." };
      }

      return { status: "success", data: result[0] };
    } catch (error) {
      console.log(error);
      return { status: "error", message: "Falha ao obter promoção." };
    }
  };

  // Salvar promoção (insert ou update)
  const salvarDados = async (req) => {
    try {
      const { idpromocao } = req.body;

      if (idpromocao > 0) {
        // update
        const ComandoSql = await readCommandSql.restornaStringSql(
          "atualizarPromocao",
          "promocao"
        );
        await db.Query(ComandoSql, req.body);

        return {
          status: "success",
          message: "Promoção atualizada com sucesso!",
        };
      } else {
        // insert
        const ComandoSql = await readCommandSql.restornaStringSql(
          "adicionarPromocao",
          "promocao"
        );
        await db.Query(ComandoSql, req.body);

        return {
          status: "success",
          message: "Promoção adicionada com sucesso!",
        };
      }
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: "Falha ao salvar promoção. Tente novamente.",
      };
    }
  };

  // Remover promoção
  const removerPromocao = async (req) => {
    try {
      const { idpromocao } = req.body;

      const ComandoSql = await readCommandSql.restornaStringSql(
        "removerPorId",
        "promocao"
      );
      await db.Query(ComandoSql, { idpromocao });

      return { status: "success", message: "Promoção removida com sucesso." };
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: "Falha ao remover promoção. Tente novamente.",
      };
    }
  };

  return Object.create({
    listarTodas,
    obterPorId,
    salvarDados,
    removerPromocao,
  });
};

module.exports = Object.assign({ controllers });
