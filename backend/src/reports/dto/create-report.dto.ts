import { IsEnum, IsUUID } from 'class-validator';
import { ReportReason } from '../entities/report.entity';

export class CreateReportDto {
  @IsUUID()
  carId: string;

  @IsEnum(ReportReason)
  reason: ReportReason;
}
