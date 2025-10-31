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
      const conteudo = fs.readFileSync(caminhoArquivo, "utf8");

      const regex = new RegExp(
        `--INIT#${chave}#[\\s\\S]*?--END#${chave}#`,
        "m"
      );
      const resultado = conteudo.match(regex);

      if (!resultado) {
        console.error(`⚠️ SQL "${chave}" não encontrado em ${controller}.sql`);
        return "";
      }

      const sqlLimpo = resultado[0]
        .replace(`--INIT#${chave}#`, "")
        .replace(`--END#${chave}#`, "")
        .trim();

      return sqlLimpo;
    } catch (error) {
      console.error(`❌ Erro ao ler SQL (${chave}):`, error);
      return "";
    }
  }
};
