import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ProvisionAuth0UserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName: string;
}
