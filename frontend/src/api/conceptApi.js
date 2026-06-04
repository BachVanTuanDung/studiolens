import axiosClient from './axiosClient'

export const getConcepts = (params = {}) => axiosClient.get('/concepts', { params })
export const getConceptById = (id) => axiosClient.get(`/concepts/${id}`)
export const getSuggestedConcepts = (serviceId) =>
  axiosClient.get(`/concepts/suggest/${serviceId}`)

export const createConcept = (data) => axiosClient.post('/concepts', data)
export const updateConcept = (id, data) => axiosClient.put(`/concepts/${id}`, data)
export const deleteConcept = (id) => axiosClient.delete(`/concepts/${id}`)