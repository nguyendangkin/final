import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { SoldCarsService } from './sold-cars.service';

@Controller('sold-cars')
export class SoldCarsController {
  constructor(private readonly soldCarsService: SoldCarsService) {}

  @Get('seller/:id')
  findAllBySeller(@Param('id', ParseUUIDPipe) id: string) {
    return this.soldCarsService.findAllBySeller(id);
  }
}
