import crypto from 'node:crypto'

export const generateVerificationCode = () => {
  return String(crypto.randomInt(100000, 1000000))
}

export const generateTempPassword = (length = 10) => {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#'
  const bytes = crypto.randomBytes(length)
  let password = ''

  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length]
  }

  return password
}