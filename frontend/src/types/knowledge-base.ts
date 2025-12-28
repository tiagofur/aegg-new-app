export interface KnowledgeBaseLink {
    label: string
    url: string
}

export interface KnowledgeBaseArticle {
    id: string
    title: string
    category: string
    summary: string
    content: string
    tags: string[]
    lastUpdated: string
    links?: KnowledgeBaseLink[]
}
