import ICacheProvider from '@shared/container/providers/CacheProvider/models/ICacheProvider';
import { classToClass } from 'class-transformer';
import { inject, injectable } from 'tsyringe';
import Appointment from '../infra/typeorm/entities/Appointment';
import IAppointmentsRepository from '../repositories/IAppointmentsRepository';

interface IRequest {
  providerId: string;
  month: number;
  year: number;
  day: number;
}

@injectable()
class ListProviderAppointmentsService {
  constructor(
    @inject('AppointmentsRepository')
    private appointmentsRepository: IAppointmentsRepository,

    @inject('CacheProvider')
    private cacheProvider: ICacheProvider,
  ) {}

  public async execute({
    providerId,
    year,
    month,
    day,
  }: IRequest): Promise<Appointment[]> {
    let appointments = await this.cacheProvider.get<Appointment[]>(
      `provider-appointments:${providerId}:${year}-${month}-${day}`,
    );

    if (!appointments) {
      appointments = await this.appointmentsRepository.findAllInDayFromProvider(
        {
          providerId,
          year,
          month,
          day,
        },
      );

      await this.cacheProvider.save<Appointment[]>(
        `provider-appointments:${providerId}:${year}-${month}-${day}`,
        classToClass(appointments),
      );
    }

    return appointments;
  }
}

export default ListProviderAppointmentsService;
