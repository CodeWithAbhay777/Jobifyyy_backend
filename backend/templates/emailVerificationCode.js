

export const sendVerificationEmail = (email, verificationCode) => {
    const mailOptions = {
        to: email,
        subject: 'Email Verification Code for JOBIFY',
        text: `Your verification code is: ${verificationCode}. This code will expire in 2 minutes.`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Email Verification</h2>
                <p style="font-size: 16px; color: #666;">Your verification code is:</p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 24px; font-weight: bold; letter-spacing: 6px; color: #333;">${verificationCode}</span>
                </div>
                <p style="color: #666; font-size: 14px;">This code will expire in 2 minutes.</p>
                <p style="color: #999; font-size: 12px; margin-top: 20px;">If you didn't request this code, please ignore this email.</p>
            </div>
        `
    };

    return mailOptions;

    
};