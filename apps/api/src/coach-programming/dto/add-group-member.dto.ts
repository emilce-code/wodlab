import { IsString } from 'class-validator';

export class AddGroupMemberDto {
  @IsString()
  athleteProfileId: string;
}
