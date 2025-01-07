import { Project } from '../../../BaseEntities/project/entities/project.entity';
import { User } from '../../../BaseEntities/users/entities/user.entity';
import { InferSubjects, PureAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Action } from '../enum/Action';

type Subjects = InferSubjects<typeof Project | typeof User> | 'all';
export type AppAbility = PureAbility<[Action, Subjects]>;
@Injectable()
export class CaslAbilityFactory {
  constructor() {}
}
