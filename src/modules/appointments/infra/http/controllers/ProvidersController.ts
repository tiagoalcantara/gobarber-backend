import ListProvidersService from '@modules/appointments/services/ListProvidersService';
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { classToClass } from 'class-transformer';

export default class AppointmentsController {
  public async index(request: Request, response: Response): Promise<Response> {
    const userId = request.user.id;

    const listProviders = container.resolve(ListProvidersService);

    const providers = await listProviders.execute({ userId });

    return response.json(classToClass(providers));
  }
}
