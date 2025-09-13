import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '../dto/update-subscription.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/user/enums/user-role.enum';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';
import { SubscriptionResponseDto } from '../dto/subscription-response.dto';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @Roles(UserRole.USER, UserRole.PRO, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ 
    status: 201, 
    description: 'Subscription created', 
    type: SubscriptionResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @Req() req: RequestWithUser,
  ) {
    // Ensure the user can only create subscriptions for themselves unless admin
    if (req.user.role !== UserRole.ADMIN) {
      createSubscriptionDto.userId = req.user.id;
    }

    return this.subscriptionService.createSubscription(createSubscriptionDto);
  }

  @Get(':id')
  @Roles(UserRole.USER, UserRole.PRO, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription found', 
    type: SubscriptionResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSubscription(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    const subscription = await this.subscriptionService.getSubscription(id);

    // Ensure the user can only access their own subscriptions unless admin
    if (req.user.role !== UserRole.ADMIN && subscription.userId !== req.user.id) {
      throw new Error('Unauthorized');
    }

    return subscription;
  }

  @Get()
  @Roles(UserRole.USER, UserRole.PRO, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get subscriptions for a user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscriptions retrieved', 
    type: [SubscriptionResponseDto] 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserSubscriptions(
    @Query('userId') userId: string,
    @Req() req: RequestWithUser,
  ) {
    // Non-admin users can only access their own subscriptions
    if (req.user.role !== UserRole.ADMIN) {
      userId = req.user.id;
    }

    return this.subscriptionService.getUserSubscriptions(userId);
  }

  @Put(':id')
  @Roles(UserRole.USER, UserRole.PRO, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a subscription' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription updated', 
    type: SubscriptionResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateSubscription(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @Req() req: RequestWithUser,
  ) {
    const subscription = await this.subscriptionService.getSubscription(id);

    // Ensure the user can only update their own subscriptions unless admin
    if (req.user.role !== UserRole.ADMIN && subscription.userId !== req.user.id) {
      throw new Error('Unauthorized');
    }

    return this.subscriptionService.updateSubscription(id, updateSubscriptionDto);
  }

  @Delete(':id')
  @Roles(UserRole.USER, UserRole.PRO, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription canceled', 
    type: SubscriptionResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancelSubscription(
    @Param('id') id: string,
    @Query('cancelAtPeriodEnd') cancelAtPeriodEnd: boolean = true,
    @Req() req: RequestWithUser,
  ) {
    const subscription = await this.subscriptionService.getSubscription(id);

    // Ensure the user can only cancel their own subscriptions unless admin
    if (req.user.role !== UserRole.ADMIN && subscription.userId !== req.user.id) {
      throw new Error('Unauthorized');
    }

    return this.subscriptionService.cancelSubscription(id, cancelAtPeriodEnd);
  }
}