import axiosClient from './axiosClient'

export const getAllSelectedImages = () => axiosClient.get('/selected-images')

export const updateSelectedImagesRecord = (id, data) =>
  axiosClient.put(`/selected-images/${id}`, data)