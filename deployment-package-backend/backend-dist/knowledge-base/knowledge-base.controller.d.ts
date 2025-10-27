import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseEntry } from './knowledge-base.types';
export declare class KnowledgeBaseController {
    private readonly knowledgeBaseService;
    constructor(knowledgeBaseService: KnowledgeBaseService);
    findAll(category?: string, tag?: string, query?: string): KnowledgeBaseEntry[];
    findOne(id: string): KnowledgeBaseEntry;
}
