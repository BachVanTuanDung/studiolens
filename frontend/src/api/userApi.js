import axiosClient from './axiosClient'

export const getProfile = () => axiosClient.get('/users/profile')
export const updateProfile = (data) => axiosClient.put('/users/profile', data)

export const searchUsers = () => axiosClient.get('/users')
export const getUserById = (id) => axiosClient.get(`/users/${id}`)
export const updateUserByAdmin = (id, data) => axiosClient.put(`/users/${id}`, data)
export const deleteUserByAdmin = (id) => axiosClient.delete(`/users/${id}`)