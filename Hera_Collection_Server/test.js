import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
      host: "live.smtp.mailtrap.io",
      port: 587,
      secure: false,
      auth: {
        user: "smtp@mailtrap.io",
        pass: "fb3824e815bde1e54397504ba95b7724",
      },
      tls: {
        rejectUnauthorized: false
      }
    });

// const transport = Nodemailer.createTransport(
//   MailtrapTransport({
//     token: TOKEN,
//   })
// );

const sender = {
  address: "admin@heracollections.com",
  name: "Mailtrap Test",
};
const recipients = [
  "jamradi80@gmail.com",
];

transport
  .sendMail({
    from: sender,
    to: recipients,
    subject: "You are awesome!",
    text: "Congrats for sending test email with Mailtrap!",
    category: "Integration Test",
  })
  .then(console.log, console.error);