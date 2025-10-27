import { KnowledgeBaseEntry, KnowledgeBaseQuery } from './knowledge-base.types';
export declare class KnowledgeBaseService {
    private readonly entries;
    findAll(filters?: KnowledgeBaseQuery): KnowledgeBaseEntry[];
    findOne(id: string): KnowledgeBaseEntry | undefined;
}
