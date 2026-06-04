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

const imagePool = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1600&q=90',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1600&q=90',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=1600&q=90',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1600&q=90',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1600&q=90',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1600&q=90',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=90',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=90',
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=90',
  'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1600&q=90',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=90',
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1600&q=90',
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=90',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=90',
  'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?auto=format&fit=crop&w=1600&q=90',
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=90',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=90',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1600&q=90',
]

const makeImages = (bookingCode, count = 12, offset = 0) => {
  return Array.from({ length: count }).map((_, index) => {
    const imageIndex = (offset + index) % imagePool.length
    const code = `${bookingCode}_${String(index + 1).padStart(3, '0')}`
    return {
      url: imagePool[imageIndex],
      publicId: `studiolens/gallery/${bookingCode}/${code}`,
      filename: `${code}.jpg`,
      code,
      caption: `Ảnh preview ${index + 1}`,
    }
  })
}

const servicesSeed = [
  ['Chụp chân dung cá nhân', 'chup-chan-dung-ca-nhan', 800000, 90, 'portrait', 'Gói chụp chân dung cá nhân trong studio, phù hợp ảnh profile, sinh nhật, portfolio.', true],
  ['Chụp couple ngoại cảnh', 'chup-couple-ngoai-canh', 1500000, 120, 'fashion', 'Gói chụp đôi ngoại cảnh phong cách tự nhiên, lãng mạn, nhiều cảm xúc.', true],
  ['Chụp gia đình ấm áp', 'chup-gia-dinh-am-ap', 1800000, 120, 'family', 'Gói chụp gia đình trong studio hoặc ngoại cảnh, tập trung cảm xúc gần gũi.', true],
  ['Chụp lookbook thời trang', 'chup-lookbook-thoi-trang', 2500000, 180, 'fashion', 'Gói chụp lookbook cho local brand, shop thời trang hoặc cá nhân cần ảnh thương mại.', true],
  ['Phóng sự cưới nửa ngày', 'phong-su-cuoi-nua-ngay', 3500000, 240, 'wedding', 'Gói phóng sự cưới cho lễ ăn hỏi hoặc tiệc cưới nửa ngày.', true],
  ['Phóng sự cưới cả ngày', 'phong-su-cuoi-ca-ngay', 5500000, 480, 'wedding', 'Gói phóng sự cưới từ sáng đến tối, ghi lại đầy đủ các khoảnh khắc quan trọng.', true],
  ['Chụp kỷ yếu học sinh', 'chup-ky-yeu-hoc-sinh', 3000000, 240, 'event', 'Gói kỷ yếu lớp học với ảnh tập thể, nhóm bạn, cá nhân và concept thanh xuân.', false],
  ['Chụp sự kiện doanh nghiệp', 'chup-su-kien-doanh-nghiep', 4000000, 240, 'event', 'Gói chụp hội thảo, khai trương, gala dinner hoặc hoạt động doanh nghiệp.', false],
  ['Chụp beauty editorial', 'chup-beauty-editorial', 2200000, 150, 'editorial', 'Gói chụp beauty/editorial với ánh sáng thời trang và retouch high-end.', true],
  ['Chụp sinh nhật concept', 'chup-sinh-nhat-concept', 1200000, 90, 'portrait', 'Gói chụp sinh nhật cá nhân hoặc nhóm bạn với decor nhẹ và tone màu trẻ trung.', false],
  ['Chụp profile doanh nhân', 'chup-profile-doanh-nhan', 1600000, 90, 'portrait', 'Gói chụp profile, CV, LinkedIn và hình ảnh thương hiệu cá nhân.', false],
  ['Chụp sản phẩm sáng tạo', 'chup-san-pham-sang-tao', 2800000, 180, 'editorial', 'Gói chụp sản phẩm mỹ phẩm, phụ kiện, đồ thủ công với layout thương mại.', false],
]

