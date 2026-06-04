import 'dotenv/config'
import mongoose from 'mongoose'
import http from 'http'
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import app from './app.js'
import { startBookingReminderJob } from './jobs/bookingReminderJob.js'
import User from './models/User.js'

const PORT = process.env.PORT || 5000

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token

    if (!token) {
      return next(new Error('Không có token socket'))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return next(new Error('User không tồn tại'))
    }

    socket.user = user
    next()
  } catch (error) {
    next(new Error('Socket token không hợp lệ'))
  }
})

io.on('connection', (socket) => {
  const user = socket.user

  socket.join(`user_${user._id}`)

  if (user.role === 'admin') {
    socket.join('admins')
  }

  socket.on('join_conversation', (conversationId) => {
    if (conversationId) {
      socket.join(`conversation_${conversationId}`)
    }
  })

  socket.on('leave_conversation', (conversationId) => {
    if (conversationId) {
      socket.leave(`conversation_${conversationId}`)
    }
  })

  socket.on('admin_request_unread_refresh', async () => {
    try {
      if (user.role !== 'admin') return

      const Conversation = (await import('./models/Conversation.js')).default

      const conversations = await Conversation.find({}, 'unreadCountAdmin')
      const totalUnreadAdmin = conversations.reduce(
        (sum, item) => sum + (item.unreadCountAdmin || 0),
        0
      )

      socket.emit('admin_unread_refresh', {
        totalUnreadAdmin,
      })
    } catch (error) {
      console.error('admin_request_unread_refresh error:', error)
    }
  })

  socket.on('disconnect', () => {})
})

app.set('io', io)

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      startBookingReminderJob()
    })
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message)
  })