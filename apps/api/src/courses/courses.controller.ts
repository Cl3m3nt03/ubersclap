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
  createCourseSchema,
  transitionCourseSchema,
  updateCourseSchema,
  type CourseStatus,
  type CreateCourseInput,
  type UpdateCourseInput,
} from '@ubersclap/shared';

import { CoursesService } from './courses.service';
import { CurrentDriverId } from '../auth/current-driver.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { IdempotencyInterceptor } from '../common/idempotency.interceptor';

@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  /**
   * ADR-010 : une seule route pour toutes les plages de dates.
   *
   * Les trois endpoints /planning/day, /week et /month de la doc d'origine
   * etaient trois fois le meme code.
   */
  @Get()
  list(
    @CurrentDriverId() driverId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: CourseStatus,
  ) {
    return this.courses.list(driverId, { from, to, status });
  }

  @Get(':id')
  findOne(
    @CurrentDriverId() driverId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.courses.findOne(driverId, id);
  }

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  create(@CurrentDriverId() driverId: string, @Body(new ZodValidationPipe(createCourseSchema)) input: CreateCourseInput) {
    return this.courses.create(driverId, input);
  }

  @Patch(':id')
  update(
    @CurrentDriverId() driverId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateCourseSchema)) patch: UpdateCourseInput,
  ) {
    return this.courses.update(driverId, id, patch);
  }

  /**
   * POST /transitions, et non PATCH /status.
   *
   * Un changement de statut n'est pas l'ecriture d'un champ : c'est une
   * transition validee par la machine a etats. `PATCH` suggererait qu'on peut
   * y ecrire n'importe quelle valeur.
   */
  @Post(':id/transitions')
  @HttpCode(200)
  transition(
    @CurrentDriverId() driverId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(transitionCourseSchema)) input: { to: CourseStatus; finalPriceInclTaxCents?: number },
  ) {
    return this.courses.transition(
      driverId,
      id,
      input.to,
      input.finalPriceInclTaxCents,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentDriverId() driverId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.courses.remove(driverId, id);
  }
}