const conceptsSeed = [
  ['Vintage nhẹ nhàng', 'vintage-nhe-nhang', 'vintage', 'Concept tone ấm, nhẹ nhàng, phù hợp chân dung, couple và sinh nhật.', true],
  ['Studio tối giản', 'studio-toi-gian', 'studio', 'Concept tối giản, tập trung ánh sáng, thần thái và bố cục gọn.', true],
  ['Ngoài trời lãng mạn', 'ngoai-troi-lang-man', 'outdoor', 'Concept ngoại cảnh ánh sáng tự nhiên, phù hợp couple và pre-wedding.', true],
  ['Gia đình ấm áp', 'gia-dinh-am-ap', 'studio', 'Concept gia đình gần gũi, tone ấm, phù hợp bố mẹ và con nhỏ.', true],
  ['Dark cinematic', 'dark-cinematic', 'dark', 'Concept ánh sáng low-key, tương phản mạnh, phù hợp chân dung điện ảnh.', true],
  ['Editorial magazine', 'editorial-magazine', 'editorial', 'Concept thời trang tạp chí, bố cục mạnh, phù hợp lookbook và beauty.', true],
  ['Thanh xuân vườn trường', 'thanh-xuan-vuon-truong', 'outdoor', 'Concept trẻ trung, trong sáng, phù hợp kỷ yếu học sinh và sinh viên.', false],
  ['Beauty clean light', 'beauty-clean-light', 'minimal', 'Concept ánh sáng sạch, da đẹp, phù hợp beauty và makeup.', false],
  ['Urban street mood', 'urban-street-mood', 'outdoor', 'Concept đường phố hiện đại, trẻ trung, phù hợp cá nhân và couple.', false],
  ['Minimal premium', 'minimal-premium', 'minimal', 'Concept tối giản cao cấp, phù hợp doanh nhân và thương hiệu cá nhân.', false],
]

const usersSeed = [
  ['Admin Studio', 'admin@gmail.com', 'admin', '0900000001', 'StudioLens, Hà Nội'],
  ['Bạch Văn Tuấn Dũng', 'dung.studiolens@gmail.com', 'admin', '0900000002', 'Hoàn Kiếm, Hà Nội'],
  ['Nguyễn Minh Anh', 'minhanh@gmail.com', 'user', '0912345001', 'Cầu Giấy, Hà Nội'],
  ['Trần Hoàng Nam', 'hoangnam@gmail.com', 'user', '0912345002', 'Đống Đa, Hà Nội'],
  ['Phạm Thu Hà', 'thuha@gmail.com', 'user', '0912345003', 'Ba Đình, Hà Nội'],
  ['Lê Đức Mạnh', 'ducmanh@gmail.com', 'user', '0912345004', 'Thanh Xuân, Hà Nội'],
  ['Vũ Khánh Linh', 'khanhlinh@gmail.com', 'user', '0912345005', 'Hà Đông, Hà Nội'],
  ['Đỗ Hải Yến', 'haiyen@gmail.com', 'user', '0912345006', 'Long Biên, Hà Nội'],
  ['Ngô Quang Huy', 'quanghuy@gmail.com', 'user', '0912345007', 'Tây Hồ, Hà Nội'],
  ['Hoàng Ngọc Mai', 'ngocmai@gmail.com', 'user', '0912345008', 'Nam Từ Liêm, Hà Nội'],
  ['Bùi Anh Tú', 'anhtu@gmail.com', 'user', '0912345009', 'Hoàng Mai, Hà Nội'],
  ['Đặng Phương Thảo', 'phuongthao@gmail.com', 'user', '0912345010', 'Bắc Từ Liêm, Hà Nội'],
  ['Nguyễn Gia Bảo', 'giabao@gmail.com', 'user', '0912345011', 'Hai Bà Trưng, Hà Nội'],
  ['Lê Nhật Minh', 'nhatminh@gmail.com', 'user', '0912345012', 'Hà Nội'],
  ['Trần Bảo Ngọc', 'baongoc@gmail.com', 'user', '0912345013', 'Hà Nội'],
  ['Phạm Quốc Việt', 'quocviet@gmail.com', 'user', '0912345014', 'Hà Nội'],
  ['Mai Thanh Huyền', 'thanhhuyen@gmail.com', 'user', '0912345015', 'Hà Nội'],
  ['Đỗ Minh Khang', 'minhkhang@gmail.com', 'user', '0912345016', 'Hà Nội'],
  ['Lý Hà My', 'hamy@gmail.com', 'user', '0912345017', 'Hà Nội'],
  ['Tạ Anh Quân', 'anhquan@gmail.com', 'user', '0912345018', 'Hà Nội'],
]

