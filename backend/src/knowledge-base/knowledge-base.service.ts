import { Injectable } from '@nestjs/common';
import { KNOWLEDGE_BASE_ENTRIES } from './knowledge-base.data';
import { KnowledgeBaseEntry, KnowledgeBaseQuery } from './knowledge-base.types';

@Injectable()
export class KnowledgeBaseService {
    private readonly entries: KnowledgeBaseEntry[] = KNOWLEDGE_BASE_ENTRIES;

    findAll(filters?: KnowledgeBaseQuery): KnowledgeBaseEntry[] {
        if (!filters) {
            return this.entries;
        }

        const { category, tag, query } = filters;
        return this.entries.filter((entry) => {
            const categoryOk = category ? entry.category.toLowerCase() === category.toLowerCase() : true;
            const tagOk = tag ? entry.tags.some((value) => value.toLowerCase() === tag.toLowerCase()) : true;
            const queryOk = query
                ? [entry.title, entry.summary, entry.content]
                    .join(' ')
                    .toLowerCase()
                    .includes(query.toLowerCase())
                : true;
            return categoryOk && tagOk && queryOk;
        });
    }

    findOne(id: string): KnowledgeBaseEntry | undefined {
        return this.entries.find((entry) => entry.id === id);
    }
}
