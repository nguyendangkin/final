import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, ParseUUIDPipe, ForbiddenException } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CreateCarDto, UpdateCarDto } from './dto/create-car.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('cars')
export class CarsController {
    constructor(private readonly carsService: CarsService) { }

    @Get()
    findAll(@Query() query: any) {
        return this.carsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.carsService.findOne(id);
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
    update(@Param('id', ParseUUIDPipe) id: string, @Body() updateCarDto: UpdateCarDto, @Req() req) {
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

    @Get('brands/all')
    getBrands() {
        return this.carsService.getBrands();
    }

    @Get('tags/:brand')
    getTagsByBrand(@Param('brand') brand: string) {
        return this.carsService.getFiltersByBrand(brand);
    }

    // Cascading filters
    @Get('filters/models')
    getModelsByBrand(@Query('make') make: string) {
        return this.carsService.getModelsByBrand(make);
    }

    @Get('filters/trims')
    getTrimsByModel(@Query('make') make: string, @Query('model') model: string) {
        return this.carsService.getTrimsByModel(make, model);
    }

    @Get('filters/details')
    getFilterDetails(
        @Query('make') make: string,
        @Query('model') model?: string,
        @Query('trim') trim?: string,
    ) {
        return this.carsService.getFilterDetails(make, model, trim);
    }

    // Smart unified filter - adapts options based on current selections
    @Get('filters/smart')
    getSmartFilters(@Query() query: any) {
        return this.carsService.getSmartFilters(query);
    }
}
