--INIT#obterPorProdutoId#

SELECT
	o.idopcional
    , oi.idopcionalitem
    , o.nome AS titulo
    , o.tiposimples
    , o.minimo
    , o.maximo
    , oi.nome AS nomeopcional
    , oi.valor AS valoropcional
    , oi.ativo as ativo
FROM
	produtoopcional AS po
    JOIN opcional AS o ON o.idopcional = po.idopcional
		AND o.apagado = 0
	RIGHT JOIN opcionalitem AS oi ON oi.idopcional = po.idopcional
		AND oi.apagado = 0
WHERE
	po.idproduto = @idproduto

--END#obterPorProdutoId#


--INIT#removerOpcionalItem#

UPDATE opcionalitem
SET apagado = 1
WHERE idopcionalitem = @idopcionalitem

--END#removerOpcionalItem#


--INIT#obterProdutoOpcionalPorOpcional#

SELECT
	*
FROM
	produtoopcional AS po
    JOIN opcional AS op ON op.idopcional = po.idopcional
	    AND op.apagado = 0
        AND op.tiposimples = 1
WHERE
	po.idproduto = @idproduto

--END#obterProdutoOpcionalPorOpcional#


--INIT#adicionarNovoOpcional#

INSERT INTO opcional
(nome, tiposimples, minimo, maximo)
VALUES
(@nome, @tiposimples, @minimo, @maximo)

--END#adicionarNovoOpcional#

  

--INIT#adicionarOpcionalItem#
INSERT INTO opcionalitem
(idopcional, nome, valor, ativo, apagado)
VALUES
(@idopcional, @nome, @valor, 1, 0)
--END#adicionarOpcionalItem#


 


--INIT#adicionarOpcionalProduto#

INSERT INTO produtoopcional
(idproduto, idopcional)
VALUES
(@idproduto, @idopcional)

--END#adicionarOpcionalProduto#

-- INIT#salvarOpcionalItemCheck#
UPDATE opcionalitem
SET ativo = @ativar
WHERE idopcionalitem = @idopcionalitem;
-- END#salvarOpcionalItemCheck#

--INIT#atualizarOpcionalItem#

UPDATE opcionalitem
SET nome = @nome,
    valor = @valor
WHERE idopcionalitem = @idopcionalitem

--END#atualizarOpcionalItem#


--INIT#atualizarOpcionalGrupo#

UPDATE opcional
SET nome = @nome,
    minimo = @minimo,
    maximo = @maximo
WHERE idopcional = @idopcional

--END#atualizarOpcionalGrupo#