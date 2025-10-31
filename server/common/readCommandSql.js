const fs = require("fs");
const path = require("path");

module.exports = class ReadCommandSql {
  async restornaStringSql(chave, controller) {
    try {
      const caminhoArquivo = path.join(
        __dirname,
        "..",
        "scripts",
        `${controller}.sql`
      );

      if (!fs.existsSync(caminhoArquivo)) {
        console.error(`❌ Arquivo SQL não encontrado: ${caminhoArquivo}`);
        return null;
      }

      const conteudo = fs.readFileSync(caminhoArquivo, "utf8");

      // Expressão regular robusta: pega tudo entre INIT e END
      const regex = new RegExp(
        `--INIT#${chave}#[\\s\\S]*?--END#${chave}#`,
        "gm"
      );
      const resultado = conteudo.match(regex);

      if (!resultado || resultado.length === 0) {
        console.error(
          `⚠️ Trecho SQL não encontrado: ${chave} em ${controller}.sql`
        );
        return null;
      }

      // Remove marcadores
      const sql = resultado[0]
        .replace(`--INIT#${chave}#`, "")
        .replace(`--END#${chave}#`, "")
        .trim();

      return sql;
    } catch (error) {
      console.error(`❌ Erro ao ler SQL (${chave}):`, error);
      return null;
    }
  }
};
