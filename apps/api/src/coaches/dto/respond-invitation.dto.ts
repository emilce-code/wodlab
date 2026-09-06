import { IsIn } from 'class-validator';

export class RespondInvitationDto {
  @IsIn(['ACCEPT', 'DECLINE'])
  response: 'ACCEPT' | 'DECLINE';
}
