const generateBookingCode = () => {
  const random = Math.floor(1000 + Math.random() * 9000)
  const now = Date.now().toString().slice(-4)
  return `BK${now}${random}`
}

export default generateBookingCode