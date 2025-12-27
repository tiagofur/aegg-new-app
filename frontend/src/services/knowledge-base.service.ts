import api from './api'
import { KnowledgeBaseArticle } from '../types'

export interface KnowledgeBaseQueryParams {
    category?: string
    tag?: string
    q?: string
}

export const knowledgeBaseService = {
    async getAll(params?: KnowledgeBaseQueryParams): Promise<KnowledgeBaseArticle[]> {
        const { data } = await api.get('/knowledge-base', { params })
        return data
    },

    async getOne(id: string): Promise<KnowledgeBaseArticle> {
        const { data } = await api.get(`/knowledge-base/${id}`)
        return data
    },
}
