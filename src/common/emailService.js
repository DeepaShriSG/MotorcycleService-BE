import nodemailer from 'nodemailer'
import dotenv from "dotenv";
dotenv.config();


  var VerifyService = async({name,url,email,code})=>{

    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.USER,
        pass: process.env.APP_PASSWORD
      }
    });

     const mailoptions = {
    from: process.env.USER,
    to: email,
    subject: 'Verification Request',
    html: `
    <p>Dear ${name},</p>
    <p>We have received your request to reset the password. If you really want to reset it kindly click the button below.</p>
    <button style="background-color: black; border: none; padding: 5px;"> 
        <a href="${url}" style="text-decoration: none; color: white;">Reset Passoword</a>
    </button>
    <p>* If the above button does not work kindly click the url. <a href="${url}">${url}</a></p>
    <p>You can use the code to verify your crendentials</p>
    <p>${code}</p>`
   

     }

    await transporter.sendMail(mailoptions, function(error, info) {
    if (error) 
      console.log(error);
     else 
      console.log('Email sent: ' + info.response);
      console.log("Email sent Successfully")

  });

  }

  export default  {VerifyService}