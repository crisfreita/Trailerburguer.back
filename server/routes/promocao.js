const ct = require("../controllers/promocao");
const UsuarioAcessoToken = require("../common/protecaoAcesso");
const Acesso = new UsuarioAcessoToken();

module.exports = (server) => {
  // listar todas as promoções
  server.get("/promocao", async (req, res) => {
    const result = await ct.controllers().listarTodas(req);
    res.send(result);
  });

  // obter promoção por ID
  server.get("/promocao/:id", async (req, res) => {
    const result = await ct.controllers().obterPorId(req);
    res.send(result);
  });

  // adicionar ou atualizar promoção
  server.post("/promocao", Acesso.verificaTokenAcesso, async (req, res) => {
    const result = await ct.controllers().salvarDados(req);
    res.send(result);
  });

  // remover promoção
  server.post(
    "/promocao/remover",
    Acesso.verificaTokenAcesso,
    async (req, res) => {
      const result = await ct.controllers().removerPromocao(req);
      res.send(result);
    }
  );
};
