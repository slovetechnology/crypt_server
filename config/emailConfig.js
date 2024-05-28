"use strict";
const nodemailer = require("nodemailer");

const sendMail = ({from: emailForm, to:emailTo, subject: subject, html: html, text:text}) => {
    
const transporter = nodemailer.createTransport({
    host: "mail.secureinvest.org",
    port: 465,
    secure: true,
    auth: {
      user: "support@secureinvest.org",
      pass: "secureinvest.org",
    },
  });
  

  async function main() {

    const info = await transporter.sendMail({
      from: emailForm,
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