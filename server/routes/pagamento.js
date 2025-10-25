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

      // Mercado Pago envia: { "action": "payment.updated", "data": { "id": "1234567890" } }
      if (req.body && req.body.data && req.body.data.id) {
        const paymentId = req.body.data.id;
        await ct.controllers().verificarStatusPix(paymentId);
      }

      return res.status(200).send("OK"); // ✅ resposta correta
    } catch (error) {
      console.log("❌ Erro webhook PIX:", error);
      return res.status(500).send("Erro interno"); // ✅ resposta de erro segura
    }
  });
};
