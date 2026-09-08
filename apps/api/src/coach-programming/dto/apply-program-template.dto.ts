import { IsString, Matches } from 'class-validator';

export class ApplyProgramTemplateDto {
  @IsString()
  groupId: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  weekStart: string;
}
