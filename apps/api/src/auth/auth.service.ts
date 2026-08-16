import {
  GoneException,
  Injectable,
} from '@nestjs/common';

import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  register(
    _dto: RegisterDto,
  ) {
    throw new GoneException(
      'Password registration is no longer supported. Use Google Sign-In.',
    );
  }

  login(
    _dto: LoginDto,
  ) {
    throw new GoneException(
      'Password login is no longer supported. Use Google Sign-In.',
    );
  }
}