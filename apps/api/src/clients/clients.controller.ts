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
import { createClientSchema, type CreateClientInput } from '@ubersclap/shared';

import { ClientsService } from './clients.service';
import { CurrentDriverId } from '../auth/current-driver.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { IdempotencyInterceptor } from '../common/idempotency.interceptor';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  list(@CurrentDriverId() driverId: string, @Query('search') search?: string) {
    return this.clients.list(driverId, search);
  }

  @Get(':id')
  findOne(
    @CurrentDriverId() driverId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clients.findOne(driverId, id);
  }

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  create(@CurrentDriverId() driverId: string, @Body(new ZodValidationPipe(createClientSchema)) input: CreateClientInput) {
    return this.clients.create(driverId, input);
  }

  @Patch(':id')
  update(
    @CurrentDriverId() driverId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() patch: Partial<CreateClientInput>,
  ) {
    return this.clients.update(driverId, id, patch);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentDriverId() driverId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clients.remove(driverId, id);
  }
}
