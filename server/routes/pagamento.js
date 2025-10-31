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

  // ===============================
  // ✅ Consultar status PIX manualmente
  // ===============================
  server.get("/pagamento/status/:id", async (req, res) => {
    try {
      const paymentId = req.params.id;
      if (!paymentId) {
        return res.send(400, { message: "ID do pagamento não informado" });
      }

      const result = await ct.controllers().verificarStatusPix(paymentId);

      if (!result) {
        return res.send(404, { message: "Pagamento não encontrado" });
      }

      res.send(200, { payment_status: result.status });
    } catch (error) {
      console.log("❌ Erro ao verificar status PIX:", error);
      res.send(500, { message: "Erro interno ao verificar pagamento" });
    }
  });

  // ===============================
  // ❌ Cancelar pagamento PIX (expirado)
  // ===============================
  server.post("/pagamento/cancelar/:id", async (req, res) => {
    try {
      const paymentId = req.params.id;
      if (!paymentId) {
        return res.send(400, { message: "ID do pagamento não informado" });
      }

      const result = await ct.controllers().cancelarPix(paymentId);

      res.send(200, { message: "Pagamento PIX cancelado com sucesso", result });
    } catch (error) {
      console.log("❌ Erro ao cancelar pagamento PIX:", error);
      res.send(500, { message: "Erro interno ao cancelar pagamento" });
    }
  });
};
