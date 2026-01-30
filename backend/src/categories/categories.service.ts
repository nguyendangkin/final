import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(
    userId: string,
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      userId,
    });
    return this.categoryRepository.save(category);
  }

  async findAll(userId: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { userId },
      relations: ['parent', 'children'],
      order: { name: 'ASC' },
    });
  }

  async findTree(userId: string): Promise<Category[]> {
    // Get root categories (no parent)
    const roots = await this.categoryRepository.find({
      where: { userId, parentId: IsNull() },
      relations: ['children'],
      order: { name: 'ASC' },
    });

    // Recursively load children
    for (const root of roots) {
      await this.loadChildren(root);
    }

    return roots;
  }

  private async loadChildren(category: Category): Promise<void> {
    category.children = await this.categoryRepository.find({
      where: { parentId: category.id },
      order: { name: 'ASC' },
    });
    for (const child of category.children) {
      await this.loadChildren(child);
    }
  }

  async findOne(id: string, userId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, userId },
      relations: ['parent', 'children'],
    });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    return category;
  }

  async update(
    id: string,
    userId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id, userId);
    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string, userId: string): Promise<void> {
    const category = await this.findOne(id, userId);
    await this.categoryRepository.remove(category);
  }

  async countLocationsByCategory(
    userId: string,
  ): Promise<{ categoryId: string; count: number }[]> {
    interface CategoryCountRaw {
      categoryId: string;
      count: string;
    }
    const result: CategoryCountRaw[] = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('locations', 'location', 'location.categoryId = category.id')
      .where('category.userId = :userId', { userId })
      .select('category.id', 'categoryId')
      .addSelect('COUNT(location.id)', 'count')
      .groupBy('category.id')
      .getRawMany();
    return result.map((r) => ({
      categoryId: r.categoryId,
      count: parseInt(r.count, 10),
    }));
  }
}
