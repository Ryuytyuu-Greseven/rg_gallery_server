import { Controller, Scope } from '@nestjs/common';
import { AppService } from './app.service';

@Controller({ scope: Scope.REQUEST })
export class AppController {
  constructor(private readonly appService: AppService) {}
}
