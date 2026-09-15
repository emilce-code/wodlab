import { IsBooleanString, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindWorkoutsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBooleanString()
  benchmark?: string;

  @IsOptional()
  @IsIn(['all', 'mine', 'global', 'box', 'personal'])
  scope?: 'all' | 'mine' | 'global' | 'box' | 'personal';
}
