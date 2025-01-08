import {
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
  InsertEvent,
} from 'typeorm';
import { Impersonation } from '../../impersonation/entities/impersonation.entity';
@EventSubscriber()
export class ImpersonationSubscriber
  implements EntitySubscriberInterface<Impersonation>
{
  // Listen to changes in the Impersonation entity
  listenTo() {
    return Impersonation;
  }

  /**
   * Set default values before inserting a new impersonation record.
   * This can handle setting the exchangeBefore duration automatically.
   */
  beforeInsert(event: InsertEvent<Impersonation>) {
    event.entity.exchangeBefore = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes expiration
  }

  /**
   * Handle marking an impersonation as used.
   * This is used when `markUsed()` is called externally.
   */
  beforeUpdate(event: UpdateEvent<Impersonation>) {
    if (event.entity?.used) {
      console.log(`Marking Impersonation ID ${event.entity.id} as used.`);
    }
  }
}