const bookingRaw = [
  ['BK202605001', 2, 'chup-chan-dung-ca-nhan', 'studio-toi-gian', '2026-05-10', ['morning'], 'completed', 'cash', 'paid', 'Khách cần ảnh profile CV, tone sáng.'],
  ['BK202605002', 3, 'chup-couple-ngoai-canh', 'ngoai-troi-lang-man', '2026-05-11', ['afternoon', 'evening'], 'completed', 'bank_qr', 'paid', 'Couple muốn ảnh hoàng hôn và vài ảnh buổi tối.'],
  ['BK202605003', 4, 'chup-gia-dinh-am-ap', 'gia-dinh-am-ap', '2026-05-12', ['morning'], 'confirmed', 'cash', 'unpaid', 'Gia đình 4 người, có bé nhỏ.'],
  ['BK202605004', 5, 'phong-su-cuoi-nua-ngay', 'vintage-nhe-nhang', '2026-05-13', ['morning', 'afternoon'], 'confirmed', 'bank_qr', 'pending', 'Lễ ăn hỏi, cần chụp đầy đủ từ nhà gái đến nhà trai.'],
  ['BK202605005', 6, 'chup-lookbook-thoi-trang', 'editorial-magazine', '2026-05-14', ['afternoon'], 'pending', 'cash', 'unpaid', 'Shop cần chụp 20 mẫu váy.'],
  ['BK202605006', 7, 'chup-beauty-editorial', 'beauty-clean-light', '2026-05-15', ['evening'], 'confirmed', 'bank_qr', 'paid', 'Makeup artist cần ảnh beauty cận mặt.'],
  ['BK202605007', 8, 'chup-ky-yeu-hoc-sinh', 'thanh-xuan-vuon-truong', '2026-05-16', ['morning', 'afternoon'], 'pending', 'cash', 'unpaid', 'Lớp 12A1, khoảng 38 học sinh.'],
  ['BK202605008', 9, 'chup-profile-doanh-nhan', 'minimal-premium', '2026-05-17', ['morning'], 'completed', 'bank_qr', 'paid', 'Khách cần ảnh LinkedIn và profile công ty.'],
  ['BK202605009', 10, 'chup-sinh-nhat-concept', 'vintage-nhe-nhang', '2026-05-18', ['afternoon'], 'confirmed', 'cash', 'paid', 'Sinh nhật 20 tuổi, cần decor đơn giản.'],
  ['BK202605010', 11, 'phong-su-cuoi-ca-ngay', 'vintage-nhe-nhang', '2026-05-19', ['morning', 'afternoon', 'evening'], 'confirmed', 'bank_qr', 'paid', 'Đám cưới cả ngày, cần 2 photographer.'],
  ['BK202605011', 12, 'chup-su-kien-doanh-nghiep', 'minimal-premium', '2026-05-20', ['morning', 'afternoon'], 'pending', 'bank_qr', 'pending', 'Sự kiện khai trương showroom.'],
  ['BK202605012', 13, 'chup-san-pham-sang-tao', 'editorial-magazine', '2026-05-21', ['afternoon'], 'confirmed', 'cash', 'unpaid', 'Chụp mỹ phẩm, cần nền sáng.'],
  ['BK202605013', 14, 'chup-chan-dung-ca-nhan', 'dark-cinematic', '2026-05-22', ['evening'], 'confirmed', 'cash', 'unpaid', 'Khách muốn ảnh dark cinematic.'],
  ['BK202605014', 15, 'chup-couple-ngoai-canh', 'urban-street-mood', '2026-05-23', ['afternoon'], 'pending', 'bank_qr', 'pending', 'Couple thích vibe phố cổ.'],
  ['BK202605015', 16, 'chup-lookbook-thoi-trang', 'editorial-magazine', '2026-05-24', ['morning', 'afternoon'], 'confirmed', 'bank_qr', 'paid', 'Lookbook hè, 35 outfit.'],
  ['BK202605016', 17, 'chup-gia-dinh-am-ap', 'gia-dinh-am-ap', '2026-05-25', ['morning'], 'pending', 'cash', 'unpaid', 'Gia đình 3 thế hệ.'],
  ['BK202605017', 18, 'chup-beauty-editorial', 'beauty-clean-light', '2026-05-26', ['afternoon'], 'completed', 'bank_qr', 'paid', 'Beauty clean, cần ảnh đã chỉnh mẫu.'],
  ['BK202605018', 19, 'chup-profile-doanh-nhan', 'studio-toi-gian', '2026-05-27', ['morning'], 'confirmed', 'cash', 'paid', 'Ảnh profile công ty.'],
  ['BK202605019', 2, 'chup-sinh-nhat-concept', 'vintage-nhe-nhang', '2026-05-28', ['evening'], 'cancelled', 'cash', 'unpaid', 'Khách hủy vì đổi lịch cá nhân.'],
  ['BK202605020', 3, 'phong-su-cuoi-nua-ngay', 'ngoai-troi-lang-man', '2026-05-29', ['morning', 'afternoon'], 'confirmed', 'bank_qr', 'pending', 'Lễ cưới ngoài trời, cần ảnh cảm xúc.'],
]

