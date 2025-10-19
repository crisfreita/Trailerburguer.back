const AcessoDados = require("../db/acessodados");
const db = new AcessoDados();
const ReadCommandSql = require("../common/readCommandSql");
const readCommandSql = new ReadCommandSql();
const fetch = require("node-fetch");

// CHAVE API KEY - Geoapify
const key = "AIzaSyBeTRx3rkQBASQoAVO009XrFElbBlPbw_M";

const controllers = () => {
  const calcularTaxaDelivery = async (req) => {
    try {
      // Obtem a latitude e longitude do endereço da empresa
      var ComandoSql = await readCommandSql.restornaStringSql(
        "obterDadosCompletos",
        "empresa"
      );
      var empresa = await db.Query(ComandoSql);

      const enderecoEmpresa = `${empresa[0].endereco}, ${empresa[0].numero}, ${empresa[0].bairro}, ${empresa[0].cidade}-${empresa[0].estado}, ${empresa[0].cep}`;
      const urlEncodeEmpresa = encodeURI(enderecoEmpresa);

      // Usa a Geocoding API do Google Maps para obter lat e long da empresa
      const urlEmpresa = `https://maps.googleapis.com/maps/api/geocode/json?address=${urlEncodeEmpresa}&key=${key}`;
      const responseEmpresa = await fetch(urlEmpresa);
      const responseJsonEmpresa = await responseEmpresa.json();

      console.log("responseJsonEmpresa", responseJsonEmpresa);

      const empresaLocation = responseJsonEmpresa.results[0].geometry.location;

      // Obtem a latitude e longitude do endereço do cliente
      const endereco = req.body.endereco;
      const urlEncode = encodeURI(endereco);

      const urlCliente = `https://maps.googleapis.com/maps/api/geocode/json?address=${urlEncode}&key=${key}`;
      const responseCliente = await fetch(urlCliente);
      const responseJsonCliente = await responseCliente.json();

      console.log("responseJson - cliente", responseJsonCliente);

      const clienteLocation = responseJsonCliente.results[0].geometry.location;

      // Calcula a distância entre a empresa e o cliente usando a Directions API
      const distancia = await calcularDistancia(
        clienteLocation.lat,
        clienteLocation.lng,
        empresaLocation.lat,
        empresaLocation.lng
      );

      if (distancia.status == "error") {
        return distancia;
      }

      const distanciaKm =
        distancia.data.rows[0].elements[0].distance.value / 1000;

      console.log("distanciaKm", distanciaKm);

      // Obtem a taxa de entrega baseada na distância calculada
      var ComandoSqlTaxa = await readCommandSql.restornaStringSql(
        "obterValorTaxaPorKm",
        "entrega"
      );
      var taxas = await db.Query(ComandoSqlTaxa, { distancia: distanciaKm });

      if (taxas.length > 0) {
        return {
          status: "success",
          taxa: taxas[0].valor,
          idtaxa: taxas[0].idtaxaentrega,
        };
      } else {
        return {
          status: "success",
          taxa: 0,
          idtaxa: null,
        };
      }
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: "Falha ao obter dados do produto.",
      };
    }
  };

  // Função para calcular a distância entre a empresa e o cliente usando a Google Maps Directions API
  const calcularDistancia = async (lat, lon, latLoja, lonLoja) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${latLoja},${lonLoja}&destinations=${lat},${lon}&mode=driving&key=${key}`;
      const response = await fetch(url);
      const responseJson = await response.json();

      return {
        status: "success",
        data: responseJson,
      };
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message:
          "Falha ao obter localização. Por favor, selecione outro endereço ou altere o atual.",
        ex: error,
      };
    }
  };

  // obtem a rota (lat, long) e calcula a taxa do delivery por km
  // const calcularTaxaDelivery = async (req) => {

  //    try {

  // primeiro: obtem a lat e long do endereco da empresa
  //         var ComandoSql = await readCommandSql.restornaStringSql('obterDadosCompletos', 'empresa');
  //         var empresa = await db.Query(ComandoSql);

  //         const enderecoEmpresa = `${empresa[0].endereco}, ${empresa[0].numero}, ${empresa[0].bairro}, ${empresa[0].cidade}-${empresa[0].estado}, ${empresa[0].cep}`
  //         const urlEncodeEmpresa = encodeURI(enderecoEmpresa);

  //         const urlEmpresa = `https://api.geoapify.com/v1/geocode/search?text=${urlEncodeEmpresa}&apiKey=${key}`;
  //         const responseEmpresa = await fetch(urlEmpresa);
  //         const responseJsonEmpresa = await responseEmpresa.json();

  //         console.log('responseJsonEmpresa', responseJsonEmpresa);

  // segundo: obtem a lat e long do endereco do cliente
  //         const endereco = req.body.endereco;
  //        const urlEncode = encodeURI(endereco);

  //        const url = `https://api.geoapify.com/v1/geocode/search?text=${urlEncode}&apiKey=${key}`;
  //        const response = await fetch(url);
  //        const responseJson = await response.json();

  //        console.log('responseJson - cliente', responseJson);

  // Agora calcula a distancia entre a empresa e o cliente
  //         const distancia = await calcularDistancia(
  //             responseJson.features[0].properties.lat,
  //             responseJson.features[0].properties.lon,
  //             responseJsonEmpresa.features[0].properties.lat,
  //             responseJsonEmpresa.features[0].properties.lon
  //         )

  //        if (distancia.status == 'error') {
  //            return distancia;
  //        }

  // calcula a distancia em KM (a distancia vem em metros da api geoapify)
  //        const distanciaKm = (distancia.data.features[0].properties.distance) / 1000;

  //         console.log('distanciaKm', distanciaKm);

  // obtem qual taxa é mais adequada para essa distancia
  //        var ComandoSqlTaxa = await readCommandSql.restornaStringSql('obterValorTaxaPorKm', 'entrega');
  //        var taxas = await db.Query(ComandoSqlTaxa, { distancia: distanciaKm });

  //        if (taxas.length > 0) {
  //            return {
  //               status: 'success',
  //               taxa: taxas[0].valor,
  //               idtaxa: taxas[0].idtaxaentrega
  //           }
  //       }
  //       else {
  //           return {
  //               status: 'success',
  //               taxa: 0,
  //               idtaxa: null
  //           }
  //       }

  //   } catch (error) {
  //      console.log(error);
  //      return {
  //          status: 'error',
  //          message: 'Falha ao obter dados do produto.'
  //      }
  //   }

  //}

  // obtem a distancia entre a loja e o endereço
  //const calcularDistancia = async (lat, lon, latLoja, lonLoja) => {

  //    try {

  //        const url = `https://api.geoapify.com/v1/routing?waypoints=${latLoja},${lonLoja}|${lat},${lon}&mode=drive&apiKey=${key}`;
  //        const response = await fetch(url);
  //        const responseJson = await response.json();

  //        return {
  //           status: 'success',
  //           data: responseJson
  //       }

  //   } catch (error) {
  //       console.log(error);
  //       return {
  //           status: 'error',
  //           message: 'Falha ao obter localização. Por favor, selecione outro endereço ou altere o atual.',
  //          ex: error
  //      }
  // }

  // }

  const salvarPedido = async (req) => {
    try {
      var pedido = req.body;

      var idtipoentrega = pedido.entrega ? 1 : 2;
      var total = 0;

      // calcula o total do carrinho
      if (pedido.cart.length > 0) {
        pedido.cart.forEach((e) => {
          let subTotal = 0;

          if (e.opcionais.length > 0) {
            for (let index = 0; index < e.opcionais.length; index++) {
              let element = e.opcionais[index];
              subTotal += element.valoropcional * e.quantidade;
            }
          }

          subTotal += e.quantidade * e.valor;
          total += subTotal;
        });

        if (pedido.taxaentrega > 0) {
          total += pedido.taxaentrega;
        }
      }

      const dados = {
        idpedidostatus: 1,
        idtipoentrega: idtipoentrega,
        idtaxaentrega: pedido.idtaxaentrega || null,
        idformapagamento: pedido.idformapagamento,
        troco: pedido.idformapagamento == 2 ? pedido.troco : null,
        total: total,
        cep: pedido.entrega ? pedido.endereco.cep : null,
        endereco: pedido.entrega ? pedido.endereco.endereco : null,
        numero: pedido.entrega ? pedido.endereco.numero : null,
        bairro: pedido.entrega ? pedido.endereco.bairro : null,
        complemento: pedido.entrega ? pedido.endereco.complemento : null,
        cidade: pedido.entrega ? pedido.endereco.cidade : null,
        estado: pedido.entrega ? pedido.endereco.estado : null,
        nomecliente: pedido.nomecliente,
        telefonecliente: pedido.telefonecliente,
      };

      // salva o pedido
      var ComandoSqlAddPedido = await readCommandSql.restornaStringSql(
        "salvarPedido",
        "pedido"
      );
      var novoPedido = await db.Query(ComandoSqlAddPedido, dados);

      // se tudo estiver ok, salva as outras informações
      if (novoPedido.insertId != undefined && novoPedido.insertId > 0) {
        var ComandoSqlAddPedidoItem = await readCommandSql.restornaStringSql(
          "salvarPedidoItem",
          "pedido"
        );

        var ComandoSqlAddPedidoItemOpcional =
          await readCommandSql.restornaStringSql(
            "salvarPedidoItemOpcional",
            "pedido"
          );

        // salva os produtos e opcionais em sequência
        for (const element of pedido.cart) {
          const novoPedidoItem = await db.Query(ComandoSqlAddPedidoItem, {
            idpedido: novoPedido.insertId,
            idproduto: element.idproduto,
            quantidade: element.quantidade,
            observacao:
              element.observacao.length > 0 ? element.observacao : null,
          });

          if (novoPedidoItem.insertId && element.opcionais.length > 0) {
            for (const e of element.opcionais) {
              await db.Query(ComandoSqlAddPedidoItemOpcional, {
                idpedidoitem: novoPedidoItem.insertId,
                idopcionalitem: e.idopcionalitem,
              });
            }
          }
        }

        var hash = new Date().getTime() + "" + novoPedido.insertId;

        return {
          status: "success",
          message: "Pedido realizado!",
          order: {
            idpedido: novoPedido.insertId, // <-- ESSENCIAL
            hash: hash, // <-- Mantém compatível com obterPedidoPorId()
          },
        };
      }

      return {
        status: "error",
        message: "Falha ao realizar o pedido. Tente novamente.",
      };
    } catch (error) {
      console.log("❌ ERRO AO SALVAR PEDIDO:", error);
      return {
        status: "error",
        message: "Falha ao realizar o pedido. Tente novamente.",
      };
    }
  };

  const calcularTotalPedido = async (pedido) => {
    var total = 0;

    if (pedido.cart.length > 0) {
      pedido.cart.forEach((e, i) => {
        let subTotal = 0;

        if (e.opcionais.length > 0) {
          for (let index = 0; index < e.opcionais.length; index++) {
            let element = e.opcionais[index];
            subTotal += element.valoropcional * e.quantidade;
          }
        }

        subTotal += e.quantidade * e.valor;
        total += subTotal;
      });

      // valida se tem taxa
      if (pedido.taxaentrega > 0) {
        total += pedido.taxaentrega;
      }
    }

    console.log("TOTAL", total);
    return total;
  };

  const obterPedidoPorId = async (req) => {
    try {
      var hash = req.params.idpedido;
      var idpedido = 0;

      // Se for hash (timestamp + id), extrai o ID
      if (hash.length >= 13 && !isNaN(hash.substr(13))) {
        idpedido = hash.toString().substr(13, hash.length);
      } else {
        // Se for só o ID, usa direto
        idpedido = hash;
      }

      var ComandoSql = await readCommandSql.restornaStringSql(
        "obterPedidoPorId",
        "pedido"
      );
      var pedido = await db.Query(ComandoSql, { idpedido: idpedido });

      if (pedido.length === 0) {
        return {
          status: "error",
          message: "Pedido não encontrado.",
        };
      }

      // busca os itens do carrinho
      var ComandoSqlItens = await readCommandSql.restornaStringSql(
        "obterItensPedido",
        "pedido"
      );
      var itens = await db.Query(ComandoSqlItens, { idpedido: idpedido });

      // junta tudo no mesmo formato que o front espera
      return {
        status: "success",
        data: pedido[0],
        cart: itens,
      };
    } catch (error) {
      console.log("❌ ERRO AO OBTER PEDIDO:", error);
      return {
        status: "error",
        message: "Falha ao obter o pedido. Tente novamente.",
      };
    }
  };

  const obterPedidoPorStatus = async (req) => {
    try {
      var idpedidostatus = req.params.idpedidostatus;

      var result = [];

      // se for os Concluidos, retorna somente os 20 últimos pedidos
      if (idpedidostatus == 5) {
        var ComandoSql = await readCommandSql.restornaStringSql(
          "obterPedidosConcluidos",
          "pedido"
        );
        result = await db.Query(ComandoSql);
      } else {
        var ComandoSql = await readCommandSql.restornaStringSql(
          "obterPedidoPorStatus",
          "pedido"
        );
        result = await db.Query(ComandoSql, { idpedidostatus: idpedidostatus });
      }

      // além disso, já obtem os totaus de cada TAB e mando no retorno
      var ComandoSqlTotais = await readCommandSql.restornaStringSql(
        "obterTotaisPedidos",
        "pedido"
      );
      var totais = await db.Query(ComandoSqlTotais);

      return {
        status: "success",
        data: result,
        totais: totais[0],
      };
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: "Falha ao obter os pedidos. Tente novamente.",
      };
    }
  };

  const atualizarStatusPedido = async (req) => {
    try {
      if (req.body.tab == 5) {
        // finalizar o pedido

        var ComandoSql = await readCommandSql.restornaStringSql(
          "atualizarStatusPedidoFinalizado",
          "pedido"
        );
        await db.Query(ComandoSql, {
          idpedidostatus: req.body.tab,
          idpedido: req.body.idpedido,
        });
      } else {
        var ComandoSql = await readCommandSql.restornaStringSql(
          "atualizarStatusPedido",
          "pedido"
        );
        await db.Query(ComandoSql, {
          idpedidostatus: req.body.tab,
          idpedido: req.body.idpedido,
        });
      }

      return {
        status: "success",
        message: "Pedido atualizado com sucesso!",
      };
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: "Falha ao atualizar o pedido. Tente novamente.",
      };
    }
  };

  const recusarPedido = async (req) => {
    try {
      var ComandoSql = await readCommandSql.restornaStringSql(
        "recusarPedido",
        "pedido"
      );
      await db.Query(ComandoSql, {
        idpedido: req.body.idpedido,
        motivo: req.body.motivo,
      });

      return {
        status: "success",
        message: "Pedido recusado.",
      };
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: "Falha ao recusar o pedido. Tente novamente.",
      };
    }
  };

  const historicoPedidos = async (req) => {
    try {
      let datainicio = `${req.body.datainicio} 00:00:00`;
      let datafim = `${req.body.datafim} 23:59:59`;

      var ComandoSql = await readCommandSql.restornaStringSql(
        "historicoPedidos",
        "pedido"
      );
      var result = await db.Query(ComandoSql, {
        datainicio: datainicio,
        datafim: datafim,
      });

      return {
        status: "success",
        data: result,
      };
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        message: "Falha ao obter o histórico dos pedidos. Tente novamente.",
      };
    }
  };

  return Object.create({
    calcularTaxaDelivery,
    salvarPedido,
    obterPedidoPorId,
    obterPedidoPorStatus,
    atualizarStatusPedido,
    recusarPedido,
    historicoPedidos,
    calcularTotalPedido,
  });
};

module.exports = Object.assign({ controllers });
