import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { FilterLocationDto } from './dto/filter-location.dto';
import { JwtAuthGuard, OptionalJwtAuthGuard, CurrentUser } from '../common';
import { User } from '../users/entities/user.entity';

const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, callback) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    callback(null, uniqueName);
  },
});

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', { storage }))
  create(
    @CurrentUser() user: User,
    @Body() createLocationDto: CreateLocationDto,
    @Body('isPublic') rawIsPublic: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // FIX: enableImplicitConversion converts string 'false' to boolean true
    // Use raw string value to correctly parse boolean from FormData
    if (rawIsPublic === 'true') {
      createLocationDto.isPublic = true;
    } else if (rawIsPublic === 'false') {
      createLocationDto.isPublic = false;
    }

    const imagePath = file ? `/uploads/${file.filename}` : undefined;
    return this.locationsService.create(user.id, createLocationDto, imagePath);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: User, @Query() filterDto: FilterLocationDto) {
    return this.locationsService.findAll(user.id, filterDto);
  }

  @Get('public')
  findPublic(@Query() filterDto: FilterLocationDto) {
    return this.locationsService.findPublic(undefined, filterDto);
  }

  @Get('user/:userId')
  @UseGuards(OptionalJwtAuthGuard)
  findByUser(
    @Param('userId') userId: string,
    @Query() filterDto: FilterLocationDto,
    @CurrentUser() currentUser?: User,
  ) {
    return this.locationsService.findByUser(userId, currentUser?.id, filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', { storage }))
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateLocationDto: UpdateLocationDto,
    @Body('isPublic') rawIsPublic: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // FIX: enableImplicitConversion converts string 'false' to boolean true
    // Use raw string value to correctly parse boolean from FormData
    if (rawIsPublic === 'true') {
      updateLocationDto.isPublic = true;
    } else if (rawIsPublic === 'false') {
      updateLocationDto.isPublic = false;
    }

    const imagePath = file ? `/uploads/${file.filename}` : undefined;
    return this.locationsService.update(
      id,
      user.id,
      updateLocationDto,
      imagePath,
    );
  }

  @Patch(':id/toggle-public')
  @UseGuards(JwtAuthGuard)
  togglePublic(@Param('id') id: string, @CurrentUser() user: User) {
    return this.locationsService.togglePublic(id, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.locationsService.remove(id, user.id);
  }
}
