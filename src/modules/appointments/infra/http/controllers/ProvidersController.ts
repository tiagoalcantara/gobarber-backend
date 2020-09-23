import ListProvidersService from '@modules/appointments/services/ListProvidersService';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

export default class AppointmentsController {
  public async index(request: Request, response: Response): Promise<Response> {
    const userId = request.user.id;

    const listProviders = container.resolve(ListProvidersService);

    const providers = await listProviders.execute({ userId });

    return response.json(providers);
  }
}
