export const buildAutoReply = (rawContent = '') => {
  const content = String(rawContent).toLowerCase().trim()

  if (!content) return null

  if (content.includes('giá') || content.includes('bao nhiêu')) {
    return 'Bạn có thể xem bảng giá chi tiết tại mục Dịch vụ. Nếu cần tư vấn nhanh, admin sẽ phản hồi sớm nhất.'
  }

  if (content.includes('booking') || content.includes('đặt lịch')) {
    return 'Bạn có thể đặt lịch trực tiếp tại trang Đặt lịch. Nếu cần hỗ trợ chọn buổi chụp phù hợp, admin sẽ phản hồi thêm cho bạn.'
  }

  if (content.includes('thanh toán') || content.includes('payos')) {
    return 'Nếu bạn chọn thanh toán online, hệ thống sẽ chuyển bạn sang payOS để hoàn tất giao dịch. Sau khi thanh toán thành công, website sẽ xác minh lại trạng thái booking.'
  }

  if (content.includes('gallery') || content.includes('ảnh')) {
    return 'Bạn có thể theo dõi ảnh trong mục Gallery sau khi studio cập nhật. Nếu cần hỗ trợ về ảnh đã chọn hoặc ảnh đã chỉnh sửa, admin sẽ phản hồi thêm.'
  }

  return 'StudioLens đã nhận được tin nhắn của bạn. Admin sẽ phản hồi sớm nhất nếu bạn cần hỗ trợ thêm.'
}