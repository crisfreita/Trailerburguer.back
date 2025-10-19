const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // ou outro SMTP, ex: smtp.kinghost.net
  port: 587,
  secure: false, // true se porta 465
  auth: {
    user: "cr.soares208@gmail.com", // e-mail da pizzaria
    pass: "sttn sxwe wtln rcpz", // senha de app ou senha do painel
  },
});

async function enviarEmail({ to, subject, html, attachments = [] }) {
  const info = await transporter.sendMail({
    from: '"Pizzaria Maluca" <cr.soares208@gmail.com>', // nome da pizzaria
    to,
    subject,
    html,
    attachments,
  });
  return info;
}

module.exports = { enviarEmail };
