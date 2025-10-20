import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseEntry } from './knowledge-base.types';

@Controller('knowledge-base')
export class KnowledgeBaseController {
    constructor(private readonly knowledgeBaseService: KnowledgeBaseService) { }

    @Get()
    findAll(
        @Query('category') category?: string,
        @Query('tag') tag?: string,
        @Query('q') query?: string,
    ): KnowledgeBaseEntry[] {
        return this.knowledgeBaseService.findAll({ category, tag, query });
    }

    @Get(':id')
    findOne(@Param('id') id: string): KnowledgeBaseEntry {
        const entry = this.knowledgeBaseService.findOne(id);
        if (!entry) {
            throw new NotFoundException(`Knowledge base entry ${id} not found`);
        }
        return entry;
    }
}
