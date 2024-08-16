"use strict";
const nodemailer = require("nodemailer");
require('dotenv').config()

const sendMail = ({ to: emailTo, subject: subject, html: html, text: text }) => {

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_SECURE,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });


  async function main() {

    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: emailTo,
      subject: subject,
      text: text,
      html: html,
    });

    console.log("Message sent: %s", info.messageId);
  }

  main().catch(console.error);

}

module.exports = sendMail