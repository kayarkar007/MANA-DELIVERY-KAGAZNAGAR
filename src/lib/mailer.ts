import nodemailer from "nodemailer";

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        // You will need to add these to your .env file
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER || "localu.delivery@gmail.com",
                pass: process.env.EMAIL_PASS || "your-app-password",
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER || "localu.delivery@gmail.com",
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};
