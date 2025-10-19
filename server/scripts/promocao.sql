--INIT#listarTodas#

SELECT
    p.idpromocao
    , p.titulo
    , p.descricao
    , p.tipo
    , p.quantidade_minima
    , p.valor_desconto
    , p.categoria_id
    , c.nome AS categoria_nome
FROM
    promocoes p
LEFT JOIN
    categoria c ON c.idcategoria = p.categoria_id
ORDER BY
    p.idpromocao DESC

--END#listarTodas#


--INIT#adicionarPromocao#

INSERT INTO promocoes
(titulo, descricao, tipo, quantidade_minima, valor_desconto, categoria_id)
VALUES
(@titulo, @descricao, @tipo, @quantidade_minima, @valor_desconto, @categoria_id)

--END#adicionarPromocao#


--INIT#atualizarPromocao#

UPDATE
    promocoes
SET
    titulo = @titulo,
    descricao = @descricao,
    tipo = @tipo,
    quantidade_minima = @quantidade_minima,
    valor_desconto = @valor_desconto,
    categoria_id = @categoria_id
WHERE
    idpromocao = @idpromocao

--END#atualizarPromocao#


--INIT#obterPorId#

SELECT
    p.idpromocao
    , p.titulo
    , p.descricao
    , p.tipo
    , p.quantidade_minima
    , p.valor_desconto
    , p.categoria_id
    , c.nome AS categoria_nome
FROM
    promocoes p
LEFT JOIN
    categoria c ON c.idcategoria = p.categoria_id
WHERE
    p.idpromocao = @idpromocao

--END#obterPorId#


--INIT#removerPorId#

DELETE FROM promocoes
WHERE idpromocao = @idpromocao

--END#removerPorId#
