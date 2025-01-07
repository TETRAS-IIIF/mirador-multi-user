import { Policy } from '../interface/policy.interface';

export class DeleteResourcePolicy implements Policy {
  constructor(
    private readonly user: any,
    private readonly resource: any,
  ) {}

  actionAllowed(): boolean {
    // Only allow deleting a resource if the user owns it or is an admin
    return this.user.id === this.resource.ownerId;
  }
}
