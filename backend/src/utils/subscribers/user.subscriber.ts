import {
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from 'typeorm';
import { User } from '../../BaseEntities/users/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }

  beforeUpdate(event: UpdateEvent<User>) {
    if (event.entity && '_isAdmin' in event.entity) {
      throw new UnauthorizedException('Admin field cannot be updated.');
    }
  }
}
