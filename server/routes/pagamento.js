const ct = require("../controllers/pagamento");
const UsuarioAcessoToken = require("../common/protecaoAcesso");
const Acesso = new UsuarioAcessoToken();

module.exports = (server) => {
  // obtem a Public Key da empresa
  server.get("/pagamento/publickey", async (req, res) => {
    const result = await ct.controllers().obterPublicKey(req);
    res.send(result);
  });

  // Envia os dados de pagamento
  server.post("/pagamento", async (req, res) => {
    const result = await ct.controllers().pagar(req);
    res.send(result);
  });
};
