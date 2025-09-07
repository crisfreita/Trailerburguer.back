const ct = require("../controllers/cupom").controllers;
const UsuarioAcessoToken = require("../common/protecaoAcesso");
const Acesso = new UsuarioAcessoToken();

module.exports = (server) => {
  server.get("/cupomdesconto/percentual", async (req, res) => {
    const result = await ct().obterCupomPercentual(req);
    res.send(result);
  });

  server.post(
    "/cupomdesconto/percentual",
    Acesso.verificaTokenAcesso,
    async (req, res) => {
      const result = await ct().salvarCupomDescontoPercentual(req);
      res.send(result);
    }
  );

  server.post(
    "/cupomdesconto/valor",
    Acesso.verificaTokenAcesso,
    async (req, res) => {
      const result = await ct().salvarCupomDesconto(req);
      res.send(result);
    }
  );

  server.get("/cupomdesconto/valor", async (req, res) => {
    const result = await ct().obterCupomValor(req);
    res.send(result);
  });

  server.get("/cupomdisponiveis", async (req, res) => {
    const result = await ct().listarCuponsDisponiveis(req);
    res.send(result);
  });

  server.get("/cupom/:codigo", async (req, res) => {
    const result = await ct().buscarCupomPorCodigo(req);
    res.send(result);
  });

  server.get(
    "/cupomdesconto/todos",
    Acesso.verificaTokenAcesso,
    async (req, res) => {
      const result = await ct().listarTodosCupons(req);
      res.send(result);
    }
  );

  // remover cupom de valor
  server.post(
    "/cupomdesconto/remover",
    Acesso.verificaTokenAcesso,
    async (req, res) => {
      const result = await ct().removerCupomDesconto(req);
      res.send(result);
    }
  );
};
