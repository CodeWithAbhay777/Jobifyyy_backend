import nodemailer from 'nodemailer';

const mailer = nodemailer.createTransport({
    service:'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            ...(html && { html }) // Only include html if provided
        };

        const result = await mailer.sendMail(mailOptions);
        // console.log('Email sent successfully:', result.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

