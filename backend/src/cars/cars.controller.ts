import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, ParseUUIDPipe } from '@nestjs/common';
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
        return this.carsService.create(createCarDto, req.user); // req.user comes from JwtStrategy
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
}