// Tự sinh thêm 40 booking để dashboard, calendar và filter có nhiều dữ liệu.
const extraDates = Array.from({ length: 40 }).map((_, index) => {
  const day = String((index % 26) + 1).padStart(2, '0')
  const month = index < 20 ? '06' : '07'
  return `2026-${month}-${day}`
})

const serviceSlugs = servicesSeed.map(([, slug]) => slug)
const conceptSlugs = conceptsSeed.map(([, slug]) => slug)
const sessionCases = [['morning'], ['afternoon'], ['evening'], ['morning', 'afternoon'], ['afternoon', 'evening'], ['morning', 'afternoon', 'evening']]
const statuses = ['pending', 'confirmed', 'completed', 'confirmed', 'pending']
const paymentStatuses = ['unpaid', 'pending', 'paid', 'unpaid', 'paid']

extraDates.forEach((date, index) => {
  const code = `BK2026${index < 20 ? '06' : '07'}${String(index + 1).padStart(3, '0')}`
  bookingRaw.push([
    code,
    2 + (index % (usersSeed.length - 2)),
    serviceSlugs[index % serviceSlugs.length],
    conceptSlugs[index % conceptSlugs.length],
    date,
    sessionCases[index % sessionCases.length],
    statuses[index % statuses.length],
    index % 3 === 0 ? 'bank_qr' : 'cash',
    paymentStatuses[index % paymentStatuses.length],
    `Dữ liệu demo tự sinh số ${index + 1}: khách cần tư vấn concept và thời gian nhận ảnh.`,
  ])
})

