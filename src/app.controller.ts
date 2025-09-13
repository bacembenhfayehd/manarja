import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { CurrentUser } from './auth/decorators/current-user.decorators';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

   
  @UseGuards(JwtAuthGuard)
  @Get('protected')
  getProtectedRoute(@CurrentUser() user: any) {
    return {
      message: 'Vous êtes authentifié !',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}



