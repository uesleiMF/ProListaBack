const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "donaldzee.ng@gmail.com",
//     pass: "*#?paciNONO453asdf..com*#?DZ",
//   },
//   tls: { rejectUnauthorized: false },
// });

const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  port: 587,
  auth: {
    user: "nodecourse@outlook.com",
    pass: "#Pacino453asdf#Outlook",
  },
});

// const transporter = nodemailer.createTransport({
//   host: "smtp-relay.sendinblue.com",
//   port: 587,
//   auth: {
//     user: "donaldzee.ng@gmail.com",
//     pass: "yQD4hd6wFJIUcaKR",
//   },
// });

const message = `
      <h1>Hello Zino</h1>
      <p>This is an enquiry about the application for developer.</p>
      <p>Please feel free to let us know when you are available for an interview</p>
      <p>Regards...</p>
    `;

const options = {
  from: "nodecourse@outlook.com",
  // from: "donaldzee.ng@gmail.com",
  to: "zinotrust@gmail.com",
  subject: "Application Enquires for ZinoTrust",
  // text: "Hello Zino, This is an enquiry about the application for developer. Please feel free to let us know when you are available for an interview",
  html: message,
};

// Send email
transporter.sendMail(options, function (err, info) {
  if (err) {
    console.log(err);
  } else {
    console.log(info);
  }
});
