import { IsIn, IsString } from 'class-validator';

export class UpdateAttendanceDto {
  @IsString()
  userId: string;

  @IsIn(['BOOKED', 'ATTENDED', 'CANCELLED'])
  status: 'BOOKED' | 'ATTENDED' | 'CANCELLED';
}
