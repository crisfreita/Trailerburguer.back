--INIT#obterPublicKey#

SELECT
	publickey
FROM
	mercadopagoconfig
WHERE
    idempresa = 1

--END#obterPublicKey#

--INIT#obterAccessToken#

SELECT
	accesstoken
FROM
	mercadopagoconfig
WHERE
    idempresa = 1

--END#obterAccessToken#

--INIT#salvarCartao#

INSERT INTO cartoes_cliente 
(telefonecliente, bandeira, ultimos_digitos, idcartao_mp)
VALUES (@telefonecliente, @bandeira, @ultimos_digitos, @idcartao_mp);

--END#salvarCartao#

--INIT#obterCartoes#

SELECT 
  idcartao, bandeira, ultimos_digitos, idcartao_mp
FROM cartoes_cliente
WHERE telefonecliente = @telefonecliente
ORDER BY idcartao DESC;


--END#obterCartoes#

--INIT#removerCartao#

DELETE FROM cartoes_cliente
WHERE idcartao = @idcartao;

--END#removerCartao#
