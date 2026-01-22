import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { Car } from '../cars/entities/car.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
  ) {}

  /**
   * Extract all tags from a car and sync them in the database
   * @param car The car to extract tags from
   * @param increment If true, increment usageCount; if false, decrement
   */
  async syncTagsFromCar(car: Car, increment: boolean): Promise<void> {
    const tags: { category: string; value: string; parent?: string }[] = [];

    // 1. Independent Tags (No Parent)
    if (car.make)
      tags.push({
        category: 'make',
        value: car.make.trim().toUpperCase(),
        parent: '',
      });
    if (car.year && car.model)
      tags.push({
        category: 'year',
        value: car.year.toString(),
        parent: car.model.trim().toUpperCase(),
      });

    if (car.location)
      tags.push({
        category: 'location',
        value: car.location.trim().toUpperCase(),
        parent: '',
      });
    if (car.transmission)
      tags.push({
        category: 'transmission',
        value: car.transmission.trim().toUpperCase(),
        parent: '',
      });
    if (car.drivetrain)
      tags.push({
        category: 'drivetrain',
        value: car.drivetrain.trim().toUpperCase(),
        parent: '',
      });
    if (car.condition)
      tags.push({
        category: 'condition',
        value: car.condition.trim().toUpperCase(),
        parent: '',
      });
    if (car.paperwork)
      tags.push({
        category: 'paperwork',
        value: car.paperwork.trim().toUpperCase(),
        parent: '',
      });

    // 2. Dependent Tags
    const modelParent = car.model ? car.model.trim().toUpperCase() : '';

    // Model depends on Make
    if (car.model && car.make) {
      tags.push({
        category: 'model',
        value: car.model.trim().toUpperCase(),
        parent: car.make.trim().toUpperCase(),
      });
    }

    // Trim depends on Model
    if (car.trim && car.model) {
      tags.push({
        category: 'trim',
        value: car.trim.trim().toUpperCase(),
        parent: modelParent,
      });
    }

    // ChassisCode depends on Model
    if (car.chassisCode && car.model) {
      tags.push({
        category: 'chassisCode',
        value: car.chassisCode.trim().toUpperCase(),
        parent: modelParent,
      });
    }

    // EngineCode depends on Model
    if (car.engineCode && car.model) {
      tags.push({
        category: 'engineCode',
        value: car.engineCode.trim().toUpperCase(),
        parent: modelParent,
      });
    }

    // Mods - categorizing into specific types AND linking to Model
    if (car.mods && car.model) {
      // Helper to add mod tags with Model as parent
      const addModTags = (items: string[], type: string) => {
        if (Array.isArray(items)) {
          items.forEach((mod) => {
            if (mod && mod.trim()) {
              tags.push({
                category: `mods_${type}`,
                value: mod.trim().toUpperCase(),
                parent: modelParent,
              });
            }
          });
        }
      };

      if (typeof car.mods === 'object' && !Array.isArray(car.mods)) {
        const modsObj = car.mods;
        if (modsObj.exterior) addModTags(modsObj.exterior, 'exterior');
        if (modsObj.interior) addModTags(modsObj.interior, 'interior');
        if (modsObj.engine) addModTags(modsObj.engine, 'engine');
        if (modsObj.footwork) addModTags(modsObj.footwork, 'footwork');
      }
    }

    // Trim depends on Model
    if (car.trim && car.model) {
      tags.push({
        category: 'trim',
        value: car.trim.trim().toUpperCase(),
        parent: car.model.trim().toUpperCase(),
      });
    }

    // ChassisCode depends on Model
    if (car.chassisCode && car.model) {
      tags.push({
        category: 'chassisCode',
        value: car.chassisCode.trim().toUpperCase(),
        parent: car.model.trim().toUpperCase(),
      });
    }

    // EngineCode depends on Model
    if (car.engineCode && car.model) {
      tags.push({
        category: 'engineCode',
        value: car.engineCode.trim().toUpperCase(),
        parent: car.model.trim().toUpperCase(),
      });
    }

    // Mods - categorizing into specific types
    if (car.mods) {
      // Helper to add mod tags
      const addModTags = (items: string[], type: string) => {
        if (Array.isArray(items)) {
          items.forEach((mod) => {
            if (mod && mod.trim()) {
              tags.push({
                category: `mods_${type}`,
                value: mod.trim().toUpperCase(),
                parent: '',
              });
            }
          });
        }
      };

      // Assuming car.mods respects the CarMods interface structure
      if (typeof car.mods === 'object' && !Array.isArray(car.mods)) {
        // We trust the structure matches { exterior: [], interior: [], engine: [], footwork: [] }
        // but we should be safe
        const modsObj = car.mods;
        if (modsObj.exterior) addModTags(modsObj.exterior, 'exterior');
        if (modsObj.interior) addModTags(modsObj.interior, 'interior');
        if (modsObj.engine) addModTags(modsObj.engine, 'engine');
        if (modsObj.footwork) addModTags(modsObj.footwork, 'footwork');
      } else if (Array.isArray(car.mods)) {
        // Legacy or flat array support - dump into 'mods_exterior' as fallback or keep generic 'mods'?
        // Let's stick to generic 'mods' for flat arrays just in case, or map to 'mods_other'
        // For now, let's just ignore or put in 'mods_exterior' to be visible
        car.mods.forEach((mod: any) => {
          // Legacy, maybe not used anymore with new structure
        });
      }
    }

    if (car.notableFeatures && Array.isArray(car.notableFeatures)) {
      car.notableFeatures.forEach((feature) => {
        if (feature && feature.trim()) {
          tags.push({
            category: 'feature',
            value: feature.trim().toUpperCase(),
            parent: '',
          });
        }
      });
    }

    // Sync each tag
    for (const { category, value, parent } of tags) {
      await this.updateTagUsage(category, value, parent || '', increment);
    }
  }

  /**
   * Update the usage count for a specific tag
   */
  private async updateTagUsage(
    category: string,
    value: string,
    parent: string,
    increment: boolean,
  ): Promise<void> {
    let tag = await this.tagsRepository.findOne({
      where: { category, value, parent },
    });

    if (!tag) {
      // Create new tag if it doesn't exist
      tag = this.tagsRepository.create({
        category,
        value,
        parent,
        usageCount: 0,
      });
    }

    if (increment) {
      tag.usageCount += 1;
    } else {
      tag.usageCount = Math.max(0, tag.usageCount - 1);
    }

    await this.tagsRepository.save(tag);
  }

  /**
   * Get all tags with usageCount > 0, grouped by category
   */
  async getActiveTags(): Promise<Record<string, string[]>> {
    const tags = await this.tagsRepository.find({
      where: { usageCount: MoreThan(0) },
      order: { value: 'ASC' },
    });

    const grouped: Record<string, string[]> = {
      make: [],
      model: [],
      trim: [],
      year: [],
      chassisCode: [],
      engineCode: [],
      transmission: [],
      drivetrain: [],
      condition: [],
      paperwork: [],
      location: [],
      feature: [], // Notable features
      mods: [],
      mods_exterior: [],
      mods_interior: [],
      mods_engine: [],
      mods_footwork: [],
    };

    for (const tag of tags) {
      if (grouped[tag.category]) {
        grouped[tag.category].push(tag.value);
      }
    }

    return grouped;
  }

  /**
   * Get all tags (for admin purposes)
   */
  async getAllTags(): Promise<Tag[]> {
    return this.tagsRepository.find({
      order: { category: 'ASC', value: 'ASC' },
    });
  }

  /**
   * Get all tags stats for admin page - shows ALL tags with usageCount
   */
  async getAllTagsStats(): Promise<
    { category: string; items: { tag: string; count: number }[] }[]
  > {
    const tags = await this.tagsRepository.find({ order: { value: 'ASC' } });

    const categoryMap: Record<string, string> = {
      make: 'Hãng xe',
      model: 'Dòng xe',
      trim: 'Phiên bản',
      year: 'Năm sản xuất',
      chassisCode: 'Mã khung gầm',
      engineCode: 'Mã động cơ',
      transmission: 'Hộp số',
      drivetrain: 'Hệ dẫn động',
      condition: 'Tình trạng',
      paperwork: 'Loại giấy tờ',
      location: 'Khu vực',
      feature: 'Ngoại hình chú ý',
      mods_exterior: 'Mods: Ngoại thất',
      mods_interior: 'Mods: Nội thất',
      mods_engine: 'Mods: Hiệu suất & Máy',
      mods_footwork: 'Mods: Gầm & Bánh',
    };

    const grouped: Record<string, { tag: string; count: number }[]> = {};

    for (const tag of tags) {
      // Explicitly hide generic 'mods' category as requested
      if (tag.category === 'mods') continue;

      // Use internal category key
      const categoryKey = tag.category;

      if (!grouped[categoryKey]) {
        grouped[categoryKey] = [];
      }

      // Check if tag already exists in this category
      const existingItem = grouped[categoryKey].find(
        (item) => item.tag === tag.value,
      );
      if (existingItem) {
        existingItem.count += tag.usageCount;
      } else {
        grouped[categoryKey].push({ tag: tag.value, count: tag.usageCount });
      }
    }

    // Sort by count descending within each category
    return Object.entries(grouped)
      .map(([category, items]) => ({
        category,
        items: items.sort((a, b) => b.count - a.count),
      }))
      .filter((cat) => cat.items.length > 0);
  }

  /**
   * Get suggestions for a specific category (for autocomplete - returns ALL tags regardless of usageCount)
   * Optional parent filter (e.g. get models for make 'Toyota')
   */
  async getSuggestions(category: string, parent?: string): Promise<string[]> {
    const whereClause: any = { category };
    if (parent) {
      // Use case-insensitive matching for parent if possible, or ensure it's uppercased
      whereClause.parent = parent.trim().toUpperCase();
    }

    const tags = await this.tagsRepository.find({
      where: whereClause,
      order: { usageCount: 'DESC', value: 'ASC' }, // Active tags first
    });
    return tags.map((t) => t.value);
  }

  /**
   * Get all suggestions grouped by category (for sell/edit pages)
   */
  async getAllSuggestions(): Promise<Record<string, string[]>> {
    const tags = await this.tagsRepository.find({
      order: { usageCount: 'DESC', value: 'ASC' },
    });

    const grouped: Record<string, string[]> = {
      make: [],
      model: [],
      trim: [],
      year: [],
      chassisCode: [],
      engineCode: [],
      transmission: [],
      drivetrain: [],
      condition: [],
      paperwork: [],
      location: [],
      mods: [],
      mods_exterior: [],
      mods_interior: [],
      mods_engine: [],
      mods_footwork: [],
    };

    for (const tag of tags) {
      if (grouped[tag.category]) {
        grouped[tag.category].push(tag.value);
      }
    }

    return grouped;
  }
  async deleteTagByValue(value: string): Promise<void> {
    const capsValue = value.trim().toUpperCase();
    await this.tagsRepository.delete({ value: capsValue });
  }
}
