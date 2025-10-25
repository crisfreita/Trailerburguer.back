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

  // Notificação PIX (webhook Mercado Pago)
  server.post("/pagamento/notificacao", async (req, res) => {
    try {
      console.log("🔔 Notificação PIX recebida:", req.body);

      if (req.body && req.body.data && req.body.data.id) {
        const paymentId = req.body.data.id;
        await ct.controllers().verificarStatusPix(paymentId);
      }

      res.send(200, { message: "OK" });
    } catch (error) {
      console.log("❌ Erro webhook PIX:", error);
      res.send(500, { message: "Erro interno" });
    }
  });
};
