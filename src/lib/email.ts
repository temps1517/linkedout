import "server-only";

import nodemailer from "nodemailer";

type MailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(input: MailInput) {
  const host = process.env.SMTP_HOST;

  if (!host) {
    console.info("[LinkedOut mail]", {
      to: input.to,
      subject: input.subject,
      preview: input.text.slice(0, 160),
    });
    return;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "LinkedOut <no-reply@example.com>",
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

export function absoluteUrl(path: string) {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
