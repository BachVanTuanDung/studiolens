import axiosClient from './axiosClient'

export const getMyGalleries = () => axiosClient.get('/galleries/my')
export const getAllGalleries = () => axiosClient.get('/galleries')
export const getGalleryById = (id) => axiosClient.get(`/galleries/${id}`)
export const createGallery = (data) => axiosClient.post('/galleries', data)
export const updateGallery = (id, data) => axiosClient.put(`/galleries/${id}`, data)
export const deleteGallery = (id) => axiosClient.delete(`/galleries/${id}`)

export const submitSelectedImages = (payload) =>
  axiosClient.post('/selected-images', payload)

export const getMySelectedImages = () =>
  axiosClient.get('/selected-images/my')