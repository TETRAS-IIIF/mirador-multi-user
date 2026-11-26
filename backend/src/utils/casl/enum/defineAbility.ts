import { defineAbility } from '@casl/ability';

export default (user) =>
  defineAbility((can) => {
    can('delete', 'Project', { ownerId: user.sub });
  });
