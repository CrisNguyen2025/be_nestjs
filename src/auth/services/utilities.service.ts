import { Injectable } from '@nestjs/common';
import { ResponseHelper } from 'src/common/helpers/response.helper';
import { CheckEmailResponseDto } from '../dto/check-email.dto';
import { AuthRepository } from '../repositories/auth.repository';

@Injectable()
export class UtilitiesService {
  constructor(private readonly authRepo: AuthRepository) {}

  async checkEmail(email: string) {
    const user = await this.authRepo.findByEmail(email);

    const response: CheckEmailResponseDto = {
      message: user ? 'Email exists' : 'Email available',
      value: user ? 1 : 0,
    };

    return ResponseHelper.success(response);
  }
}
