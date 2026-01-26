import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  Max,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CarStatus } from '../entities/car.entity';

/**
 * Interface for car modifications organized by category
 */
export interface CarMods {
  exterior?: string[];
  interior?: string[];
  engine?: string[];
  footwork?: string[];
}

/**
 * DTO for car modifications
 */
export class CarModsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exterior?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interior?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  engine?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  footwork?: string[];
}

export class CreateCarDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  make: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  model: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'Năm sản xuất không hợp lệ' })
  @Max(9999, { message: 'Năm sản xuất không hợp lệ' })
  year: number;

  @IsString()
  @IsOptional()
  trim?: string;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsBoolean()
  @IsOptional()
  isNegotiable?: boolean;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000, { message: 'Mô tả quá dài (tối đa 5000 ký tự)' })
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsString()
  @IsOptional()
  videoLink?: string;

  @IsNumber()
  @Type(() => Number)
  @Max(2000000000, { message: 'Số km quá lớn (tối đa 2 tỷ)' })
  mileage: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  location: string;

  // JDM Specs
  @IsString()
  @IsOptional()
  chassisCode?: string;

  @IsString()
  @IsOptional()
  engineCode?: string;

  @IsString()
  @IsOptional()
  transmission?: string;

  @IsString()
  @IsOptional()
  drivetrain?: string;

  @IsString()
  @IsOptional()
  condition?: string;

  // Legal
  @IsString()
  @IsOptional()
  paperwork?: string;

  @IsString()
  @IsOptional()
  registryExpiry?: string;

  @IsBoolean()
  @IsOptional()
  noRegistry?: boolean;

  @IsString()
  @IsOptional()
  plateNumber?: string;

  // Mods organized by category
  @IsOptional()
  @ValidateNested()
  @Type(() => CarModsDto)
  mods?: CarMods;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  notableFeatures?: string[];

  // Contact & Details
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  facebookLink?: string;

  @IsString()
  @IsOptional()
  zaloLink?: string;

  @IsString()
  @IsOptional()
  additionalInfo?: string;
}

export class UpdateCarDto {
  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'Năm sản xuất không hợp lệ' })
  @Max(9999, { message: 'Năm sản xuất không hợp lệ' })
  year?: number;

  @IsOptional()
  @IsString()
  trim?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  videoLink?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  mileage?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  chassisCode?: string;

  @IsOptional()
  @IsString()
  engineCode?: string;

  @IsOptional()
  @IsString()
  transmission?: string;

  @IsOptional()
  @IsString()
  drivetrain?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  paperwork?: string;

  @IsOptional()
  @IsString()
  registryExpiry?: string;

  @IsOptional()
  @IsBoolean()
  noRegistry?: boolean;

  @IsOptional()
  @IsString()
  plateNumber?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CarModsDto)
  mods?: CarMods;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notableFeatures?: string[];

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  facebookLink?: string;

  @IsOptional()
  @IsString()
  zaloLink?: string;

  @IsOptional()
  @IsString()
  additionalInfo?: string;

  @IsOptional()
  @IsEnum(CarStatus)
  status?: CarStatus;
}
