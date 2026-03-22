import nodemailer from "nodemailer";

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

/**
 * Send a family invitation email to an unregistered user
 */
export const sendFamilyInviteEmail = async ({ toEmail, inviterName, inviterEmail, relationship, message }) => {
    try {
        const transporter = createTransporter();

        const signUpUrl = process.env.FRONTEND_URL || "http://localhost:5173";

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #ec4899, #f43f5e); padding: 30px; border-radius: 20px 20px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💕 You're Invited!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Join a Family Health Circle on CareSphere</p>
        </div>
        
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 20px 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi there! 👋
            </p>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                <strong style="color: #0f172a;">${inviterName}</strong> (${inviterEmail}) wants to add you as their 
                <strong style="color: #ec4899;">${relationship || "Family Member"}</strong> on CareSphere.
            </p>
            
            ${message ? `
            <div style="background: #fdf2f8; border-left: 4px solid #ec4899; padding: 15px 20px; border-radius: 0 10px 10px 0; margin: 20px 0;">
                <p style="color: #9d174d; font-style: italic; margin: 0;">"${message}"</p>
            </div>
            ` : ''}
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                CareSphere helps families stay connected and support each other's health journey through medication tracking, reminders, and health insights.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${signUpUrl}/register" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #f43f5e); color: white; text-decoration: none; padding: 15px 40px; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);">
                    Create Your Account
                </a>
            </div>
            
            <p style="color: #94a3b8; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
                Once you register with this email address (${toEmail}), you'll automatically see the pending invitation in your Family tab.
            </p>
        </div>
        
        <div style="text-align: center; padding: 20px;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} CareSphere Digital Health<br>
                Built for Better Health 💙
            </p>
        </div>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: `"CareSphere" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `💕 ${inviterName} invited you to join their Family Health Circle!`,
            html: htmlContent,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Family invite email sent to ${toEmail}`);
        return true;
    } catch (error) {
        console.error("❌ Failed to send family invite email:", error);
        throw error;
    }
};

export default { sendFamilyInviteEmail };
