import nodemailer from "nodemailer";
import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";
import AppConfig from "@/models/AppConfig";
import { withPublicProtection } from "@/lib/auth";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Store";

async function handler(req) {
    try {
        const body = await req.json();
        const { name, email, subject, message } = body || {};

        if (!name || !email || !message) {
            return Response.json(
                { success: false, message: "Name, email and message are required" },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return Response.json(
                { success: false, message: "Please provide a valid email address" },
                { status: 400 }
            );
        }

        if (message.length > 5000 || name.length > 200) {
            return Response.json(
                { success: false, message: "Input too long" },
                { status: 400 }
            );
        }

        await connectDB();
        const settings = await Settings.getSettings();

        if (!settings?.mail?.isEnabled) {
            return Response.json(
                { success: false, message: "Contact form is not configured. Please email us directly." },
                { status: 503 }
            );
        }

        // Find destination: prefer configured email helpContact, else fall back to SMTP user
        const config = await AppConfig.findOne().lean();
        const contactEntry = (config?.helpContacts || []).find(
            c => c.type === "email" && c.isEnabled
        );
        const recipient = contactEntry?.value || settings.mail.email;

        const transporter = nodemailer.createTransport({
            host: settings.mail.host,
            port: settings.mail.port,
            secure: settings.mail.isSSL,
            auth: { user: settings.mail.email, pass: settings.mail.password },
        });

        const safeSubject = subject ? String(subject).slice(0, 200) : "New contact form message";

        await transporter.sendMail({
            from: `"${siteName} Contact" <${settings.mail.email}>`,
            to: recipient,
            replyTo: email,
            subject: `[${siteName}] ${safeSubject}`,
            text: `From: ${name} <${email}>\n\nSubject: ${safeSubject}\n\n${message}`,
            html: `
                <div style="font-family: Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2A2F25;">
                    <h2 style="margin: 0 0 16px;">New message from ${siteName}</h2>
                    <p style="margin: 0 0 8px;"><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
                    <p style="margin: 0 0 8px;"><strong>Subject:</strong> ${escapeHtml(safeSubject)}</p>
                    <hr style="border: none; border-top: 1px solid #ECE8E0; margin: 16px 0;" />
                    <p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</p>
                </div>
            `,
        });

        return Response.json({ success: true, message: "Message sent successfully" });
    } catch (error) {
        console.error("Contact form error:", error);
        return Response.json(
            { success: false, message: "Failed to send message. Please try again later." },
            { status: 500 }
        );
    }
}

function escapeHtml(str = "") {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export const POST = withPublicProtection(handler);
