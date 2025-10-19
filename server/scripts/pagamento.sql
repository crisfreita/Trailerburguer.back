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