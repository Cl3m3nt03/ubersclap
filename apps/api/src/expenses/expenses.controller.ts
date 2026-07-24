import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  createExpenseSchema,
  updateExpenseSchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
} from '@ubersclap/shared';

import { ExpensesService } from './expenses.service';
import { CurrentDriverId } from '../auth/current-driver.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { IdempotencyInterceptor } from '../common/idempotency.interceptor';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  list(
    @CurrentDriverId() driverId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.expenses.list(driverId, { from, to, courseId });
  }

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  create(
    @CurrentDriverId() driverId: string,
    @Body(new ZodValidationPipe(createExpenseSchema)) input: CreateExpenseInput,
  ) {
    return this.expenses.create(driverId, input);
  }

  @Patch(':id')
  update(
    @CurrentDriverId() driverId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateExpenseSchema)) patch: UpdateExpenseInput,
  ) {
    return this.expenses.update(driverId, id, patch);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentDriverId() driverId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.expenses.remove(driverId, id);
  }
}
