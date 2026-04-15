const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE,
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// async..await is not allowed in global scope, must use a wrapper
async function mail(options) {
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: process.env.SMTP_USER, // sender address
    to: options.email, // list of receivers
    subject: options.subject, // Subject line
    html: options.body, // html body
  });

  console.log("Message sent: %s", info.messageId);
}
module.exports = mail;
