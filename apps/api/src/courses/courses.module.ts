import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [ClientsModule],
  controllers: [CoursesController],
  providers: [CoursesService],
})
export class CoursesModule {}
