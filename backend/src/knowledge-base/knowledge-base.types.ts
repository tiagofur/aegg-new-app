export interface KnowledgeBaseLink {
    label: string;
    url: string;
}

export interface KnowledgeBaseEntry {
    id: string;
    title: string;
    category: string;
    summary: string;
    content: string;
    tags: string[];
    lastUpdated: string;
    links?: KnowledgeBaseLink[];
}

export interface KnowledgeBaseQuery {
    category?: string;
    tag?: string;
    query?: string;
}
