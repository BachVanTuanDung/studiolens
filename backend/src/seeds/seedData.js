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

// Tạo mảng ảnh dạng Object (đã sửa để khớp cấu trúc ảnh của Concept và Gallery)
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

// 1. TẠO 3 TÀI KHOẢN (1 Admin, 2 User)
const usersSeed = [
  ['Admin StudioLens', 'admin@gmail.com', 'admin', '0900000001', 'Hoàn Kiếm, Hà Nội'],
  ['Cô Dâu Minh Anh', 'minhanh.wedding@gmail.com', 'user', '0912345001', 'Cầu Giấy, Hà Nội'],
  ['Hotgirl Thu Hà', 'thuha.beauty@gmail.com', 'user', '0912345003', 'Ba Đình, Hà Nội'],
]

// 2. TẠO 6 DỊCH VỤ (Đã bỏ duration, slug tự generate ngầm nếu model cần)
const servicesSeed = [
  ['Phóng sự cưới cao cấp', 6500000, 'wedding', 'Bắt trọn cảm xúc tự nhiên nhất trong ngày trọng đại.', true, categoryImages.wedding[0]],
  ['Chụp ảnh Pre-wedding', 8000000, 'wedding', 'Hỗ trợ váy cưới và makeup chuyên nghiệp.', true, categoryImages.wedding[1]],
  ['Chụp Beauty / Nàng thơ', 2500000, 'portrait', 'Tôn vinh đường nét khuôn mặt với ánh sáng setup tinh tế.', true, categoryImages.portrait[0]],
  ['Chụp ảnh Kỷ yếu thanh xuân', 3500000, 'event', 'Ghi lại khoảnh khắc thanh xuân rực rỡ.', false, categoryImages.event[0]],
  ['Chụp Gia đình / Kỷ niệm', 3000000, 'family', 'Lưu giữ nụ cười và sự gắn kết của các thành viên.', false, categoryImages.family[0]],
  ['Chụp Sự kiện doanh nghiệp', 4500000, 'event', 'Phong cách chuyên nghiệp, trang trọng.', false, categoryImages.event[1]],
]

// 3. TẠO 6 CONCEPT (Đã bỏ slug, hỗ trợ mảng 'images' gồm 2-3 ảnh)
const conceptsSeed = [
  ['Cinematic / Điện ảnh', 'dark', 'Màu sắc trầm ấm, mang lại cảm giác như một bộ phim.', true, [categoryImages.wedding[2], categoryImages.portrait[2]]],
  ['Trong trẻo / Tự nhiên', 'minimal', 'Ánh sáng tự nhiên, tone màu trong trẻo.', true, [categoryImages.portrait[1], categoryImages.portrait[0]]],
  ['Vintage / Hoài cổ', 'vintage', 'Màu film ấm áp, nhiễu hạt nhẹ (grain).', true, [categoryImages.event[2], categoryImages.portrait[1]]],
  ['Studio Hàn Quốc', 'studio', 'Phông nền trơn tối giản, tập trung vào chủ thể.', false, [categoryImages.family[1], categoryImages.family[2]]],
  ['Luxury / Sang trọng', 'editorial', 'Đánh khối mạnh mẽ, thích hợp tiệc đêm, sự kiện.', false, [categoryImages.event[0], categoryImages.wedding[0]]],
  ['Outdoor / Dã ngoại', 'outdoor', 'Chụp ngoại cảnh bắt trọn ánh sáng tự nhiên.', false, [categoryImages.family[0], categoryImages.portrait[2]]],
]

