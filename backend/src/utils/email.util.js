import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export const sendVerificationEmail = async (to, name, code) => {
  await transporter.sendMail({
    from: `"StudioLens" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Mã xác thực tài khoản StudioLens',
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px;">
          <h2 style="margin: 0 0 8px; color: #111827;">Xin chào ${name || 'bạn'},</h2>
          <p style="margin: 0 0 16px;">Cảm ơn bạn đã đăng ký tài khoản tại <b>StudioLens</b>.</p>
          <p style="margin: 0 0 12px;">Mã xác thực email của bạn là:</p>
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #C9A84C; margin: 16px 0;">
            ${code}
          </div>
          <p style="margin: 0 0 12px;">Mã có hiệu lực trong <b>10 phút</b>.</p>
          <p style="margin: 0; color: #6b7280;">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>
        </div>
      </div>
    `,
  })
}

export const sendTemporaryPasswordEmail = async (to, name, tempPassword) => {
  await transporter.sendMail({
    from: `"StudioLens" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Mật khẩu tạm thời mới - StudioLens',
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px;">
          <h2 style="margin: 0 0 8px;">Xin chào ${name || 'bạn'},</h2>
          <p style="margin: 0 0 16px;">Hệ thống đã tạo cho bạn một mật khẩu tạm thời mới.</p>
          <p style="margin: 0 0 12px;">Mật khẩu tạm thời:</p>
          <div style="font-size: 24px; font-weight: 700; color: #C9A84C; margin: 16px 0;">
            ${tempPassword}
          </div>
          <p style="margin: 0 0 12px;">
            Vui lòng đăng nhập bằng mật khẩu này và đổi mật khẩu ngay sau khi vào hệ thống.
          </p>
          <p style="margin: 0; color: #6b7280;">Nếu bạn không yêu cầu khôi phục mật khẩu, hãy liên hệ admin.</p>
        </div>
      </div>
    `,
  })
}