import { startOfHour, isBefore, getHours, format } from 'date-fns';
import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import INotificationsRepository from '@modules/notifications/repositories/INotificationsRepository';
import ICacheProvider from '@shared/container/providers/CacheProvider/models/ICacheProvider';
import Appointment from '../infra/typeorm/entities/Appointment';
import IAppointmentsRepository from '../repositories/IAppointmentsRepository';

interface IRequestDTO {
  providerId: string;
  date: Date;
  userId: string;
}

@injectable()
class CreateAppointmentService {
  constructor(
    @inject('AppointmentsRepository')
    private appointmentsRepository: IAppointmentsRepository,

    @inject('NotificationsRepository')
    private notificationsRepository: INotificationsRepository,

    @inject('CacheProvider')
    private cacheProvider: ICacheProvider,
  ) {}

  public async execute({
    providerId,
    date,
    userId,
  }: IRequestDTO): Promise<Appointment> {
    const appointmentDate = startOfHour(date);
    const dateNow = Date.now();
    if (isBefore(appointmentDate, dateNow)) {
      throw new AppError("Can't create an appointment on a past date");
    }

    if (userId === providerId) {
      throw new AppError("Can't create an appointment with yourself");
    }

    if (getHours(appointmentDate) < 8 || getHours(appointmentDate) > 17) {
      throw new AppError(
        'You can only create appointments between 8am and 5pm',
      );
    }

    const findAppointmentInSameDate = await this.appointmentsRepository.findByDate(
      appointmentDate,
      providerId,
    );

    if (findAppointmentInSameDate) {
      throw new AppError('This appointment is already booked');
    }

    const appointment = await this.appointmentsRepository.create({
      providerId,
      date: appointmentDate,
      userId,
    });

    const formattedDate = format(appointmentDate, "dd/MM/yyyy 'às' HH:mm");

    await this.notificationsRepository.create({
      recipientId: providerId,
      content: `Novo agendamento ${formattedDate}`,
    });

    await this.cacheProvider.invalidate(
      `provider-appointments:${format(appointmentDate, 'yyyy-M-d')}`,
    );

    return appointment;
  }
}

export default CreateAppointmentService;
