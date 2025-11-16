const AcessoDados = require("../db/acessodados");
const db = new AcessoDados();
const ReadCommandSql = require("../common/readCommandSql");
const readCommandSql = new ReadCommandSql();
const { MercadoPagoConfig, Payment } = require("mercadopago");
const { enviarEmail } = require("../common/email");
const crypto = require("crypto");

const ctPedido = require("../controllers/pedido");
const ctEmpresa = require("../controllers/empresa");

const controllers = () => {
  const obterPublicKey = async (req) => {
    try {
      const ComandoSql = await readCommandSql.restornaStringSql(
        "obterPublicKey",
        "pagamento"
      );
      const result = await db.Query(ComandoSql);

      return { status: "success", data: result };
    } catch (error) {
      console.log(error);
      return { status: "error", message: "Falha ao obter a publickey." };
    }
  };

  const pagar = async (req) => {
    try {
      // 🔹 Obtém Access Token do banco
      const ComandoSqlAccessToken = await readCommandSql.restornaStringSql(
        "obterAccessToken",
        "pagamento"
      );
      const result = await db.Query(ComandoSqlAccessToken);

      if (result.length === 0)
        return { status: "error", message: "Access Token não encontrado." };

      const accessToken = result[0].accesstoken;

      // 🔹 Valida se existe o pedido
      if (!req.body.pedido) {
        console.warn("⚠️ Nenhum pedido recebido no body:", req.body);
        return {
          status: "error",
          message: "Pedido não informado no corpo da requisição.",
        };
      }

      // 🔹 Recalcula total com base no pedido
      const totalCarrinho = await ctPedido
        .controllers()
        .calcularTotalPedido(req.body.pedido);

      req.body.pedido.total = totalCarrinho;
      const dados = req.body;

      // 🔹 Inicializa Mercado Pago
      const client = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(client);
      const idempotencyKey = crypto.randomUUID();

      let retorno = {};

      // ====================================
      // 💰 Define o método de pagamento
      // ====================================
      if (dados.selectedPaymentMethod === "bank_transfer") {
        // 🔸 PIX
        retorno = await pagarComPix(dados, payment, idempotencyKey);
      } else if (dados.selectedPaymentMethod === "credit_card") {
        // 🔸 Cartão de crédito
        // Se o usuário clicou em "usar cartão salvo"
        if (dados.formData?.token) {
          console.log("💳 Pagando com cartão salvo:", dados.formData.token);
        } else {
          console.log("💳 Pagando com novo cartão digitado via Brick");
        }

        retorno = await pagarComCartao(dados, payment, idempotencyKey);
      } else {
        retorno = { status: "error", message: "Método de pagamento inválido." };
      }

      // ====================================
      // 💾 SALVAR CARTÃO SE SOLICITADO
      // ====================================
      if (
        dados.salvarCartao &&
        dados.telefonecliente &&
        dados.formData &&
        dados.selectedPaymentMethod === "credit_card"
      ) {
        try {
          console.log(
            "💾 Salvando cartão para telefone:",
            dados.telefonecliente
          );

          const comandoSalvar = await readCommandSql.restornaStringSql(
            "salvarCartao",
            "pagamento"
          );

          const bandeira = dados.formData.payment_method_id || "desconhecida";
          const ultimos_digitos = dados.formData.card?.last_four_digits || "";
          const idcartao_mp = dados.formData.card?.id || null;

          await db.Query(comandoSalvar, {
            telefonecliente: dados.telefonecliente,
            bandeira,
            ultimos_digitos,
            idcartao_mp,
          });

          console.log("✅ Cartão salvo com sucesso!");
        } catch (err) {
          console.warn("⚠️ Erro ao salvar cartão:", err.message);
        }
      }

      return retorno;
    } catch (error) {
      console.log("❌ Erro pagar:", error);
      return { status: "error", message: "Falha ao realizar o pagamento." };
    }
  };

  // ==============================
  // 💳 PAGAR COM CARTÃO
  // ==============================
  const pagarComCartao = async (dados, payment, idempotencyKey) => {
    try {
      const empresa = await ctEmpresa.controllers().obterDados();
      let retorno = {};
      let paymentOrder = null;

      // ==========================
      // 🔹 Dados do pagador (payer)
      // ==========================
      const payer = dados.formData?.payer || {
        email: dados.pedido?.email || "cliente@exemplo.com",
        identification: {
          type: "CPF",
          number: dados.pedido?.cpfcliente || "00000000000",
        },
      };

      // ==========================
      // 🔹 Corpo do pagamento
      // ==========================
      const body = {
        installments: dados.formData?.installments || 1,
        token: dados.formData?.token || null, // 👈 token do cartão salvo ou novo
        transaction_amount: Number(dados.pedido.total),
        description: `Pagamento online - ${empresa.data[0].nome}`,
        payment_method_id: dados.formData?.payment_method_id || "credit_card",
        issuer_id: dados.formData?.issuer_id || null,
        statement_descriptor: empresa.data[0].nome,
        payer,
      };

      // ==========================
      // 🧩 Logs de debug
      // ==========================
      console.log("💳 [MP] Criando pagamento...");
      console.table({
        token: body.token,
        metodo: body.payment_method_id,
        valor: body.transaction_amount,
        cliente: payer.email,
      });

      // ==========================
      // 🔹 Cria pagamento no Mercado Pago
      // ==========================
      const resultado = await payment.create({
        body,
        requestOptions: { idempotencyKey },
      });

      console.log("✅ Retorno MP (cartão):");
      console.log({
        id: resultado.id,
        status: resultado.status,
        card: resultado.card,
        metodo: resultado.payment_method_id,
      });

      paymentOrder = resultado;

      retorno = {
        status: "success",
        id_mp: resultado.id,
        status_mp: resultado.status,
        message: "Pagamento com cartão criado com sucesso!",
      };

      // ==========================
      // 💾 Salvar cartão (após retorno do MP)
      // ==========================
      if (
        dados.salvarCartao &&
        resultado.card &&
        resultado.card.id &&
        dados.telefonecliente
      ) {
        try {
          const comandoSalvar = await readCommandSql.restornaStringSql(
            "salvarCartao",
            "pagamento"
          );

          const bandeira = resultado.payment_method_id || "desconhecida";
          const ultimos_digitos = resultado.card.last_four_digits || "";
          const idcartao_mp = resultado.card.id;

          // 🔎 Evita duplicar cartão igual
          const verificarSQL = `
          SELECT idcartao FROM cartoes_cliente
          WHERE telefonecliente = @telefonecliente AND idcartao_mp = @idcartao_mp
        `;
          const existe = await db.Query(verificarSQL, {
            telefonecliente: dados.telefonecliente,
            idcartao_mp,
          });

          if (existe.length === 0) {
            await db.Query(comandoSalvar, {
              telefonecliente: dados.telefonecliente,
              bandeira,
              ultimos_digitos,
              idcartao_mp,
            });

            console.log("✅ Cartão salvo no banco:", {
              bandeira,
              ultimos_digitos,
              idcartao_mp,
            });
          } else {
            console.log(
              "ℹ️ Cartão já salvo anteriormente, ignorando duplicação."
            );
          }
        } catch (err) {
          console.warn("⚠️ Erro ao salvar cartão:", err.message);
        }
      }

      // ==========================
      // 💾 Registro de pagamento
      // ==========================
      await salvarPagamento(dados, paymentOrder);

      return retorno;
    } catch (error) {
      console.error("❌ Erro ao pagar com cartão:", error);
      return {
        status: "error",
        message: error.message || "Falha ao realizar pagamento com cartão.",
      };
    }
  };

  // ==============================
  // ⚡ PAGAR COM PIX
  // ==============================
  const pagarComPix = async (dados, payment, idempotencyKey) => {
    try {
      const empresa = await ctEmpresa.controllers().obterDados();
      let retorno = {};
      let paymentOrder = null;

      // garante que o e-mail e cpf são válidos
      const emailValido = dados.formData?.payer?.email || "cliente@dominio.com";
      const nomeValido = dados.formData?.payer?.first_name || "Cliente";
      const sobrenomeValido = dados.formData?.payer?.last_name || "";
      const cpfValido =
        dados.formData?.payer?.identification?.number || "00000000191";

      const body = {
        transaction_amount: Number(dados.pedido.total),
        description: "Pagamento via PIX - " + empresa.data[0].nome,
        payment_method_id: "pix",
        payer: {
          email: emailValido, // ✅ e-mail real
          first_name: nomeValido,
          last_name: sobrenomeValido,
          identification: {
            type: "CPF",
            number: cpfValido, // ✅ CPF real
          },
        },
      };

      const resultado = await payment.create({
        body,
        requestOptions: { idempotencyKey },
      });

      paymentOrder = resultado;

      // 💾 Salva o pagamento
      await salvarPagamento(dados, paymentOrder);

      // 🔁 Retorna dados do QR Code
      retorno = {
        status: "success",
        id_mp: resultado.id,
        status_mp: resultado.status,
        message: "Pagamento PIX criado com sucesso!",
        qr_code_base64:
          resultado.point_of_interaction.transaction_data.qr_code_base64,
        qr_code_text: resultado.point_of_interaction.transaction_data.qr_code,
        ticket_url: resultado.point_of_interaction.transaction_data.ticket_url,
      };

      console.log("✅ PIX criado com sucesso:", resultado.status);
      return retorno;
    } catch (error) {
      console.log("❌ Erro PIX:", error);
      return {
        status: "error",
        message: error.message,
      };
    }
  };

  // 🔹 Consulta de status chamada pelo webhook
  const verificarStatusPix = async (paymentId) => {
    try {
      // 🔹 Busca o Access Token do banco (mesmo método usado em pagar())
      const ComandoSqlAccessToken = await readCommandSql.restornaStringSql(
        "obterAccessToken",
        "pagamento"
      );
      const resultToken = await db.Query(ComandoSqlAccessToken);

      if (resultToken.length === 0) {
        throw new Error("Access Token não encontrado no banco");
      }

      const accessToken = resultToken[0].accesstoken;

      // 🔹 Inicializa o cliente Mercado Pago
      const client = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(client);

      // 🔹 Consulta status do pagamento direto no MP
      const result = await payment.get({ id: paymentId });

      console.log("📩 Status PIX atualizado:", result.status);

      // 🔹 Atualiza status no banco
      await db.Query(
        `UPDATE pagamento 
       SET status = @status, date_last_updated = NOW() 
       WHERE id_mp = @id_mp`,
        {
          status: result.status,
          id_mp: paymentId,
        }
      );

      // 🔹 Atualiza o pedido conforme o status
      if (result.status === "approved") {
        await db.Query(
          `UPDATE pedido
     SET idpedidostatus = 3
     WHERE idpedido = (SELECT idpedido FROM pagamento WHERE id_mp = @id_mp)`,
          { id_mp: paymentId }
        );
        console.log("✅ Pedido atualizado como pago:", paymentId);
      } else if (result.status === "rejected") {
        await db.Query(
          `UPDATE pedido
     SET idpedidostatus = 6
     WHERE idpedido = (SELECT idpedido FROM pagamento WHERE id_mp = @id_mp)`,
          { id_mp: paymentId }
        );
        console.log("❌ Pagamento PIX recusado:", paymentId);
      } else if (result.status === "expired") {
        console.log("⏰ Pagamento PIX expirado:", paymentId);

        // ⚠️ Cancela o PIX automaticamente (Mercado Pago e banco local)
        await cancelarPix(paymentId);
      } else {
        console.log("⏳ Pagamento ainda pendente:", paymentId);
      }

      // 🔹 Retorna o resultado para quem chamou (rota ou webhook)
      return {
        status: result.status,
        status_detail: result.status_detail,
        id: paymentId,
        date_approved: result.date_approved || null,
      };
    } catch (error) {
      console.log("❌ Erro ao verificar status PIX:", error);
      return { status: "error", message: error.message };
    }
  };

  const cancelarPix = async (paymentId) => {
    try {
      // 🔹 Busca o Access Token do banco
      const ComandoSqlAccessToken = await readCommandSql.restornaStringSql(
        "obterAccessToken",
        "pagamento"
      );
      const resultToken = await db.Query(ComandoSqlAccessToken);

      if (resultToken.length === 0) {
        throw new Error("Access Token não encontrado no banco");
      }

      const accessToken = resultToken[0].accesstoken;

      // 🔹 Inicializa o cliente Mercado Pago
      const client = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(client);

      // 🔹 Envia requisição para cancelar o pagamento
      const result = await payment.update({
        id: paymentId,
        body: { status: "cancelled" },
      });

      console.log("🚫 Pagamento PIX cancelado no Mercado Pago:", result.status);

      // 🔹 Atualiza status no banco local
      await db.Query(
        `UPDATE pagamento 
       SET status = @status, date_last_updated = NOW() 
       WHERE id_mp = @id_mp`,
        {
          status: result.status,
          id_mp: paymentId,
        }
      );

      // 🔹 Atualiza o pedido vinculado (opcional, status 7 = cancelado)
      await db.Query(
        `UPDATE pedido
       SET idpedidostatus = 7
       WHERE idpedido = (SELECT idpedido FROM pagamento WHERE id_mp = @id_mp)`,
        { id_mp: paymentId }
      );

      console.log("🛑 Pedido marcado como cancelado:", paymentId);

      return {
        status: result.status,
        id: paymentId,
        message: "Pagamento cancelado com sucesso",
      };
    } catch (error) {
      console.log("❌ Erro ao cancelar PIX:", error);
      return { status: "error", message: error.message };
    }
  };

  // ==============================
  // 💾 SALVAR PAGAMENTO
  // ==============================
  const salvarPagamento = async (dados, paymentOrder) => {
    console.log("paymentOrder", paymentOrder);

    try {
      const pointData =
        paymentOrder?.point_of_interaction?.transaction_data || {};

      const payment_created_order = {
        id_mp: paymentOrder.id || null,
        status: paymentOrder.status || null,
        payment_method_id: paymentOrder.payment_method_id || null,
        transaction_amount: paymentOrder.transaction_amount || 0,
        date_created: paymentOrder.date_created || null,
        date_last_updated: paymentOrder.date_last_updated || null,
        idpedido: dados?.pedido?.idpedido || null,
        qr_code: pointData.qr_code || null,
        ticket_url: pointData.ticket_url || null,
      };

      // 🔎 Verifica se o pagamento já existe
      const pagamentoExistente = await db.Query(
        "SELECT idpagamento FROM pagamento WHERE id_mp = @id_mp",
        { id_mp: payment_created_order.id_mp }
      );

      if (pagamentoExistente.length > 0) {
        await db.Query(
          `UPDATE pagamento 
         SET status = @status, date_last_updated = @date_last_updated 
         WHERE id_mp = @id_mp`,
          {
            status: payment_created_order.status,
            date_last_updated: payment_created_order.date_last_updated,
            id_mp: payment_created_order.id_mp,
          }
        );
      } else {
        await db.Query(
          `INSERT INTO pagamento 
        (id_mp, idpedido, status, payment_method_id, transaction_amount,
         date_created, date_last_updated, qr_code, ticket_url)
        VALUES (@id_mp, @idpedido, @status, @payment_method_id, 
         @transaction_amount, @date_created, @date_last_updated, 
         @qr_code, @ticket_url)`,
          payment_created_order
        );
      }

      // 🔁 Atualiza o pedido com o ID do pagamento
      await db.Query(
        "UPDATE pedido SET id_mp = @id_mp WHERE idpedido = @idpedido",
        {
          id_mp: payment_created_order.id_mp,
          idpedido: payment_created_order.idpedido,
        }
      );

      // ✅ REMOVIDO: salvar cartão antigo usando idcartao_mp
      // ⚠️ Agora SOMENTE salvarCartao() salva cartões, de forma correta.

      // 🟢 Se o pagamento foi aprovado
      if (paymentOrder.status === "approved") {
        await db.Query(
          "UPDATE pedido SET idpedidostatus = 1 WHERE idpedido = @idpedido",
          { idpedido: payment_created_order.idpedido }
        );

        // 🧾 Gera HTML simples do comprovante
        const html = `
        <div style="font-family: Arial; color:#333">
          <h2>Comprovante de pagamento</h2>
          <p><b>Pedido:</b> ${payment_created_order.idpedido}</p>
          <p><b>Cliente:</b> ${dados.pedido.nomecliente}</p>
          <p><b>Valor:</b> R$ ${dados.pedido.total?.toFixed(2) || "0,00"}</p>
          <p><b>Status:</b> Aprovado ✅</p>
          <p><b>Data:</b> ${new Date().toLocaleString("pt-BR")}</p>
          <hr/>
          <p>Obrigado por comprar na <b>Pizzaria Maluca</b> 🍕</p>
        </div>
      `;

        // ✉️ Envia o e-mail do comprovante
        try {
          await enviarEmail({
            to:
              dados.pedido.emailcliente ||
              paymentOrder.payer?.email ||
              "cr.soares208@gmail.com",
            subject: "Comprovante do pedido aprovado!",
            html,
          });

          console.log("📧 E-mail de comprovante enviado com sucesso!");
        } catch (emailErr) {
          console.error("❌ Falha ao enviar e-mail:", emailErr.message);
        }
      }

      return { status: "success", message: "Pagamento salvo com sucesso!" };
    } catch (error) {
      console.log("error salvarPagamento", error);
      return {
        status: "error",
        message: "Erro ao salvar pagamento",
        error: error.message,
      };
    }
  };

  // 🔹 Salvar cartão após pagamento
  const salvarCartao = async (req) => {
    try {
      const { formData, salvarCartao, telefonecliente, pedido } = req.body;

      if (!salvarCartao) return { status: "ignored" };

      if (!telefonecliente)
        return { status: "error", message: "Telefone não informado" };

      const token = formData?.token;
      if (!token) return { status: "error", message: "Token não recebido" };

      const email =
        pedido?.emailcliente || pedido?.email || req.body?.email || null;

      if (!email) return { status: "error", message: "Email não encontrado" };

      // SDK NOVO
      const client = new MercadoPagoConfig({
        accessToken: process.env.ACCESS_TOKEN,
      });
      const customerAPI = new Customer(client);
      const cardAPI = new Card(client);

      // Buscar ou criar customer
      let customer = await customerAPI.search({ email });

      if (customer.results.length === 0) {
        const novo = await customerAPI.create({ email });
        customer = novo.id;
      } else {
        customer = customer.results[0].id;
      }

      // Criar cartão
      const novoCartao = await cardAPI.create({
        token: token,
        customerId: customer, // <<< ESSA É A LINHA CORRETA
      });

      // Validar retorno
      if (!novoCartao?.id)
        return { status: "error", message: "Falha ao salvar cartão no MP" };

      // Salvar no banco
      const comando = await readCommandSql.restornaStringSql(
        "salvarCartao",
        "pagamento"
      );

      await db.Query(comando, {
        telefonecliente,
        bandeira: novoCartao.payment_method.id,
        ultimos_digitos: novoCartao.last_four_digits,
        card_id: novoCartao.id,
        customer_id: customer,
      });

      return { status: "success", message: "Cartão salvo com sucesso!" };
    } catch (err) {
      console.error(err);
      return { status: "error", message: err.message };
    }
  };

  // 🔹 Obter cartões salvos
  const obterCartoes = async (req) => {
    try {
      const telefonecliente = req.query.telefonecliente;

      const comando = await readCommandSql.restornaStringSql(
        "obterCartoes",
        "pagamento"
      );

      const result = await db.Query(comando, { telefonecliente });

      return result;
    } catch (err) {
      console.error("Erro ao obter cartões:", err);
      return { status: "error", message: err.message };
    }
  };

  // 🔹 Remover cartão salvo
  const removerCartao = async (req) => {
    try {
      const { idcartao } = req.params;

      if (!idcartao)
        return { status: "error", message: "ID do cartão não informado." };

      const comando = await readCommandSql.restornaStringSql(
        "removerCartao",
        "pagamento"
      );

      await db.Query(comando, { idcartao });

      return { status: "success", message: "Cartão removido com sucesso!" };
    } catch (err) {
      console.error("Erro ao remover cartão:", err);
      return { status: "error", message: err.message };
    }
  };

  return Object.create({
    obterPublicKey,
    pagar,
    pagarComCartao,
    pagarComPix,
    salvarPagamento,
    verificarStatusPix,
    cancelarPix,
    salvarCartao,
    obterCartoes,
    removerCartao,
  });
};

module.exports = Object.assign({ controllers });
