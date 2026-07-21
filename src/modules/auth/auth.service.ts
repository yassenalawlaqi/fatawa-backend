import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(username: string, pass: string) {
    // In a real app, validate against a DB of admin users
    if (username === 'admin' && pass === 'admin123') {
      const payload = { username, sub: 'admin-id', roles: ['admin'] };
      return {
        access_token: this.jwtService.sign(payload),
      };
    }
    throw new UnauthorizedException('Invalid credentials');
  }
}
