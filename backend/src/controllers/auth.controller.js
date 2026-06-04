import User from '../models/User.js'
import { generateToken } from '../utils/generateToken.js'
import {
  generateVerificationCode,
  generateTempPassword,
} from '../utils/auth.util.js'
import {
  sendVerificationEmail,
  sendTemporaryPasswordEmail,
} from '../utils/email.util.js'
import { createNotification } from '../utils/createNotification.js'

export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin',
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
      })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng',
      })
    }

    const verificationCode = generateVerificationCode()

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
    })

    await sendVerificationEmail(user.email, user.name, verificationCode)

    return res.status(201).json({
      success: true,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực.',
      email: user.email,
    })
  } catch (error) {
    console.error('Register error:', error)
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mã xác thực',
      })
    }

    const user = await User.findOne({ email }).select(
      '+emailVerificationCode +emailVerificationExpires'
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản',
      })
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được xác thực trước đó',
      })
    }

    if (!user.emailVerificationCode || user.emailVerificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: 'Mã xác thực không đúng',
      })
    }

    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Mã xác thực đã hết hạn',
      })
    }

    user.isEmailVerified = true
    user.emailVerificationCode = ''
    user.emailVerificationExpires = null
    await user.save()

    await createNotification({
      userId: user._id,
      title: 'Email đã được xác thực',
      message: 'Tài khoản của bạn đã được xác thực email thành công.',
      type: 'email_verified',
      category: 'account',
      priority: 'normal',
      senderRole: 'system',
      link: '/profile',
      meta: {
        email: user.email,
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Xác thực email thành công. Bạn có thể đăng nhập ngay bây giờ.',
    })
  } catch (error) {
    console.error('Verify email error:', error)
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email',
      })
    }

    const user = await User.findOne({ email }).select(
      '+emailVerificationCode +emailVerificationExpires'
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản',
      })
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được xác thực',
      })
    }

    const verificationCode = generateVerificationCode()
    user.emailVerificationCode = verificationCode
    user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()

    await sendVerificationEmail(user.email, user.name, verificationCode)

    return res.status(200).json({
      success: true,
      message: 'Đã gửi lại mã xác thực',
    })
  } catch (error) {
    console.error('Resend verification code error:', error)
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu',
      })
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng',
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa, liên hệ admin',
      })
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản chưa xác thực email',
        needsEmailVerification: true,
        email: user.email,
      })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng',
      })
    }

    const token = generateToken(user._id, user.role)

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      mustChangePassword: user.mustChangePassword,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
        darkMode: user.darkMode,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email',
      })
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống',
      })
    }

    const tempPassword = generateTempPassword(10)
    user.password = tempPassword
    user.mustChangePassword = true
    await user.save()

    await sendTemporaryPasswordEmail(user.email, user.name, tempPassword)

    await createNotification({
      userId: user._id,
      title: 'Đã gửi mật khẩu tạm thời',
      message: 'Hệ thống đã gửi mật khẩu tạm thời về email của bạn. Vui lòng đăng nhập và đổi lại mật khẩu mới.',
      type: 'temporary_password_sent',
      category: 'account',
      priority: 'high',
      senderRole: 'system',
      link: '/change-password',
      meta: {
        email: user.email,
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Mật khẩu tạm thời đã được gửi về email',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')

    return res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    console.error('GetMe error:', error)
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar, address, darkMode } = req.body

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, avatar, address, darkMode },
      { new: true, runValidators: true }
    ).select('-password')

    await createNotification({
      userId: user._id,
      title: 'Hồ sơ đã được cập nhật',
      message: 'Thông tin cá nhân của bạn đã được cập nhật thành công.',
      type: 'profile_updated',
      category: 'account',
      priority: 'low',
      senderRole: 'user',
      link: '/profile',
      meta: {
        name: user.name,
        email: user.email,
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thành công',
      user,
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới',
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
      })
    }

    const user = await User.findById(req.user._id).select('+password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      })
    }

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng',
      })
    }

    user.password = newPassword
    user.mustChangePassword = false
    await user.save()

    await createNotification({
      userId: user._id,
      title: 'Đổi mật khẩu thành công',
      message: 'Bạn đã đổi mật khẩu tài khoản thành công.',
      type: 'password_changed',
      category: 'account',
      priority: 'high',
      senderRole: 'user',
      link: '/profile',
      meta: {
        changedAt: new Date(),
      },
    })

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công',
    })
  } catch (error) {
    console.error('Change password error:', error)
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}