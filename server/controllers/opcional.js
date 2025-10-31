const AcessoDados = require("../db/acessodados");
const db = new AcessoDados();
const ReadCommandSql = require("../common/readCommandSql");
const readCommandSql = new ReadCommandSql();

const controllers = () => {
  const obterOpcionaisProduto = async (req) => {
    try {
      const idproduto = req.params.idproduto;

      const ComandoSql = await readCommandSql.restornaStringSql(
        "obterPorProdutoId",
        "opcional"
      );
      const result = await db.Query(ComandoSql, { idproduto });

      return { status: "success", data: result };
    } catch (error) {
      console.log(error);
      return { status: "error", message: "Falha ao obter os opcionais." };
    }
  };

  const removerOpcionalItem = async (req) => {
    try {
      const ComandoSql = await readCommandSql.restornaStringSql(
        "removerOpcionalItem",
        "opcional"
      );
      await db.Query(ComandoSql, req.body);

      return { status: "success", message: "Opcional removido com sucesso." };
    } catch (error) {
      console.log(error);
      return { status: "error", message: "Falha ao remover o opcional." };
    }
  };

  const salvarOpcionaisProduto = async (req) => {
    try {
      // 🧩 Se for opcional simples
      if (req.body.simples) {
        const ComandoSqlSelect = await readCommandSql.restornaStringSql(
          "obterProdutoOpcionalPorOpcional",
          "opcional"
        );
        const result = await db.Query(ComandoSqlSelect, {
          idproduto: req.body.idproduto,
        });

        // 🧠 Edição simples
        if (req.body.idopcionalitem) {
          const ComandoUpdate = await readCommandSql.restornaStringSql(
            "atualizarOpcionalItem",
            "opcional"
          );
          req.body.ordem = 1; // mantém padrão
          await db.Query(ComandoUpdate, req.body);
          return {
            status: "success",
            message: "Opcional atualizado com sucesso.",
          };
        }

        // Criar novo opcional simples
        if (!result || result.length === 0) {
          const ComandoSqlAddOpcional = await readCommandSql.restornaStringSql(
            "adicionarNovoOpcional",
            "opcional"
          );
          const novoOpcional = await db.Query(ComandoSqlAddOpcional, {
            nome: "Opcionais",
            tiposimples: 1,
            minimo: 0,
            maximo: 0,
          });

          if (novoOpcional.insertId) {
            req.body.idopcional = novoOpcional.insertId;
            req.body.ordem = 1;

            const ComandoSqlAddItem = await readCommandSql.restornaStringSql(
              "adicionarOpcionalItem",
              "opcional"
            );
            await db.Query(ComandoSqlAddItem, req.body);

            const ComandoSqlAddProduto = await readCommandSql.restornaStringSql(
              "adicionarOpcionalProduto",
              "opcional"
            );
            await db.Query(ComandoSqlAddProduto, {
              idproduto: req.body.idproduto,
              idopcional: novoOpcional.insertId,
            });

            return {
              status: "success",
              message: "Opcional adicionado com sucesso.",
            };
          } else {
            return { status: "error", message: "Falha ao adicionar opcional." };
          }
        } else {
          // já existe o grupo simples, adiciona novo item
          req.body.idopcional = result[0].idopcional;
          req.body.ordem = 1;

          const ComandoSqlAddItem = await readCommandSql.restornaStringSql(
            "adicionarOpcionalItem",
            "opcional"
          );
          await db.Query(ComandoSqlAddItem, req.body);

          return {
            status: "success",
            message: "Opcional adicionado com sucesso.",
          };
        }
      }

      // 🧩 SELEÇÃO DE OPÇÕES (com ordem garantida)
      else {
        if (req.body.idopcional && req.body.edicao === true) {
          const ComandoUpdateGrupo = await readCommandSql.restornaStringSql(
            "atualizarOpcionalGrupo",
            "opcional"
          );
          await db.Query(ComandoUpdateGrupo, {
            idopcional: req.body.idopcional,
            nome: req.body.titulo,
            minimo: req.body.minimoOpcao,
            maximo: req.body.maximoOpcao,
          });

          const ComandoUpdateItem = await readCommandSql.restornaStringSql(
            "atualizarOpcionalItem",
            "opcional"
          );
          const ComandoInsertItem = await readCommandSql.restornaStringSql(
            "adicionarOpcionalItem",
            "opcional"
          );

          for (let i = 0; i < req.body.lista.length; i++) {
            const item = req.body.lista[i];
            item.idopcional = req.body.idopcional;
            item.ordem = i + 1;

            if (item.idopcionalitem && parseInt(item.idopcionalitem) > 0)
              await db.Query(ComandoUpdateItem, item);
            else await db.Query(ComandoInsertItem, item);
          }

          return {
            status: "success",
            message: "Seção atualizada com sucesso.",
          };
        }

        // Novo grupo de seleção
        const ComandoSqlAddOpcional = await readCommandSql.restornaStringSql(
          "adicionarNovoOpcional",
          "opcional"
        );
        const novoOpcional = await db.Query(ComandoSqlAddOpcional, {
          nome: req.body.titulo,
          tiposimples: 0,
          minimo: req.body.minimoOpcao,
          maximo: req.body.maximoOpcao,
        });

        if (novoOpcional.insertId) {
          const ComandoSqlAddProduto = await readCommandSql.restornaStringSql(
            "adicionarOpcionalProduto",
            "opcional"
          );
          await db.Query(ComandoSqlAddProduto, {
            idproduto: req.body.idproduto,
            idopcional: novoOpcional.insertId,
          });

          const ComandoSqlAddItem = await readCommandSql.restornaStringSql(
            "adicionarOpcionalItem",
            "opcional"
          );

          // 🔄 Inserção SEQUENCIAL (ordem garantida)
          for (let i = 0; i < req.body.lista.length; i++) {
            const item = req.body.lista[i];
            item.idopcional = novoOpcional.insertId;
            item.ordem = i + 1;
            await db.Query(ComandoSqlAddItem, item);
          }

          return {
            status: "success",
            message: "Opcionais adicionados com sucesso.",
          };
        } else {
          return { status: "error", message: "Falha ao adicionar opcionais." };
        }
      }
    } catch (error) {
      console.log("❌ Erro ao salvar opcional:", error);
      return { status: "error", message: "Falha ao salvar opcional." };
    }
  };

  const salvarOpcionalItemCheck = async (req) => {
    try {
      const { idopcionalitem, ativar } = req.body;
      if (!idopcionalitem) return { status: "error", message: "ID inválido." };

      const ComandoSql =
        "UPDATE opcionalitem SET ativo = @ativar WHERE idopcionalitem = @idopcionalitem";
      await db.Query(ComandoSql, { idopcionalitem, ativar: ativar ? 1 : 0 });

      return {
        status: "success",
        message: ativar
          ? "Item ativado com sucesso."
          : "Item desativado com sucesso.",
      };
    } catch (error) {
      console.log("Erro ao alterar item opcional:", error);
      return {
        status: "error",
        message: "Falha ao atualizar o estado do item opcional.",
      };
    }
  };

  return Object.create({
    obterOpcionaisProduto,
    removerOpcionalItem,
    salvarOpcionaisProduto,
    salvarOpcionalItemCheck,
  });
};

module.exports = Object.assign({ controllers });
