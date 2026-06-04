import User from '../models/User.js'
import bcrypt from 'bcryptjs'

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// export const updateProfile = async (req, res) => {
//   try {
//     const fields = ['name', 'phone', 'address', 'avatar', 'darkMode']
//     const updateData = {}

//     fields.forEach((field) => {
//       if (req.body[field] !== undefined) updateData[field] = req.body[field]
//     })

//     const user = await User.findByIdAndUpdate(req.user._id, updateData, {
//       new: true,
//     }).select('-password')

//     res.json({ success: true, data: user, message: 'Cập nhật hồ sơ thành công' })
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message })
//   }
// }
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar, address, darkMode } = req.body

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, avatar, address, darkMode },
      { new: true, runValidators: true }
    ).select('-password')

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

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' })
    }
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateUserByAdmin = async (req, res) => {
  try {
    const fields = ['name', 'email', 'phone', 'address', 'avatar', 'role', 'isActive']
    const updateData = {}

    fields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field]
    })

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).select('-password')

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' })
    }

    res.json({ success: true, data: user, message: 'Cập nhật user thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteUserByAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' })
    }

    await user.deleteOne()

    res.json({ success: true, message: 'Đã xóa user' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}