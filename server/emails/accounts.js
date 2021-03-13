const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: process.env.EMAIL,
        subject: 'Thanks for joining in!',
        text: `${name}, thank you so much for signing up to my new Checkers App. 
        I hope you enjoy the app. Please let me know how you get along with the application. If you discover any problems or bugs please notify me as soon as possible. 
        
        Thank you and have an amazing day,
        
        Almog Gutin`,
    });
};

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: process.env.EMAIL,
        subject: 'We are sorry to see you go!',
        text: `${name}, I am so sorry to see your go. 
        Please reply back and tell use if there is anything we could have done. Anyway thank you for being apart of the community, and we hope to see you again one day. 
        
        Thank you and have an amazing day,
        
        Almog Gutin`,
    });
};

module.exports = { sendWelcomeEmail, sendCancelationEmail };
