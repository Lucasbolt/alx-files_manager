const brevo = require('@getbrevo/brevo');
require('dotenv').config()

export async function sendEmail(data) {
    let defaultClient = brevo.ApiClient.instance;
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVOAPI;
    console.log(process.env.BREVOAPI);
    let apiInstance = new brevo.TransactionalEmailsApi();
    let sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject = data.subject
    sendSmtpEmail.htmlContent = data.htmlContent
    sendSmtpEmail.sender = data.sender
    sendSmtpEmail.to = data.to;

    apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data) {
    console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    }, function (error) {
    console.error(error);
    });

}