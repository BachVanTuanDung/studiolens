import { io } from 'socket.io-client'

let socketInstance = null

export const getSocket = () => {
  if (socketInstance) return socketInstance

  const token = localStorage.getItem('token')
  if (!token) return null

  socketInstance = io('http://localhost:5000', {
    transports: ['websocket'],
    auth: {
      token,
    },
  })

  return socketInstance
}

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}