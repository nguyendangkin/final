import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { CarStatus } from '../entities/car.entity';

export class CreateCarDto {
    @IsString()
    @IsNotEmpty()
    make: string;

    @IsString()
    @IsNotEmpty()
    model: string;

    @IsNumber()
    @Type(() => Number)
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
    mileage: number;

    @IsString()
    @IsNotEmpty()
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

    // Mods can be complex object, allow any for now or specific structure
    @IsOptional()
    mods?: any;

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
    mods?: any;

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
