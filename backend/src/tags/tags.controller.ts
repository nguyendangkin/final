import { Controller, Get, Query, Param } from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  /**
   * Get all suggestions for autocomplete (for sell/edit pages)
   * Returns ALL tags regardless of usageCount
   */
  @Get('suggestions')
  async getAllSuggestions() {
    return this.tagsService.getAllSuggestions();
  }

  /**
   * Get suggestions for a specific category
   */
  @Get('suggestions/:category')
  async getSuggestions(
    @Param('category') category: string,
    @Query('parent') parent?: string,
  ) {
    return this.tagsService.getSuggestions(category, parent);
  }

}
