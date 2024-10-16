/* eslint-disable */
export default async () => {
    const t = {
        ["./enum/origins"]: await import("./enum/origins"),
        ["./link-media-group/entities/link-media-group.entity"]: await import("./link-media-group/entities/link-media-group.entity"),
        ["./enum/rights"]: await import("./enum/rights"),
        ["./media/entities/media.entity"]: await import("./media/entities/media.entity"),
        ["./user-group/entities/user-group.entity"]: await import("./user-group/entities/user-group.entity"),
        ["./users/entities/user.entity"]: await import("./users/entities/user.entity"),
        ["./link-manifest-group/entities/link-manifest-group.entity"]: await import("./link-manifest-group/entities/link-manifest-group.entity"),
        ["./manifest/entities/manifest.entity"]: await import("./manifest/entities/manifest.entity"),
        ["./enum/user-group-types"]: await import("./enum/user-group-types"),
        ["./link-group-project/entities/link-group-project.entity"]: await import("./link-group-project/entities/link-group-project.entity"),
        ["./link-user-group/entities/link-user-group.entity"]: await import("./link-user-group/entities/link-user-group.entity"),
        ["./project/entities/project.entity"]: await import("./project/entities/project.entity"),
        ["./project/dto/create-project.dto"]: await import("./project/dto/create-project.dto")
    };
    return { "@nestjs/swagger": { "models": [[import("./media/entities/media.entity"), { "Media": { id: { required: true, type: () => Number }, url: { required: true, type: () => String }, path: { required: true, type: () => String }, thumbnailUrl: { required: true, type: () => String }, hash: { required: true, type: () => String }, name: { required: true, type: () => String }, metadata: { required: true, type: () => Object }, origin: { required: true, enum: t["./enum/origins"].mediaOrigin }, description: { required: true, type: () => String }, idCreator: { required: true, type: () => Number }, created_at: { required: true, type: () => Date }, updated_at: { required: true, type: () => Date }, linkMediaGroup: { required: true, type: () => t["./link-media-group/entities/link-media-group.entity"].LinkMediaGroup } } }], [import("./link-media-group/entities/link-media-group.entity"), { "LinkMediaGroup": { id: { required: true, type: () => Number }, rights: { required: true, enum: t["./enum/rights"].MediaGroupRights }, media: { required: true, type: () => t["./media/entities/media.entity"].Media }, user_group: { required: true, type: () => t["./user-group/entities/user-group.entity"].UserGroup } } }], [import("./link-user-group/entities/link-user-group.entity"), { "LinkUserGroup": { id: { required: true, type: () => Number }, rights: { required: true, enum: t["./enum/rights"].User_UserGroupRights }, user: { required: true, type: () => t["./users/entities/user.entity"].User }, user_group: { required: true, type: () => t["./user-group/entities/user-group.entity"].UserGroup } } }], [import("./manifest/entities/manifest.entity"), { "Manifest": { id: { required: true, type: () => Number }, thumbnailUrl: { required: true, type: () => String }, origin: { required: true, enum: t["./enum/origins"].manifestOrigin }, path: { required: true, type: () => String }, hash: { required: true, type: () => String }, name: { required: true, type: () => String }, description: { required: true, type: () => String }, metadata: { required: true, type: () => Object }, idCreator: { required: true, type: () => Number }, created_at: { required: true, type: () => Date }, updated_at: { required: true, type: () => Date }, linkManifestGroup: { required: true, type: () => t["./link-manifest-group/entities/link-manifest-group.entity"].LinkManifestGroup } } }], [import("./link-manifest-group/entities/link-manifest-group.entity"), { "LinkManifestGroup": { id: { required: true, type: () => Number }, rights: { required: true, enum: t["./enum/rights"].ManifestGroupRights }, manifest: { required: true, type: () => t["./manifest/entities/manifest.entity"].Manifest }, user_group: { required: true, type: () => t["./user-group/entities/user-group.entity"].UserGroup } } }], [import("./user-group/entities/user-group.entity"), { "UserGroup": { id: { required: true, type: () => Number }, name: { required: true, type: () => String }, ownerId: { required: true, type: () => Number }, thumbnailUrl: { required: true, type: () => String }, description: { required: true, type: () => String }, type: { required: true, enum: t["./enum/user-group-types"].UserGroupTypes }, linkGroupProjects: { required: true, type: () => [t["./link-group-project/entities/link-group-project.entity"].LinkGroupProject] }, linkMediaGroup: { required: true, type: () => t["./link-media-group/entities/link-media-group.entity"].LinkMediaGroup }, linkUserGroups: { required: true, type: () => [t["./link-user-group/entities/link-user-group.entity"].LinkUserGroup] }, linkManifestGroup: { required: true, type: () => [t["./link-manifest-group/entities/link-manifest-group.entity"].LinkManifestGroup] } } }], [import("./link-group-project/entities/link-group-project.entity"), { "LinkGroupProject": { id: { required: true, type: () => Number }, rights: { required: true, enum: t["./enum/rights"].GroupProjectRights }, project: { required: true, type: () => t["./project/entities/project.entity"].Project }, user_group: { required: true, type: () => t["./user-group/entities/user-group.entity"].UserGroup } } }], [import("./project/entities/project.entity"), { "Project": { id: { required: true, type: () => Number }, name: { required: true, type: () => String }, description: { required: true, type: () => String }, thumbnailUrl: { required: true, type: () => String }, owner: { required: true, type: () => t["./users/entities/user.entity"].User }, userWorkspace: { required: true, type: () => Object }, metadata: { required: true, type: () => Object }, created_at: { required: true, type: () => Date }, linkGroupProjectsIds: { required: true, type: () => [t["./link-group-project/entities/link-group-project.entity"].LinkGroupProject] } } }], [import("./users/entities/user.entity"), { "User": { id: { required: true, type: () => Number }, mail: { required: true, type: () => String }, name: { required: true, type: () => String }, password: { required: true, type: () => String }, createdAt: { required: true, type: () => Date }, projects: { required: true, type: () => [t["./project/entities/project.entity"].Project] }, linkUserGroups: { required: true, type: () => [t["./link-user-group/entities/link-user-group.entity"].LinkUserGroup] } } }], [import("./project/dto/create-project.dto"), { "CreateProjectDto": { name: { required: true, type: () => String }, userWorkspace: { required: true, type: () => Object }, owner: { required: true, type: () => t["./users/entities/user.entity"].User }, metadata: { required: true, type: () => Object } } }], [import("./users/dto/create-user.dto"), { "CreateUserDto": { mail: { required: true, type: () => String }, name: { required: true, type: () => String }, password: { required: true, type: () => String }, Projects: { required: true, type: () => [t["./project/dto/create-project.dto"].CreateProjectDto] } } }], [import("./user-group/dto/create-user-group.dto"), { "CreateUserGroupDto": { name: { required: true, type: () => String }, ownerId: { required: true, type: () => Number }, user: { required: true, type: () => t["./users/entities/user.entity"].User }, type: { required: true, enum: t["./enum/user-group-types"].UserGroupTypes } } }], [import("./user-group/dto/update-user-group.dto"), { "UpdateUserGroupDto": { ownerId: { required: true, type: () => Number }, id: { required: true, type: () => Number }, rights: { required: true, enum: t["./enum/rights"].User_UserGroupRights } } }], [import("./auth/dto/login.dto"), { "loginDto": { mail: { required: true, type: () => String }, password: { required: true, type: () => String } } }], [import("./project/dto/update-project.dto"), { "UpdateProjectDto": { id: { required: true, type: () => Number } } }], [import("./media/dto/create-media.dto"), { "CreateMediaDto": { path: { required: true, type: () => String }, idCreator: { required: true, type: () => Number }, name: { required: true, type: () => String }, description: { required: true, type: () => String }, user_group: { required: true, type: () => t["./user-group/entities/user-group.entity"].UserGroup } } }], [import("./media/dto/update-media.dto"), { "UpdateMediaDto": { id: { required: true, type: () => Number } } }], [import("./link-group-project/dto/create-link-group-project.dto"), { "CreateLinkGroupProjectDto": { rights: { required: true, enum: t["./enum/rights"].GroupProjectRights }, project: { required: true, type: () => t["./project/entities/project.entity"].Project }, user_group: { required: true, type: () => t["./user-group/entities/user-group.entity"].UserGroup } } }], [import("./link-group-project/dto/update-link-group-project.dto"), { "UpdateLinkGroupProjectDto": { rights: { required: true, enum: t["./enum/rights"].GroupProjectRights }, project: { required: true, type: () => t["./project/entities/project.entity"].Project }, user_group: { required: true, type: () => t["./user-group/entities/user-group.entity"].UserGroup } } }], [import("./link-user-group/dto/create-link-user-group.dto"), { "CreateLinkUserGroupDto": { rights: { required: false, enum: t["./enum/rights"].User_UserGroupRights }, userId: { required: true, type: () => Number }, user_groupId: { required: true, type: () => Number } } }], [import("./link-user-group/dto/update-link-user-group.dto"), { "UpdateLinkUserGroupDto": { groupId: { required: true, type: () => Number }, userId: { required: true, type: () => Number }, rights: { required: true, enum: t["./enum/rights"].User_UserGroupRights } } }], [import("./link-media-group/dto/create-link-media-group.dto"), { "CreateLinkMediaGroupDto": { rights: { required: true, enum: t["./enum/rights"].MediaGroupRights }, media: { required: true, type: () => t["./media/entities/media.entity"].Media }, user_group: { required: true, type: () => t["./user-group/entities/user-group.entity"].UserGroup } } }], [import("./manifest/dto/create-manifest.dto"), { "CreateManifestDto": { path: { required: true, type: () => String }, idCreator: { required: true, type: () => Number }, name: { required: true, type: () => String }, description: { required: true, type: () => String } } }], [import("./manifest/dto/update-manifest.dto"), { "UpdateManifestDto": { id: { required: true, type: () => Number } } }], [import("./link-manifest-group/dto/create-group-manifest.dto"), { "CreateGroupManifestDto": { path: { required: true, type: () => String }, idCreator: { required: true, type: () => Number }, name: { required: true, type: () => String }, rights: { required: true, enum: t["./enum/rights"].ManifestGroupRights }, description: { required: true, type: () => String }, user_group: { required: true, type: () => t["./user-group/entities/user-group.entity"].UserGroup } } }], [import("./link-manifest-group/dto/add-manifest-to-group.dto"), { "AddManifestToGroupDto": { userGroupId: { required: true, type: () => Number }, manifestId: { required: true, type: () => Number }, rights: { required: false, enum: t["./enum/rights"].ManifestGroupRights } } }], [import("./users/dto/update-user.dto"), { "UpdateUserDto": {} }], [import("./link-media-group/dto/update-link-media-group.dto"), { "UpdateLinkMediaGroupDto": { rights: { required: true, enum: t["./enum/rights"].MediaGroupRights }, media: { required: true, type: () => t["./media/entities/media.entity"].Media }, user_group: { required: true, type: () => t["./user-group/entities/user-group.entity"].UserGroup } } }], [import("./link-manifest-group/dto/update-group-manifest.dto"), { "UpdateGroupManifestDto": {} }], [import("./link-media-group/dto/create-group-media.dto"), { "CreateGroupMediaDto": {} }], [import("./link-media-group/dto/update-group-media.dto"), { "UpdateGroupMediaDto": { id: { required: true, type: () => Number } } }]], "controllers": [[import("./app.controller"), { "AppController": { "getHello": { type: String } } }], [import("./user-group/user-group.controller"), { "UserGroupController": { "updateGroup": { type: [t["./user-group/entities/user-group.entity"].UserGroup] }, "remove": {} } }], [import("./auth/auth.controller"), { "AuthController": { "signIn": {}, "getprofile": {} } }], [import("./media/media.controller"), { "MediaController": { "lookingForMedia": { type: [t["./media/entities/media.entity"].Media] } } }], [import("./link-group-project/link-group-project.controller"), { "LinkGroupProjectController": { "getAllGroupProjects": { type: [t["./link-group-project/entities/link-group-project.entity"].LinkGroupProject] }, "getProjectRelation": { type: [t["./link-group-project/entities/link-group-project.entity"].LinkGroupProject] }, "update": { type: Object }, "addProjectToGroup": { type: [Object] }, "deleteProject": {}, "deleteGroupProjectLink": {}, "lookingForProject": { type: [Object] }, "createProject": { type: t["./link-group-project/entities/link-group-project.entity"].LinkGroupProject }, "getAllUsersProjects": { type: [t["./project/entities/project.entity"].Project] } } }], [import("./link-user-group/link-user-group.controller"), { "LinkUserGroupController": { "getAllUsersForGroup": { type: [t["./link-user-group/entities/link-user-group.entity"].LinkUserGroup] }, "getAllGroupForUser": { type: [Object] }, "getAccessToGroup": { type: t["./link-user-group/entities/link-user-group.entity"].LinkUserGroup }, "createUser": { type: t["./users/entities/user.entity"].User }, "createGroup": { type: t["./user-group/entities/user-group.entity"].UserGroup }, "grantAccess": { type: t["./link-user-group/entities/link-user-group.entity"].LinkUserGroup }, "lookingForUser": { type: [t["./link-user-group/entities/link-user-group.entity"].LinkUserGroup] }, "lookingForUserGroups": { type: [t["./link-user-group/entities/link-user-group.entity"].LinkUserGroup] }, "getUserPersonalGroup": { type: t["./user-group/entities/user-group.entity"].UserGroup }, "changeAccess": { type: t["./link-user-group/entities/link-user-group.entity"].LinkUserGroup }, "removeAccess": {}, "remove": {} } }], [import("./email/email.controller"), { "EmailServerController": { "testEMail": {} } }], [import("./link-media-group/link-media-group.controller"), { "LinkMediaGroupController": { "uploadSingleFile": { type: t["./link-media-group/entities/link-media-group.entity"].LinkMediaGroup }, "linkManifest": { type: t["./link-media-group/entities/link-media-group.entity"].LinkMediaGroup }, "getMediaByUserGroupId": {}, "getMediaById": { type: [t["./link-media-group/entities/link-media-group.entity"].LinkMediaGroup] }, "deleteMedia": {}, "updateMedia": { type: t["./media/entities/media.entity"].Media }, "updateMediaGroupRelation": {}, "addMediaToGroup": { type: [Object] }, "deleteMediaById": {} } }], [import("./manifest/manifest.controller"), { "ManifestController": { "lookingForManifest": { type: [t["./manifest/entities/manifest.entity"].Manifest] } } }], [import("./group-manifest/group-manifest.controller"), { "GroupManifestController": { "uploadManifest": { type: Object }, "linkManifest": { type: Object }, "createManifest": { type: Object }, "getManifestByUserGroupId": {}, "getManifestById": { type: [t["./link-manifest-group/entities/link-manifest-group.entity"].LinkManifestGroup] }, "deleteManifest": {}, "updateManifest": { type: t["./manifest/entities/manifest.entity"].Manifest }, "updateManifestGroupRelation": {}, "addManifestToGroup": { type: [Object] }, "deleteManifestById": {} } }], [import("./link-manifest-group/link-manifest-group.controller"), { "LinkManifestGroupController": { "findAll": { type: [t["./link-manifest-group/entities/link-manifest-group.entity"].LinkManifestGroup] } } }]] } };
};