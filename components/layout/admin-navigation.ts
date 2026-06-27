export interface AdminNavItem {
  label: string;
  href: string;
  icon: string;
  description?: string;
}

export const adminPrimaryNavItems: AdminNavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: "dashboard",
    description: "Operational overview",
  },
  {
    label: "Articles",
    href: "/admin/articles",
    icon: "article",
    description: "Posts, drafts, and translations",
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: "folder_open",
    description: "Editorial taxonomy",
  },
  {
    label: "Tags",
    href: "/admin/tags",
    icon: "sell",
    description: "Topic labels",
  },
  {
    label: "Media Library",
    href: "/admin/media",
    icon: "imagesmode",
    description: "Uploaded assets",
  },
  {
    label: "Comments",
    href: "/admin/comments",
    icon: "chat",
    description: "Moderation queue",
  },
  {
    label: "Newsletter",
    href: "/admin/newsletter",
    icon: "mail",
    description: "Subscribers and campaigns",
  },
  {
    label: "SEO Manager",
    href: "/admin/seo",
    icon: "search",
    description: "Metadata and indexing",
  },
  {
    label: "Performance",
    href: "/admin/performance",
    icon: "monitoring",
    description: "Web vitals and delivery",
  },
  {
    label: "Compliance",
    href: "/admin/compliance",
    icon: "policy",
    description: "Policy and consent",
  },
  {
    label: "Backup & Export",
    href: "/admin/ops",
    icon: "database_backup",
    description: "Operations tooling",
  },
  {
    label: "Roles & Users",
    href: "/admin/users",
    icon: "manage_accounts",
    description: "Access management",
  },
];

export const adminSecondaryNavItems: AdminNavItem[] = [
  {
    label: "Account Security",
    href: "/admin/account",
    icon: "shield_lock",
    description: "Profile and security",
  },
  {
    label: "System Settings",
    href: "/admin/settings",
    icon: "settings",
    description: "Site configuration",
  },
];

export const adminNavItems = [
  ...adminPrimaryNavItems,
  ...adminSecondaryNavItems,
] as const;

export function isAdminNavItemActive(pathname: string | null, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return Boolean(pathname?.startsWith(href));
}

export function getAdminPageTitle(pathname: string | null) {
  if (pathname === "/admin") {
    return "Overview";
  }

  const currentItem =
    adminNavItems
      .filter((item) => isAdminNavItemActive(pathname, item.href))
      .sort((left, right) => right.href.length - left.href.length)[0] ||
    adminPrimaryNavItems[0];

  return currentItem.label;
}