// 4. TẠO 6 LỊCH BOOKING (Cho 2 User)
const bookingRaw = [
  // Của User 1 (Minh Anh - Index 1)
  ['BK202605001', 1, 0, 0, '2026-05-15', ['morning', 'afternoon'], 'confirmed', 'bank_qr', 'paid', 'Gói phóng sự cưới.'],
  ['BK202605002', 1, 1, 2, '2026-05-10', ['afternoon', 'evening'], 'completed', 'cash', 'paid', 'Chụp Pre-wedding.'],
  ['BK202605003', 1, 4, 3, '2026-06-01', ['morning'], 'pending', 'cash', 'unpaid', 'Chụp gia đình.'],
  // Của User 2 (Thu Hà - Index 2)
  ['BK202605004', 2, 2, 1, '2026-05-12', ['morning'], 'completed', 'bank_qr', 'paid', 'Khách makeup sẵn.'],
  ['BK202605005', 2, 3, 2, '2026-05-18', ['morning', 'afternoon'], 'confirmed', 'bank_qr', 'pending', 'Chụp kỷ yếu.'],
  ['BK202605006', 2, 5, 4, '2026-06-05', ['evening'], 'completed', 'bank_qr', 'paid', 'Chụp event doanh nghiệp.'],
]

// HÀM TẠO SLUG TỰ ĐỘNG NẾU MODEL VẪN CẦN
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

    console.log('Đang tạo Users (3 tài khoản)...')
    const users = await User.create(
      usersSeed.map(([name, email, role, phone, address], index) => ({
        name, email, role, phone, address, password: '123456', isEmailVerified: true, avatar: categoryImages.portrait[index % 3],
      }))
    )

    console.log('Đang tạo Services (6 dịch vụ)...')
    const services = await Service.insertMany(
      servicesSeed.map(([name, price, category, description, isFeatured, thumbnail]) => ({
        name, slug: generateSlug(name), price, description, category, thumbnail,
        features: ['Tư vấn Concept', 'Hỗ trợ makeup nhẹ', 'Trả toàn bộ file gốc', 'Chỉnh sửa kỹ 20-30 ảnh'],
        isFeatured, isActive: true, extraSessionRate: 0.5, allowMultiSession: true,
      }))
    )

    console.log('Đang tạo Concepts (6 concept)...')
    const concepts = await Concept.insertMany(
      conceptsSeed.map(([name, category, description, isFeatured, imgsUrls], index) => {
        // Tạo mảng Object ảnh cho Concept
        const imgObjects = imgsUrls.map((url, i) => ({ url, publicId: `concept_${index}_${i}`, caption: `${name} ${i+1}` }))
        return {
          name, slug: generateSlug(name), description, category, tags: [category, 'chup-anh', 'studiolens'],
          image: imgObjects[0].url, // Vẫn lưu ảnh đầu để tương thích schema cũ
          images: imgObjects, // Mảng ảnh mới hiển thị Grid
          relatedServices: [services[index]._id], // Liên kết 1 dịch vụ
          isFeatured, isActive: true,
        }
      })
    )

    console.log('Đang tạo Bookings (6 lịch)...')
    const bookings = await Booking.insertMany(
      bookingRaw.map(([bookingCode, userIndex, serviceIndex, conceptIndex, date, sessions, status, paymentMethod, paymentStatus, note], index) => {
        const user = users[userIndex]; const service = services[serviceIndex]; const concept = concepts[conceptIndex]
        const totalPrice = calculateTotalPrice(service, sessions)
        return {
          bookingCode, userId: user._id, serviceId: service._id, conceptId: concept._id, conceptName: concept.name,
          date, session: sessions[0], sessions, time: SESSION_TIME_MAP[sessions[0]] || '09:00',
          status, paymentMethod, paymentStatus, totalPrice, note: `${note} Tổng tiền: ${formatMoney(totalPrice)}.`,
          paidAt: paymentStatus === 'paid' ? new Date(`${date}T10:15:00.000Z`) : null,
          assignedStaff: index % 2 === 0 ? ['Tuấn'] : ['Dũng'],
        }
      })
    )

    console.log('Đang tạo Galleries (5 ảnh gửi khách, 5 ảnh chọn)...')
    const galleryBookings = bookings.filter((b) => ['completed', 'confirmed'].includes(b.status))
    const galleries = []

    for (let i = 0; i < galleryBookings.length; i += 1) {
      const booking = galleryBookings[i]
      const user = users.find((u) => u._id.toString() === booking.userId.toString())
      const service = services.find((s) => s._id.toString() === booking.serviceId.toString())
      
      // Tạo ĐÚNG 5 ảnh gửi khách
      const images = makeImages(booking.bookingCode, service.category, 5, i)

      const gallery = await Gallery.create({
        customerId: user._id, userId: user._id, bookingId: booking._id,
        title: `Album ${service.name}`, description: `Vui lòng chọn ảnh cần pts kỹ.`,
        images, coverImage: images[0].url, status: 'published', isActive: true,
      })
      galleries.push(gallery)

      // Tạo ĐÚNG 5 ảnh khách đã chọn (chọn hết cả 5)
      await SelectedImages.create({
        customerId: user._id, userId: user._id, galleryId: gallery._id, bookingId: booking._id,
        selectedImages: images,
        images: images.map((img, idx) => ({ ...img, note: idx === 0 ? 'Chỉnh eo nhỏ lại.' : '' })),
        note: 'Em đã chọn đủ 5 ảnh, anh chị chỉnh sửa giúp em.',
        status: i % 2 === 0 ? 'submitted' : 'editing',
        submittedAt: new Date(),
      })
    }

    if (Conversation && Message) {
      console.log('Đang tạo Conversations (2 đoạn chat)...')
      try {
        const admin = users[0]; const user1 = users[1]; const user2 = users[2];
        
        // Chat 1: Admin và Minh Anh
        const conv1 = await Conversation.create({ userId: user1._id, adminId: admin._id, lastMessage: 'Dạ chị yên tâm ạ.', lastMessageAt: new Date(), userUnreadCount: 0, adminUnreadCount: 0 })
        await Message.insertMany([
          { conversationId: conv1._id, senderId: user1._id, senderRole: 'user', content: 'Gói phóng sự cưới có bao gồm váy không?', messageType: 'text', isRead: true },
          { conversationId: conv1._id, senderId: admin._id, senderRole: 'admin', content: 'Dạ không bao gồm váy nhưng được giảm 20% khi thuê bên đối tác ạ.', messageType: 'text', isRead: true }
        ])

        // Chat 2: Admin và Thu Hà
        const conv2 = await Conversation.create({ userId: user2._id, adminId: admin._id, lastMessage: 'Em check lịch nhé.', lastMessageAt: new Date(), userUnreadCount: 0, adminUnreadCount: 0 })
        await Message.insertMany([
          { conversationId: conv2._id, senderId: user2._id, senderRole: 'user', content: 'Cuối tuần này em muốn đổi lịch chụp được không ạ?', messageType: 'text', isRead: true },
          { conversationId: conv2._id, senderId: admin._id, senderRole: 'admin', content: 'Dạ để em kiểm tra lại lịch trống cuối tuần nhé.', messageType: 'text', isRead: true }
        ])
      } catch (error) { console.warn('Lỗi seed Chat:', error.message) }
    }

    console.log('\n================================')
    console.log('🎉 TẠO DỮ LIỆU ĐỒ ÁN THÀNH CÔNG!')
    console.log('================================')
    console.log(`👤 Users    : ${users.length} (1 Admin, 2 User)`)
    console.log(`📸 Services : ${services.length}`)
    console.log(`✨ Concepts : ${concepts.length}`)
    console.log(`📅 Bookings : ${bookings.length}`)
    console.log(`🖼️ Galleries: ${galleries.length} (Mỗi gallery 5 ảnh)`)
    console.log('--------------------------------')
    console.log('Tài khoản Admin: admin@gmail.com / 123456')
    console.log('Tài khoản User 1: minhanh.wedding@gmail.com / 123456')
    console.log('Tài khoản User 2: thuha.beauty@gmail.com / 123456')
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