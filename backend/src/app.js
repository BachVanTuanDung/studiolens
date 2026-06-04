import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.routes.js'
import bookingRoutes from './routes/booking.routes.js'
import serviceRoutes from './routes/serviceRoutes.js'
import conceptRoutes from './routes/conceptRoutes.js'
import galleryRoutes from './routes/galleryRoutes.js'
import selectedImageRoutes from './routes/selectedImageRoutes.js'
import userRoutes from './routes/userRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import notificationRoutes from './routes/notification.routes.js'
import chatRoutes from './routes/chat.routes.js'
const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('API is running...')
})

app.use('/api/auth', authRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/concepts', conceptRoutes)
app.use('/api/galleries', galleryRoutes)
app.use('/api/selected-images', selectedImageRoutes)
app.use('/api/users', userRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/chat', chatRoutes)
export default app