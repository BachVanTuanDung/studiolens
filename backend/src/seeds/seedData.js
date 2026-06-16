import mongoose from 'mongoose'
import dotenv from 'dotenv'

import Service from '../models/Service.js'
import Concept from '../models/Concept.js'
import User from '../models/User.js'
import Booking from '../models/Booking.js'
import Gallery from '../models/Gallery.js'
import SelectedImages from '../models/SelectedImages.js'

dotenv.config()

const optionalImport = async (path) => {
  try {
    const mod = await import(path)
    return mod.default || mod
  } catch {
    return null
  }
}

const Notification = await optionalImport('../models/Notification.js')
const Conversation = await optionalImport('../models/Conversation.js')
const Message = await optionalImport('../models/Message.js')

const SESSION_TIME_MAP = {
  morning: '09:00',
  afternoon: '14:00',
  evening: '18:30',
}

const SESSION_LABEL_MAP = {
  morning: 'Sáng',
  afternoon: 'Chiều',
  evening: 'Tối',
}

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`
const getSessionText = (sessions = []) => sessions.map((s) => SESSION_LABEL_MAP[s] || s).join(' + ')

const calculateTotalPrice = (service, sessions = []) => {
  const count = Math.max(sessions.length, 1)
  const extraRate = service.extraSessionRate ?? 0.5
  return Math.round(service.price + Math.max(count - 1, 0) * service.price * extraRate)
}

// Hình ảnh mẫu phân loại theo Category
const categoryImages = {
  wedding: [
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=90',
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1600&q=90',
    'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1600&q=90',
  ],
  portrait: [
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=90',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1600&q=90',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1600&q=90',
  ],
  event: [
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=90',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=90',
    'https://images.unsplash.com/photo-1530103862676-de8892bc952f?auto=format&fit=crop&w=1600&q=90',
  ],
  family: [
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1600&q=90',
    'https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?auto=format&fit=crop&w=1600&q=90',
    'https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=1600&q=90',
  ]
}

const getImagesPool = (categoryKey) => {
  if (['wedding'].includes(categoryKey)) return categoryImages.wedding
  if (['event'].includes(categoryKey)) return categoryImages.event
  if (['family'].includes(categoryKey)) return categoryImages.family
  return categoryImages.portrait
}

const makeImages = (bookingCode, categoryKey, count = 5, offset = 0) => {
  const pool = getImagesPool(categoryKey)
  return Array.from({ length: count }).map((_, index) => {
    const imageIndex = (offset + index) % pool.length
    const code = `${bookingCode}_${String(index + 1).padStart(3, '0')}`
    return {
      url: pool[imageIndex],
      publicId: `studiolens/gallery/${bookingCode}/${code}`,
      filename: `${code}.jpg`,
      code,
      caption: `Ảnh preview ${index + 1}`,
    }
  })
}

// 1. TẠO 2 TÀI KHOẢN (1 Admin, 1 User Bùi Thị Nhật Lệ)
const usersSeed = [
  ['Admin StudioLens', 'admin@studiolens.com', 'admin', '0900000001', 'Hà Nội'],
  ['Bùi Thị Nhật Lệ', 'nhatle@gmail.com', 'user', '0912345678', 'Hà Nội'],
]

// 2. TẠO 5 DỊCH VỤ
const servicesSeed = [
  ['Chụp Nàng Thơ / Beauty', 2500000, 'portrait', 'Tôn vinh vẻ đẹp tự nhiên, đường nét thanh tú.', true, categoryImages.portrait[0]],
  ['Chụp ảnh Cưới Pre-wedding', 8000000, 'wedding', 'Lưu giữ khoảnh khắc tình yêu đẹp nhất.', true, categoryImages.wedding[0]],
  ['Chụp Kỷ yếu nhóm bạn', 3500000, 'event', 'Ghi lại tuổi thanh xuân rực rỡ.', false, categoryImages.event[0]],
  ['Chụp Gia đình kỷ niệm', 3000000, 'family', 'Những nụ cười hạnh phúc bên người thân.', false, categoryImages.family[0]],
  ['Chụp Sự kiện Cá nhân', 4000000, 'event', 'Phóng sự sinh nhật, tiệc kỷ niệm.', false, categoryImages.event[1]],
]

// 3. TẠO 5 CONCEPT
const conceptsSeed = [
  ['Trong trẻo / Tự nhiên', 'minimal', 'Ánh sáng tự nhiên, tone màu trong trẻo nhẹ nhàng.', true, [categoryImages.portrait[1], categoryImages.portrait[0]]],
  ['Studio Hàn Quốc', 'studio', 'Phông nền trơn tối giản, nổi bật chủ thể.', true, [categoryImages.family[1], categoryImages.family[2]]],
  ['Cinematic / Điện ảnh', 'dark', 'Màu sắc trầm ấm, mang cảm giác hoài niệm.', false, [categoryImages.wedding[2], categoryImages.portrait[2]]],
  ['Vintage / Film', 'vintage', 'Tone màu film xưa cũ, đầy cảm xúc.', false, [categoryImages.event[2], categoryImages.portrait[1]]],
  ['Outdoor / Dã ngoại', 'outdoor', 'Chụp tại các địa điểm ngoài trời thoáng đãng.', false, [categoryImages.family[0], categoryImages.portrait[2]]],
]

// 4. TẠO 3 LỊCH BOOKING (Tất cả thuộc về Bùi Thị Nhật Lệ - index 1)
const bookingRaw = [
  ['BK202607001', 1, 0, 0, '2026-07-15', ['morning'], 'completed', 'bank_qr', 'paid', 'Chụp concept nàng thơ tại studio.'],
  ['BK202607002', 1, 3, 1, '2026-07-20', ['afternoon'], 'confirmed', 'cash', 'paid', 'Chụp gia đình phông trơn Hàn Quốc.'],
  ['BK202608001', 1, 2, 4, '2026-08-10', ['morning', 'afternoon'], 'pending', 'bank_qr', 'unpaid', 'Chụp kỷ yếu nhóm ngoại cảnh.'],
]

const generateSlug = (str) => {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

const seedData = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error('Thiếu MONGO_URI trong file .env backend')

    await mongoose.connect(process.env.MONGO_URI)

    console.log('Đang dọn dẹp dữ liệu cũ...')
    await Promise.all([
      Service.deleteMany({}), Concept.deleteMany({}), Booking.deleteMany({}), Gallery.deleteMany({}),
      SelectedImages.deleteMany({}), User.deleteMany({}), Notification ? Notification.deleteMany({}) : Promise.resolve(),
      Conversation ? Conversation.deleteMany({}) : Promise.resolve(), Message ? Message.deleteMany({}) : Promise.resolve(),
    ])

    console.log('Đang tạo Users (2 tài khoản)...')
    const users = await User.create(
      usersSeed.map(([name, email, role, phone, address], index) => ({
        name, email, role, phone, address, password: '123456', isEmailVerified: true, avatar: categoryImages.portrait[index % 3],
      }))
    )

    console.log('Đang tạo Services (5 dịch vụ)...')
    const services = await Service.insertMany(
      servicesSeed.map(([name, price, category, description, isFeatured, thumbnail]) => ({
        name, slug: generateSlug(name), price, description, category, thumbnail,
        features: ['Tư vấn Concept', 'Hỗ trợ trang phục', 'Trả toàn bộ file gốc', 'Chỉnh sửa kỹ 20 ảnh'],
        isFeatured, isActive: true, extraSessionRate: 0.5, allowMultiSession: true,
      }))
    )

    console.log('Đang tạo Concepts (5 concept)...')
    const concepts = await Concept.insertMany(
      conceptsSeed.map(([name, category, description, isFeatured, imgsUrls], index) => {
        const imgObjects = imgsUrls.map((url, i) => ({ url, publicId: `concept_${index}_${i}`, caption: `${name} ${i+1}` }))
        return {
          name, slug: generateSlug(name), description, category, tags: [category, 'chup-anh', 'studiolens'],
          image: imgObjects[0].url,
          images: imgObjects,
          relatedServices: [services[index]._id],
          isFeatured, isActive: true,
        }
      })
    )

    console.log('Đang tạo Bookings (3 lịch)...')
    const bookings = await Booking.insertMany(
      bookingRaw.map(([bookingCode, userIndex, serviceIndex, conceptIndex, date, sessions, status, paymentMethod, paymentStatus, note], index) => {
        const user = users[userIndex]; const service = services[serviceIndex]; const concept = concepts[conceptIndex]
        const totalPrice = calculateTotalPrice(service, sessions)
        return {
          bookingCode, userId: user._id, serviceId: service._id, conceptId: concept._id, conceptName: concept.name,
          date, session: sessions[0], sessions, time: SESSION_TIME_MAP[sessions[0]] || '09:00',
          status, paymentMethod, paymentStatus, totalPrice, note: `${note} Tổng tiền: ${formatMoney(totalPrice)}.`,
          paidAt: paymentStatus === 'paid' ? new Date(`${date}T10:15:00.000Z`) : null,
          assignedStaff: ['Tuấn', 'Dũng'],
        }
      })
    )

    console.log('Đang tạo Galleries (2 danh sách ảnh gửi khách)...')
    // Lọc ra đúng 2 booking đã thanh toán/hoàn thành để tạo Gallery
    const galleryBookings = bookings.filter((b) => ['completed', 'confirmed'].includes(b.status)).slice(0, 2)
    const galleries = []

    for (let i = 0; i < galleryBookings.length; i += 1) {
      const booking = galleryBookings[i]
      const user = users.find((u) => u._id.toString() === booking.userId.toString())
      const service = services.find((s) => s._id.toString() === booking.serviceId.toString())
      
      const images = makeImages(booking.bookingCode, service.category, 5, i)

      const gallery = await Gallery.create({
        customerId: user._id, userId: user._id, bookingId: booking._id,
        title: `Album ${service.name}`, description: `Chị Lệ chọn ảnh cần PTS tại đây nhé.`,
        images, coverImage: images[0].url, status: 'published', isActive: true,
      })
      galleries.push(gallery)

      await SelectedImages.create({
        customerId: user._id, userId: user._id, galleryId: gallery._id, bookingId: booking._id,
        selectedImages: images,
        images: images.map((img, idx) => ({ ...img, note: idx === 0 ? 'Kéo màu sáng lên chút.' : '' })),
        note: 'Mình đã chọn đủ 5 ảnh, bạn chỉnh giúp mình.',
        status: i === 0 ? 'submitted' : 'editing',
        submittedAt: new Date(),
      })
    }

    if (Conversation && Message) {
      console.log('Đang tạo Conversations (1 đoạn chat)...')
      try {
        const admin = users[0]; const userLe = users[1];
        
        // Chat 1: Admin và Bùi Thị Nhật Lệ
        const conv1 = await Conversation.create({ 
          userId: userLe._id, adminId: admin._id, 
          lastMessage: 'Dạ mình ghi nhận thông tin rồi ạ.', 
          lastMessageAt: new Date(), userUnreadCount: 0, adminUnreadCount: 0 
        })
        await Message.insertMany([
          { conversationId: conv1._id, senderId: userLe._id, senderRole: 'user', content: 'Chào shop, gói chụp nàng thơ có kèm trang điểm không?', messageType: 'text', isRead: true },
          { conversationId: conv1._id, senderId: admin._id, senderRole: 'admin', content: 'Chào chị Lệ, dạ gói nàng thơ bên em đã hỗ trợ trang điểm nhẹ nhàng rồi ạ.', messageType: 'text', isRead: true },
          { conversationId: conv1._id, senderId: userLe._id, senderRole: 'user', content: 'Oke bạn, vậy để mình đặt lịch.', messageType: 'text', isRead: true },
          { conversationId: conv1._id, senderId: admin._id, senderRole: 'admin', content: 'Dạ mình ghi nhận thông tin rồi ạ. Chị cứ thao tác đặt lịch trên web nhé.', messageType: 'text', isRead: true }
        ])
      } catch (error) { console.warn('Lỗi seed Chat:', error.message) }
    }

    console.log('\n================================')
    console.log('🎉 TẠO DỮ LIỆU ĐỒ ÁN THÀNH CÔNG!')
    console.log('================================')
    console.log(`👤 Users    : ${users.length} (1 Admin, 1 User: Bùi Thị Nhật Lệ)`)
    console.log(`📸 Services : ${services.length} dịch vụ`)
    console.log(`✨ Concepts : ${concepts.length} concept`)
    console.log(`📅 Bookings : ${bookings.length} lịch`)
    console.log(`🖼️ Galleries: ${galleries.length} (Mỗi gallery 5 ảnh)`)
    console.log('--------------------------------')
    console.log('Tài khoản Admin: admin@studiolens.com / 123456')
    console.log('Tài khoản User : nhatle@gmail.com / 123456')
    console.log('================================\n')

    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('Seed lỗi:', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

seedData()