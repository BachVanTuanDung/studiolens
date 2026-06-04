const studioName = process.env.STUDIO_NAME || 'StudioLens'

export const getBookingConfirmationTemplate = ({
  customerName,
  serviceName,
  conceptName,
  date,
  time,
  note,
  bookingCode,
}) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2>Xác nhận đặt lịch tại ${studioName}</h2>
      <p>Xin chào <strong>${customerName || 'bạn'}</strong>,</p>
      <p>Bạn đã đặt lịch thành công. Thông tin booking của bạn:</p>

      <table style="border-collapse: collapse; width: 100%; max-width: 560px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Mã booking</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${bookingCode || '--'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Dịch vụ</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${serviceName || '--'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Concept</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${conceptName || 'Không chọn'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Ngày chụp</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${date}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Giờ chụp</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${time}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Ghi chú</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${note || 'Không có'}</td>
        </tr>
      </table>

      <p style="margin-top: 16px;">Cảm ơn bạn đã đặt lịch tại ${studioName}.</p>
    </div>
  `
}

export const getBookingReminderTemplate = ({
  customerName,
  serviceName,
  conceptName,
  date,
  time,
  bookingCode,
}) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2>Nhắc lịch chụp tại ${studioName}</h2>
      <p>Xin chào <strong>${customerName || 'bạn'}</strong>,</p>
      <p>Studio xin nhắc bạn về lịch chụp sắp tới:</p>

      <table style="border-collapse: collapse; width: 100%; max-width: 560px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Mã booking</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${bookingCode || '--'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Dịch vụ</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${serviceName || '--'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Concept</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${conceptName || 'Không chọn'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Ngày chụp</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${date}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Giờ chụp</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${time}</td>
        </tr>
      </table>

      <p style="margin-top: 16px;">
        Vui lòng đến trước giờ hẹn khoảng 10-15 phút để buổi chụp diễn ra thuận lợi.
      </p>
    </div>
  `
}