const seedData = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error('Thiếu MONGO_URI trong file .env backend')

    await mongoose.connect(process.env.MONGO_URI)

    console.log('Đang xóa dữ liệu cũ...')
    await Promise.all([
      Service.deleteMany({}),
      Concept.deleteMany({}),
      Booking.deleteMany({}),
      Gallery.deleteMany({}),
      SelectedImages.deleteMany({}),
      User.deleteMany({}),
      Notification ? Notification.deleteMany({}) : Promise.resolve(),
      Conversation ? Conversation.deleteMany({}) : Promise.resolve(),
      Message ? Message.deleteMany({}) : Promise.resolve(),
    ])

    console.log('Đang tạo users...')
    const users = await User.create(
      usersSeed.map(([name, email, role, phone, address], index) => ({
        name,
        email,
        password: '123456',
        role,
        phone,
        address,
        isEmailVerified: true,
        avatar: imagePool[index % imagePool.length],
      }))
    )

    console.log('Đang tạo services...')
    const services = await Service.insertMany(
      servicesSeed.map(([name, slug, price, duration, category, description, isFeatured], index) => ({
        name,
        slug,
        price,
        duration,
        description,
        category,
        thumbnail: imagePool[(index + 8) % imagePool.length],
        features: ['Tư vấn concept', 'Hỗ trợ tạo dáng', 'Gallery online', 'Buổi thêm chỉ 50% giá gốc'],
        isFeatured,
        isActive: true,
        extraSessionRate: 0.5,
        allowMultiSession: true,
      }))
    )

    const serviceBySlug = Object.fromEntries(services.map((item) => [item.slug, item]))

    console.log('Đang tạo concepts...')
    const concepts = await Concept.insertMany(
      conceptsSeed.map(([name, slug, category, description, isFeatured], index) => ({
        name,
        slug,
        image: imagePool[(index + 3) % imagePool.length],
        description,
        category,
        tags: [category, 'studiolens', 'demo'],
        relatedServices: services.slice(index % 4, (index % 4) + 4).map((service) => service._id),
        isFeatured,
        isActive: true,
      }))
    )

    const conceptBySlug = Object.fromEntries(concepts.map((item) => [item.slug, item]))

    console.log('Đang tạo bookings...')
    const bookings = await Booking.insertMany(
      bookingRaw.map(([bookingCode, userIndex, serviceSlug, conceptSlug, date, sessions, status, paymentMethod, paymentStatus, note], index) => {
        const user = users[userIndex]
        const service = serviceBySlug[serviceSlug]
        const concept = conceptBySlug[conceptSlug]
        const totalPrice = calculateTotalPrice(service, sessions)
        const isPaid = paymentStatus === 'paid'
        const isOnline = paymentMethod === 'bank_qr'

        return {
          bookingCode,
          userId: user._id,
          serviceId: service._id,
          conceptId: concept?._id || null,
          conceptName: concept?.name || '',
          date,
          session: sessions[0],
          sessions,
          time: SESSION_TIME_MAP[sessions[0]] || '09:00',
          status,
          paymentMethod,
          paymentStatus,
          paymentProvider: isOnline ? 'payos' : 'manual_qr',
          paymentOrderCode: isOnline ? Number(bookingCode.replace(/\D/g, '').slice(-9)) : null,
          paymentLinkId: isOnline ? `payos_${bookingCode.toLowerCase()}` : '',
          checkoutUrl: isOnline && paymentStatus !== 'paid' ? `https://pay.payos.vn/web/${bookingCode.toLowerCase()}` : '',
          paymentQrCode: isOnline ? `QR_${bookingCode}` : '',
          reconciledAt: isPaid ? new Date(`${date}T10:00:00.000Z`) : null,
          paidAt: isPaid ? new Date(`${date}T10:15:00.000Z`) : null,
          transferContent: isOnline ? `STUDIOLENS ${bookingCode}` : '',
          qrImageUrl: isOnline
            ? `https://img.vietqr.io/image/MB-111100399999-compact2.png?amount=${totalPrice}&addInfo=${encodeURIComponent(`STUDIOLENS ${bookingCode}`)}&accountName=${encodeURIComponent('BACH VAN TUAN DUNG')}`
            : '',
          qrTemplate: 'compact2',
          bankCode: isOnline ? 'MB' : '',
          bankAccountNo: isOnline ? '111100399999' : '',
          bankAccountName: isOnline ? 'BACH VAN TUAN DUNG' : '',
          totalPrice,
          extraSessionRate: service.extraSessionRate ?? 0.5,
          note: `${note} Buổi chụp: ${getSessionText(sessions)}. Tổng tiền demo: ${formatMoney(totalPrice)}.`,
          assignedStaff: index % 3 === 0 ? ['Tuấn', 'Dũng'] : index % 3 === 1 ? ['Tuấn'] : ['Dũng'],
          confirmationEmailSent: true,
          reminderSent: ['confirmed', 'completed'].includes(status),
          confirmationEmailSentAt: new Date(`${date}T02:30:00.000Z`),
          reminderSentAt: ['confirmed', 'completed'].includes(status) ? new Date(`${date}T00:30:00.000Z`) : null,
        }
      })
    )

    console.log('Đang tạo galleries và selected images...')
    const galleryBookings = bookings.filter((booking) => ['completed', 'confirmed'].includes(booking.status)).slice(0, 24)
    const galleries = []

    for (let i = 0; i < galleryBookings.length; i += 1) {
      const booking = galleryBookings[i]
      const user = users.find((item) => item._id.toString() === booking.userId.toString())
      const service = services.find((item) => item._id.toString() === booking.serviceId.toString())
      const images = makeImages(booking.bookingCode, 12, i)

      const gallery = await Gallery.create({
        customerId: user._id,
        userId: user._id,
        bookingId: booking._id,
        title: `Gallery ${service?.name || 'StudioLens'} - ${user.name}`,
        description: `Album demo cho booking ${booking.bookingCode}. Khách có thể xem, zoom và chọn ảnh cần chỉnh sửa.`,
        images,
        coverImage: images[0]?.url || '',
        status: 'published',
        isActive: true,
      })

      galleries.push(gallery)

      const selected = images.slice(0, i % 3 === 0 ? 5 : 4)
      await SelectedImages.create({
        customerId: user._id,
        userId: user._id,
        galleryId: gallery._id,
        bookingId: booking._id,
        selectedImages: selected.map((image) => image.url),
        images: selected.map((image, index) => ({
          url: image.url,
          publicId: image.publicId,
          filename: image.filename,
          code: image.code,
          note: index === 0 ? 'Ưu tiên chỉnh da tự nhiên, giữ màu nhẹ.' : '',
          editedUrl: index < 2 ? `${image.url}&sat=-8&contrast=8` : '',
          editedPublicId: index < 2 ? `studiolens/gallery/${booking.bookingCode}/edited/${image.code}` : '',
          editedAt: index < 2 ? new Date(`${booking.date}T15:30:00.000Z`) : null,
        })),
        note: 'Khách đã chọn ảnh cần chỉnh. Ưu tiên màu tự nhiên, không làm da quá ảo.',
        status: i % 2 === 0 ? 'submitted' : 'editing',
        submittedAt: new Date(`${booking.date}T14:30:00.000Z`),
      })
    }

    if (Notification) {
      console.log('Đang tạo notifications...')
      try {
        const notifications = []
        bookings.slice(0, 45).forEach((booking) => {
          notifications.push({
            userId: booking.userId,
            title: 'Booking đã được ghi nhận',
            message: `Booking ${booking.bookingCode} đã được tạo thành công. Buổi chụp: ${getSessionText(booking.sessions || [booking.session])}.`,
            type: 'booking_created',
            category: 'booking',
            priority: booking.status === 'pending' ? 'medium' : 'low',
            senderRole: 'system',
            link: '/my-bookings',
            isRead: booking.status === 'completed',
            meta: { bookingId: booking._id, bookingCode: booking.bookingCode },
          })
          if (booking.paymentStatus === 'paid') {
            notifications.push({
              userId: booking.userId,
              title: 'Thanh toán thành công',
              message: `StudioLens đã xác nhận thanh toán ${formatMoney(booking.totalPrice)} cho booking ${booking.bookingCode}.`,
              type: 'payment_paid',
              category: 'payment',
              priority: 'high',
              senderRole: 'system',
              link: '/my-bookings',
              isRead: false,
              meta: { bookingId: booking._id, totalPrice: booking.totalPrice },
            })
          }
        })
        galleries.slice(0, 18).forEach((gallery) => {
          notifications.push({
            userId: gallery.userId || gallery.customerId,
            title: 'Gallery ảnh đã sẵn sàng',
            message: `Album "${gallery.title}" đã được cập nhật. Bạn có thể vào Gallery cá nhân để xem và chọn ảnh.`,
            type: 'gallery_created',
            category: 'gallery',
            priority: 'medium',
            senderRole: 'admin',
            link: '/gallery',
            isRead: false,
            meta: { galleryId: gallery._id, bookingId: gallery.bookingId },
          })
        })
        await Notification.insertMany(notifications)
      } catch (error) {
        console.warn('Bỏ qua seed Notification vì schema không khớp:', error.message)
      }
    }

    if (Conversation && Message) {
      console.log('Đang tạo conversations/messages...')
      try {
        const admin = users.find((item) => item.email === 'admin@gmail.com')
        const customerUsers = users.filter((item) => item.role === 'user').slice(0, 12)

        for (let i = 0; i < customerUsers.length; i += 1) {
          const user = customerUsers[i]
          const latestBooking = bookings.find((booking) => booking.userId.toString() === user._id.toString())
          const conversation = await Conversation.create({
            userId: user._id,
            adminId: admin._id,
            lastMessage: 'Dạ StudioLens đã nhận thông tin, em sẽ kiểm tra lịch và phản hồi ngay ạ.',
            lastMessageAt: new Date('2026-05-20T09:30:00.000Z'),
            userUnreadCount: i % 2,
            adminUnreadCount: i % 3 === 0 ? 2 : 0,
            bookingSummary: latestBooking
              ? {
                  bookingId: latestBooking._id,
                  bookingCode: latestBooking.bookingCode,
                  date: latestBooking.date,
                  sessions: latestBooking.sessions,
                }
              : null,
          })

          await Message.insertMany([
            {
              conversationId: conversation._id,
              senderId: user._id,
              senderRole: 'user',
              content: 'Em muốn hỏi studio còn lịch trống cho tuần này không ạ?',
              messageType: 'text',
              isRead: true,
              readAt: new Date('2026-05-20T09:10:00.000Z'),
            },
            {
              conversationId: conversation._id,
              senderId: admin._id,
              senderRole: 'admin',
              content: 'Dạ còn ạ, bạn muốn chụp concept nào và chọn buổi sáng hay chiều ạ?',
              messageType: 'text',
              isRead: true,
              readAt: new Date('2026-05-20T09:12:00.000Z'),
            },
            {
              conversationId: conversation._id,
              senderId: user._id,
              senderRole: 'user',
              content: 'Nếu em đặt thêm buổi chiều thì giá tính như thế nào ạ?',
              messageType: 'text',
              isRead: i % 2 === 0,
              readAt: i % 2 === 0 ? new Date('2026-05-20T09:20:00.000Z') : null,
            },
            {
              conversationId: conversation._id,
              senderId: admin._id,
              senderRole: 'admin',
              content: 'Dạ buổi đầu tính 100% giá gói, buổi thêm trong cùng ngày chỉ tính 50% nên sẽ tiết kiệm hơn ạ.',
              messageType: 'text',
              isRead: false,
              readAt: null,
            },
          ])
        }
      } catch (error) {
        console.warn('Bỏ qua seed Conversation/Message vì schema không khớp:', error.message)
      }
    }

    console.log('\nSeed dữ liệu demo thành công!')
    console.log('--------------------------------')
    console.log(`Users: ${users.length}`)
    console.log(`Services: ${services.length}`)
    console.log(`Concepts: ${concepts.length}`)
    console.log(`Bookings: ${bookings.length}`)
    console.log(`Galleries: ${galleries.length}`)
    console.log('--------------------------------')
    console.log('Admin: admin@gmail.com / 123456')
    console.log('Admin 2: dung.studiolens@gmail.com / 123456')
    console.log('User demo: minhanh@gmail.com / 123456')
    console.log('User demo: hoangnam@gmail.com / 123456')
    console.log('User demo: thuha@gmail.com / 123456')
    console.log('--------------------------------\n')

    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('Seed lỗi:', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

seedData()
