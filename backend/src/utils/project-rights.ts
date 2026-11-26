import { ForbiddenException } from '@nestjs/common';
import { GroupProjectRights } from '../enum/rights';
import { LinkGroupProjectService } from '../LinkModules/link-group-project/link-group-project.service';

export const READ_RIGHTS = [
  GroupProjectRights.READER,
  GroupProjectRights.EDITOR,
  GroupProjectRights.ADMIN,
];
export const WRITE_RIGHTS = [
  GroupProjectRights.EDITOR,
  GroupProjectRights.ADMIN,
];

/** Highest right of the user on the project, or null when none. */
export async function getProjectRight(
  links: LinkGroupProjectService,
  userId: number,
  projectId: number,
): Promise<GroupProjectRights | null> {
  const link = await links.getHighestRightForProject(userId, Number(projectId));
  return link?.rights ?? null;
}

/**
 * Throws 403 unless the user has one of `allowed` rights on the project.
 * Unlike LinkGroupProjectService.checkPolicies, this throws instead of
 * returning the exception, so the client gets a real 403.
 */
export async function assertProjectRight(
  links: LinkGroupProjectService,
  userId: number,
  projectId: number,
  allowed: GroupProjectRights[],
): Promise<GroupProjectRights> {
  if (!Number.isFinite(Number(projectId))) {
    throw new ForbiddenException('A valid projectId is required');
  }
  const right = await getProjectRight(links, userId, projectId);
  if (!right || !allowed.includes(right)) {
    throw new ForbiddenException(
      'User does not have the required rights on this project',
    );
  }
  return right;
}
