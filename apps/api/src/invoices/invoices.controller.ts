import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  createInvoiceSchema,
  type CreateInvoiceInput,
  type InvoiceStatus,
} from '@ubersclap/shared';

import { InvoicesService } from './invoices.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { CurrentDriverId } from '../auth/current-driver.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { IdempotencyInterceptor } from '../common/idempotency.interceptor';

@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoices: InvoicesService,
    private readonly pdf: InvoicePdfService,
  ) {}

  @Get()
  list(
    @CurrentDriverId() driverId: string,
    @Query('status') status?: InvoiceStatus,
  ) {
    return this.invoices.list(driverId, { status });
  }

  /**
   * Declaree avant `:id` : sinon « billable-courses » serait pris pour un
   * identifiant et rejete par ParseUUIDPipe.
   */
  @Get('billable-courses')
  billableCourses(
    @CurrentDriverId() driverId: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.invoices.listBillableCourses(driverId, clientId);
  }

  @Get(':id')
  findOne(
    @CurrentDriverId() driverId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoices.findOne(driverId, id);
  }

  /**
   * Le PDF est un flux binaire, pas du JSON : on prend la main sur la reponse
   * Express pour poser les bons en-tetes. `inline` plutot que `attachment` —
   * le mobile veut d'abord l'afficher, puis decider de le partager.
   */
  @Get(':id/pdf')
  async downloadPdf(
    @CurrentDriverId() driverId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { invoice, lines } = await this.invoices.findRowWithLines(driverId, id);
    const bytes = await this.pdf.generate(invoice, lines);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="facture-${invoice.invoiceNumber}.pdf"`,
    );
    res.end(Buffer.from(bytes));
  }

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  create(
    @CurrentDriverId() driverId: string,
    @Body(new ZodValidationPipe(createInvoiceSchema)) input: CreateInvoiceInput,
  ) {
    return this.invoices.create(driverId, input);
  }
}
