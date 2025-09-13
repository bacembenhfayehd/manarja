import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { CreateRefundDto } from '../dto/create-refund.dto';
import { PaymentStatus } from '../enums/payment-status.enum';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/user/enums/user-role.enum';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { RefundResponseDto } from '../dto/refund-response.dto';
import { PaginatedPaymentsResponseDto } from '../dto/paginated-payments-response.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @Roles(UserRole.USER, UserRole.PRO, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created', type: PaymentResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: RequestWithUser,
  ) {
    // Ensure the user can only create payments for themselves unless admin
    if (req.user.role !== UserRole.ADMIN) {
      createPaymentDto.userId = req.user.id;
    }

    return this.paymentService.createPayment(createPaymentDto);
  }

  @Get(':id')
  @Roles(UserRole.USER, UserRole.PRO, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment found', type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPayment(@Param('id') id: string, @Req() req: RequestWithUser) {
    const payment = await this.paymentService.getPayment(id);

    // Ensure the user can only access their own payments unless admin
    if (req.user.role !== UserRole.ADMIN && payment.userId !== req.user.id) {
      throw new Error('Unauthorized');
    }

    return payment;
  }

  @Get()
  @Roles(UserRole.USER, UserRole.PRO, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get paginated list of payments for a user' })
  @ApiResponse({
    status: 200,
    description: 'Payments retrieved',
    type: PaginatedPaymentsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserPayments(
    @Query('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: RequestWithUser,
  ) {
    // Non-admin users can only access their own payments
    if (req.user.role !== UserRole.ADMIN) {
      userId = req.user.id;
    }

    return this.paymentService.getUserPayments(userId, page, limit);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN) // Only admin can manually update payment status
  @ApiOperation({ summary: 'Update payment status' })
  @ApiResponse({ status: 200, description: 'Payment status updated', type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body('status') status: PaymentStatus,
    @Body('providerData') providerData?: any,
  ) {
    return this.paymentService.updatePaymentStatus(id, status, providerData);
  }

  @Post('refunds')
  @Roles(UserRole.USER, UserRole.PRO, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a refund for a payment' })
  @ApiResponse({ status: 201, description: 'Refund created', type: RefundResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createRefund(
    @Body() createRefundDto: CreateRefundDto,
    @Req() req: RequestWithUser,
  ) {
    // Ensure the user can only create refunds for themselves unless admin
    if (req.user.role !== UserRole.ADMIN) {
      createRefundDto.userId = req.user.id;
    }

    return this.paymentService.createRefund(createRefundDto);
  }
}