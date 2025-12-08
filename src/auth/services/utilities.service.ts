import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';

@Injectable()
export class UtilitiesService {
  constructor(private readonly authRepo: AuthRepository) {}

  async checkEmail(email: string): Promise<{ message: string; value: number }> {
    const user = await this.authRepo.findByEmail(email);
    return {
      message: user ? 'Email exists' : 'Email available',
      value: user ? 1 : 0,
    };
  }
}
