import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsTimeZone,
  IsEmail,
  IsUrl,
  Matches,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateBoxDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/[\s()-]/g, '') || null : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(254)
  @Matches(/^\+?[1-9]\d{6,14}$/)
  whatsapp?: string | null;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/[\s()-]/g, '') || null : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(254)
  @Matches(/^\+?[1-9]\d{6,14}$/)
  phone?: string | null;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(254)
  @IsEmail()
  email?: string | null;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(254)
  @Matches(
    /^(?:@?[A-Za-z0-9._]{1,30}|https:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._]{1,30}\/?)$/,
  )
  instagram?: string | null;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(254)
  @IsUrl({
    protocols: ['https', 'http'],
    require_protocol: true,
    disallow_auth: true,
  })
  website?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || 'UTC' : value,
  )
  @IsTimeZone()
  @MaxLength(80)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoPath?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImagePath?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  supportContact?: string | null;

  @IsOptional()
  @IsString()
  organizationId?: string | null;
}
