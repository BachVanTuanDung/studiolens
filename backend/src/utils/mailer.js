import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export const sendEmail = async ({ to, subject, html }) => {
  if (!to) {
    throw new Error('Thiếu email người nhận')
  }

  await transporter.sendMail({
    from: `"${process.env.STUDIO_NAME || 'StudioLens'}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  })
}