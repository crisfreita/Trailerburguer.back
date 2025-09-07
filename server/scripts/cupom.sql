--INIT#obterCupomPercentual#
SELECT *
FROM cupomdesconto 
WHERE tipo = 'percentual'
  AND apagado = 0
  AND validade >= CURDATE()
ORDER BY validade DESC
LIMIT 1;
--END#obterCupomPercentual#


--INIT#obterCupomPorId#
SELECT * FROM cupomdesconto 
WHERE idcupom = @idcupom AND (apagado = 0 OR apagado IS NULL);
--END#obterCupomPorId#

--INIT#salvarCupom#
INSERT INTO cupomdesconto (tipo, valor, codigo, valor_minimo, validade)
VALUES (@tipo, @valor, @codigo, @valor_minimo, @validade);
--END#salvarCupom#

--INIT#listarTodosCupons#
SELECT idcupom, tipo, valor, codigo, valor_minimo, validade, apagado
FROM cupomdesconto
WHERE (apagado = 0 OR apagado IS NULL)
ORDER BY validade DESC;
--END#listarTodosCupons#

--INIT#cupomDisponiveis#
SELECT idcupom, tipo, codigo, valor, valor_minimo, validade
FROM cupomdesconto
WHERE (apagado = 0 OR apagado IS NULL)
  AND validade >= CURRENT_DATE()
ORDER BY validade ASC;
--END#cupomDisponiveis#


--INIT#obterCupomValor#
SELECT *
FROM cupomdesconto
WHERE tipo = 'valor' AND (apagado = 0 OR apagado IS NULL)
ORDER BY validade DESC
LIMIT 1;
--END#obterCupomValor#


--INIT#removerCupomValor#
UPDATE cupomdesconto 
SET apagado = 1 
WHERE idcupom = @idcupom;
--END#removerCupomValor#


