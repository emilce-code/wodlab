import { IsBooleanString, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindMovementsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  measurementType?: string;

  @IsOptional()
  @IsBooleanString()
  foundational?: string;

  @IsOptional()
  @IsIn(['all', 'mine', 'global', 'box', 'personal'])
  scope?: 'all' | 'mine' | 'global' | 'box' | 'personal';
}
