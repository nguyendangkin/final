import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateLocationDto {
  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isPublic?: boolean;
}
