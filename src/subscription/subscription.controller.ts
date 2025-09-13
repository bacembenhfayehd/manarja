// subscription.controller.ts
import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorators';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('current')
  async getCurrentSubscription(@CurrentUser() user: any) {
    return this.subscriptionService.getCurrentSubscription(user.id);
  }

  @Get('plans')
  async getPlans() {
    return this.subscriptionService.getActivePlans();
  }

  @Post()
  async createSubscription(
    @CurrentUser() user: any,
    @Body() createSubscriptionDto: CreateSubscriptionDto
  ) {
    return this.subscriptionService.createSubscription(user.id, createSubscriptionDto);
  }

  @Put(':id')
  async updateSubscription(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto
  ) {
    return this.subscriptionService.updateSubscription(id, updateSubscriptionDto);
  }

  @Put(':id/cancel')
  async cancelSubscription(@Param('id') id: string) {
    return this.subscriptionService.cancelSubscription(id);
  }

  @Get(':id/usage')
  async getUsage(@Param('id') id: string) {
    return this.subscriptionService.getSubscriptionUsage(id);
  }
}