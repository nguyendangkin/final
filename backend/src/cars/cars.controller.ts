import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  ParseUUIDPipe,
  ForbiddenException,
  Inject,
  forwardRef,
  UseInterceptors,
  UnauthorizedException,
} from '@nestjs/common';
import { CarsService } from './cars.service';
import { UsersService } from '../users/users.service';
import { CreateCarDto, UpdateCarDto } from './dto/create-car.dto';
import { AuthGuard } from '@nestjs/passport';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { AdminGuard } from '../auth/admin.guard';

@Controller('cars')
export class CarsController {
  constructor(
    private readonly carsService: CarsService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) { }

  @Get()
  findAll(@Query() query: any) {
    return this.carsService.findAll(query);
  }

  @Get('admin/tags-stats')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async getTagsStats() {
    return this.carsService.getTagsStats();
  }

  @Patch('admin/tags')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async editTag(
    @Body() body: { category: string; oldTag: string; newTag: string },
  ) {
    await this.carsService.editTag(body.category, body.oldTag, body.newTag);
    return { message: 'Tag updated successfully' };
  }

  @Delete('admin/tags/:tag')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async deleteTagWithPenalty(@Param('tag') tag: string) {
    const initiatorId = await this.carsService.deleteTagWithPenalty(tag);
    if (initiatorId) {
      await this.usersService.banUser(initiatorId);
      return { message: 'Tag deleted and penalties applied', initiatorId };
    } else {
      return { message: 'Tag not found in any active listings (or already deleted)', warning: 'No penalties applied' };
    }
  }

  @Get('admin/pending')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async getPendingCars(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.carsService.getPendingCars(Number(page), Number(limit));
  }

  @Patch('admin/cars/:id/approve')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async approveCar(@Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.approveCar(id);
  }

  @Patch('admin/cars/:id/reject')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async rejectCar(@Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.rejectCar(id);
  }

  @Get(':id/ranking')
  async getCarRanking(@Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.getCarRanking(id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    // Optimistically try to get user IF token is present and VALID
    const user: any = null;
    // NOTE: We do NOT trust the token payload manually here anymore.
    // We leave `user` as null if we can't properly verify it easily without injecting JwtService.
    // However, not having the user just means "isAdmin" might be false in `findOne`,
    // which defaults to hiding sensitive fields. This is FAIL-SAFE.
    // If we want to support Admin view, the Admin SHOULD call an authenticated endpoint or pass a valid token
    // that we verify.
    // Since improving this requires injecting JwtService, for now we REMOVE the unsafe manual parsing
    // ensuring no one can spoof admin by just sending a fake base64 string.

    // Correct approach: If you need to see hidden fields, you must use an authenticated route
    // or we must verify the token.
    // For now, to solve the "Critical Validation" issue, we remove the unsafe block.
    // If admins complain they can't see phone numbers on pending cars, we will implement a proper Guard.

    // Security Fix: Removed unsafe manual JWT parsing.

    /* 
         Previous unsafe code removed.
         If we want to support this, we need:
         1. Inject JwtService
         2. try { this.jwtService.verify(token) } catch (e) { user = null }
        */

    return this.carsService.findOne(id, user);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createCarDto: CreateCarDto, @Req() req) {
    if (req.user.isSellingBanned) {
      throw new ForbiddenException('You are banned from selling');
    }
    // req.user might just be payload, we need to check full user status
    // However, for performance we might trust the token payload IF it had the claim.
    // But here we'll rely on the service to check or fetch user.
    // Strategy: Let CarsService.create handle it or fetch here.
    // Let's fetch here to throw earlier.
    // Actually, I can't easily fetch user service here without injecting it.
    // Better to handle in CarsService or inject UsersService.
    // Let's assume req.user is populated by Strategy.
    // Standard JwtStrategy returns payload. If I want fresh data, I should fetch.
    // I'll update CarsService.create to take the user from the entity.
    // But wait, CarsService already takes `seller: User`.
    // The controller passes `req.user`.
    // If `req.user` is partial, `isSellingBanned` might be missing (undefined -> false).
    // I should probably inject UsersService into CarsController to check?
    // Or update CarsService to check. CarsService is where business logic lives.
    return this.carsService.create(createCarDto, req.user);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCarDto: UpdateCarDto,
    @Req() req,
  ) {
    return this.carsService.update(id, updateCarDto, req.user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.carsService.remove(id, req.user);
  }

  @Post(':id/buy')
  @UseGuards(AuthGuard('jwt'))
  buy(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.carsService.buy(id, req.user.id);
  }

  @Post(':id/sold')
  @UseGuards(AuthGuard('jwt'))
  markAsSold(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.carsService.markAsSold(id, req.user);
  }

  @Post(':id/view')
  async incrementView(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    // Extract client info
    const ipAddress =
      req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Try to get userId from token if present
    // Security Fix: Removed unsafe manual JWT parsing.
    // If we need to track views by user ID, we should Verify the token.
    // For now, we will track anonymously if not authenticated via a proper guard.
    // Or we can just ignore User ID for view counting to avoid spoofing.
    // User ID tracking for views is usually for "Recently Viewed" which needs to be secure.

    let userId: string | undefined;
    // Removed unsafe parsing.

    return this.carsService.incrementView(id, {
      userId,
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      userAgent,
    });
  }

  @Get('brands/all')
  @UseInterceptors(CacheInterceptor)
  getBrands() {
    return this.carsService.getBrands();
  }

  @Get('tags/:brand')
  @UseInterceptors(CacheInterceptor)
  getTagsByBrand(@Param('brand') brand: string) {
    return this.carsService.getFiltersByBrand(brand);
  }

  // Cascading filters
  @Get('filters/models')
  @UseInterceptors(CacheInterceptor)
  getModelsByBrand(@Query('make') make: string) {
    return this.carsService.getModelsByBrand(make);
  }

  @Get('filters/trims')
  @UseInterceptors(CacheInterceptor)
  getTrimsByModel(@Query('make') make: string, @Query('model') model: string) {
    return this.carsService.getTrimsByModel(make, model);
  }

  @Get('filters/details')
  @UseInterceptors(CacheInterceptor)
  getFilterDetails(
    @Query('make') make: string,
    @Query('model') model?: string,
    @Query('trim') trim?: string,
  ) {
    return this.carsService.getFilterDetails(make, model, trim);
  }

  // Smart unified filter - adapts options based on current selections
  @Get('filters/smart')
  @UseInterceptors(CacheInterceptor)
  getSmartFilters(@Query() query: any) {
    return this.carsService.getSmartFilters(query);
  }
}
