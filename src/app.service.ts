import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'API Houzz Pro Backend v1.0.0 - Endpoints: /auth, /protected';
  }
}