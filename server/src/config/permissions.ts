/** Canonical permission catalogue. The seed syncs these into the Permission table. */
export const PERMISSIONS = {
  'dashboard.view': { group: 'Dashboard', description: 'View the CMS dashboard' },
  'homepage.view': { group: 'Homepage', description: 'View homepage builder and preview drafts' },
  'homepage.edit': { group: 'Homepage', description: 'Edit, reorder and toggle homepage sections (draft)' },
  'homepage.publish': { group: 'Homepage', description: 'Publish the homepage draft to the live site' },
  'pages.view': { group: 'Pages', description: 'View pages in the CMS' },
  'pages.create': { group: 'Pages', description: 'Create pages' },
  'pages.edit': { group: 'Pages', description: 'Edit pages and save drafts' },
  'pages.delete': { group: 'Pages', description: 'Delete pages' },
  'pages.publish': { group: 'Pages', description: 'Publish, schedule and unpublish pages' },
  'news.view': { group: 'News', description: 'View news articles in the CMS' },
  'news.create': { group: 'News', description: 'Create news articles' },
  'news.edit': { group: 'News', description: 'Edit news articles' },
  'news.delete': { group: 'News', description: 'Delete news articles' },
  'news.publish': { group: 'News', description: 'Publish, schedule and unpublish news' },
  'events.view': { group: 'Events', description: 'View events in the CMS' },
  'events.manage': { group: 'Events', description: 'Create, edit and delete events' },
  'events.publish': { group: 'Events', description: 'Publish, schedule and unpublish events' },
  'media.view': { group: 'Media', description: 'Browse the media library' },
  'media.upload': { group: 'Media', description: 'Upload and replace media files' },
  'media.edit': { group: 'Media', description: 'Edit media metadata, folders and tags' },
  'media.delete': { group: 'Media', description: 'Delete media files' },
  'gallery.manage': { group: 'Gallery', description: 'Manage gallery albums and items' },
  'menus.manage': { group: 'Navigation', description: 'Manage header and footer navigation' },
  'announcements.manage': { group: 'Announcements', description: 'Manage site announcements' },
  'academics.view': { group: 'Academics', description: 'View faculties, departments and programs in the CMS' },
  'academics.manage': { group: 'Academics', description: 'Manage faculties, departments and programs' },
  'centers.manage': { group: 'Centers', description: 'Manage university centers' },
  'research.manage': { group: 'Research', description: 'Manage research areas, projects and publications' },
  'campus.manage': { group: 'Campus', description: 'Manage campus content' },
  'contact.manage': { group: 'Site', description: 'Manage contact information' },
  'social.manage': { group: 'Site', description: 'Manage social media links' },
  'settings.manage': { group: 'Site', description: 'Manage site settings, branding and SEO defaults' },
  'users.manage': { group: 'Administration', description: 'Create, edit and deactivate users' },
  'roles.manage': { group: 'Administration', description: 'Manage roles and their permissions' },
  'security.manage': { group: 'Administration', description: 'Manage security configuration' },
  'logs.view': { group: 'Administration', description: 'View activity logs' },
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as PermissionKey[];

export const SUPER_ADMIN_ROLE = 'super_admin';

const contentCore: PermissionKey[] = ['dashboard.view', 'media.view', 'media.upload'];

export const DEFAULT_ROLES: Record<string, { name: string; description: string; permissions: PermissionKey[] }> = {
  [SUPER_ADMIN_ROLE]: {
    name: 'Super Admin',
    description: 'Full access to every module, users, roles, settings and security.',
    permissions: ALL_PERMISSIONS,
  },
  media_manager: {
    name: 'Media Manager',
    description: 'Primary content role: homepage, pages, news, events, media, gallery, menus, announcements and campus content.',
    permissions: [
      ...contentCore,
      'homepage.view', 'homepage.edit', 'homepage.publish',
      'pages.view', 'pages.create', 'pages.edit', 'pages.publish',
      'news.view', 'news.create', 'news.edit', 'news.delete', 'news.publish',
      'events.view', 'events.manage', 'events.publish',
      'media.edit', 'media.delete',
      'gallery.manage', 'menus.manage', 'announcements.manage',
      'academics.view', 'centers.manage', 'research.manage', 'campus.manage',
      'contact.manage', 'social.manage',
    ],
  },
  editor: {
    name: 'Editor',
    description: 'Edits and publishes most content; cannot manage users, settings or navigation.',
    permissions: [
      ...contentCore,
      'homepage.view', 'homepage.edit',
      'pages.view', 'pages.create', 'pages.edit', 'pages.publish',
      'news.view', 'news.create', 'news.edit', 'news.publish',
      'events.view', 'events.manage', 'events.publish',
      'media.edit', 'gallery.manage',
      'academics.view', 'academics.manage', 'centers.manage', 'research.manage', 'campus.manage',
    ],
  },
  news_editor: {
    name: 'News Editor',
    description: 'Manages news, events and announcements.',
    permissions: [
      ...contentCore, 'media.edit',
      'news.view', 'news.create', 'news.edit', 'news.delete', 'news.publish',
      'events.view', 'events.manage', 'events.publish',
      'announcements.manage',
    ],
  },
  academic_editor: {
    name: 'Academic Editor',
    description: 'Manages academic structure, programs, centers and research content.',
    permissions: [...contentCore, 'academics.view', 'academics.manage', 'centers.manage', 'research.manage'],
  },
  content_contributor: {
    name: 'Content Contributor',
    description: 'Drafts pages, news and events for review. Cannot publish.',
    permissions: [
      ...contentCore,
      'pages.view', 'pages.edit',
      'news.view', 'news.create', 'news.edit',
      'events.view', 'events.manage',
    ],
  },
};
