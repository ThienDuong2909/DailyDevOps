"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useDictionary, useLocale } from "@/components/i18n/locale-provider";
import type { SiteLocale } from "@/lib/i18n/config";

export interface SiteLinkItem {
  label: string;
  href: string;
}

export interface TrendingToolItem {
  name: string;
  shortName: string;
  description: string;
  href: string;
}

export interface SiteSettingsPayload {
  general: {
    siteName: string;
    siteUrl: string;
    siteDescription: string;
    language: string;
    timezone: string;
    postsPerPage: number;
    allowComments: boolean;
    moderateComments: boolean;
  };
  appearance: {
    darkModeDefault: boolean;
    primaryColor: string;
  };
  email: {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    notifyNewComment: boolean;
    notifyNewUser: boolean;
  };
  maintenance: {
    maintenanceMode: boolean;
  };
  content: {
    headerNavigation: SiteLinkItem[];
    footerDescription: string;
    footerContentLinks: SiteLinkItem[];
    footerCompanyLinks: SiteLinkItem[];
    trendingTools: TrendingToolItem[];
  };
}

export const defaultSiteSettings: SiteSettingsPayload = {
  general: {
    siteName: "DevOps Blog",
    siteUrl: "https://dailydevops.blog",
    siteDescription:
      "Expert articles on Kubernetes, CI/CD, Cloud Architecture, and DevOps best practices.",
    language: "vi",
    timezone: "Asia/Ho_Chi_Minh",
    postsPerPage: 10,
    allowComments: true,
    moderateComments: true,
  },
  appearance: {
    darkModeDefault: true,
    primaryColor: "#00bcd4",
  },
  email: {
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    notifyNewComment: true,
    notifyNewUser: true,
  },
  maintenance: {
    maintenanceMode: false,
  },
  content: {
    headerNavigation: [
      { label: "Articles", href: "/" },
      { label: "Search", href: "/search" },
      { label: "Newsletter", href: "/newsletter" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    footerDescription:
      "The leading resource for DevOps professionals, SREs, and Platform Engineers. Building the future of infrastructure together.",
    footerContentLinks: [
      { label: "Articles", href: "/blog" },
      { label: "Search", href: "/search" },
      { label: "Newsletter", href: "/newsletter" },
      { label: "RSS Feed", href: "/rss.xml" },
    ],
    footerCompanyLinks: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy-policy" },
      { label: "Terms", href: "/terms-of-service" },
      { label: "Cookies", href: "/cookie-policy" },
      { label: "DMCA", href: "/dmca-policy" },
    ],
    trendingTools: [
      {
        name: "Kubernetes",
        shortName: "K8",
        description: "Orchestration",
        href: "/search?q=Kubernetes",
      },
      {
        name: "GitLab",
        shortName: "Gi",
        description: "DevOps Platform",
        href: "/search?q=GitLab",
      },
      {
        name: "Terraform",
        shortName: "Tf",
        description: "Infrastructure as Code",
        href: "/search?q=Terraform",
      },
      {
        name: "Ansible",
        shortName: "An",
        description: "Automation",
        href: "/search?q=Ansible",
      },
    ],
  },
};

let cachedSettings: SiteSettingsPayload | null = null;
let settingsRequest: Promise<SiteSettingsPayload> | null = null;

function resolveData(payload: unknown): SiteSettingsPayload {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (
      (payload as { data?: SiteSettingsPayload }).data ?? defaultSiteSettings
    );
  }

  return (payload as SiteSettingsPayload) ?? defaultSiteSettings;
}

async function fetchSiteSettingsOnce() {
  if (cachedSettings) {
    return cachedSettings;
  }

  if (!settingsRequest) {
    settingsRequest = apiClient
      .get<unknown>("/api/v1/settings/public")
      .then((payload) => {
        cachedSettings = resolveData(payload);
        return cachedSettings;
      })
      .catch(() => {
        cachedSettings = defaultSiteSettings;
        return cachedSettings;
      })
      .finally(() => {
        settingsRequest = null;
      });
  }

  return settingsRequest;
}

function localizeLinks(
  links: SiteLinkItem[],
  locale: SiteLocale,
  dictionary: ReturnType<typeof useDictionary>,
): SiteLinkItem[] {
  const englishLabelsByHref: Record<string, string> = {
    "/": "Articles",
    "/blog": "Articles",
    "/search": dictionary.common.search,
    "/newsletter": dictionary.common.newsletter,
    "/about": dictionary.common.about,
    "/contact": dictionary.common.contact,
    "/privacy-policy": "Privacy",
    "/terms-of-service": "Terms",
    "/cookie-policy": "Cookies",
    "/dmca-policy": "DMCA",
    "/rss.xml": "RSS Feed",
  };
  const vietnameseLabelsByHref: Record<string, string> = {
    "/": "Bài viết",
    "/blog": "Bài viết",
    "/search": dictionary.common.search,
    "/newsletter": dictionary.common.newsletter,
    "/about": dictionary.common.about,
    "/contact": dictionary.common.contact,
    "/privacy-policy": "Quyền riêng tư",
    "/terms-of-service": "Điều khoản",
    "/cookie-policy": "Cookie",
    "/dmca-policy": "DMCA",
    "/rss.xml": "RSS Feed",
  };
  const labelsByHref =
    locale === "en" ? englishLabelsByHref : vietnameseLabelsByHref;

  return links.map((item) => ({
    ...item,
    label: labelsByHref[item.href] || item.label,
  }));
}

function localizeSettings(
  settings: SiteSettingsPayload,
  locale: SiteLocale,
  dictionary: ReturnType<typeof useDictionary>,
): SiteSettingsPayload {
  const localizedContent =
    locale === "en"
      ? {
          siteDescription:
            "Expert articles on Kubernetes, CI/CD, Cloud Architecture, and DevOps best practices.",
          footerDescription:
            "The leading resource for DevOps professionals, SREs, and Platform Engineers. Building the future of infrastructure together.",
        }
      : {
          siteDescription:
            "Bài viết thực chiến về Kubernetes, CI/CD, kiến trúc cloud và các best practice DevOps.",
          footerDescription:
            "Nguồn tài liệu dành cho kỹ sư DevOps, SRE và Platform Engineer. Cùng xây dựng hạ tầng tốt hơn mỗi ngày.",
        };

  return {
    ...settings,
    general: {
      ...settings.general,
      siteDescription: localizedContent.siteDescription,
      language: locale,
    },
    content: {
      ...settings.content,
      headerNavigation: localizeLinks(
        settings.content.headerNavigation,
        locale,
        dictionary,
      ),
      footerDescription: localizedContent.footerDescription,
      footerContentLinks: localizeLinks(
        settings.content.footerContentLinks,
        locale,
        dictionary,
      ),
      footerCompanyLinks: localizeLinks(
        settings.content.footerCompanyLinks,
        locale,
        dictionary,
      ),
    },
  };
}

export function useSiteSettings() {
  const locale = useLocale();
  const dictionary = useDictionary();
  const [settings, setSettings] = useState<SiteSettingsPayload>(
    cachedSettings ?? defaultSiteSettings,
  );
  const [isLoading, setIsLoading] = useState(!cachedSettings);
  const localizedSettings = localizeSettings(settings, locale, dictionary);

  useEffect(() => {
    let isMounted = true;

    const fetchSettings = async () => {
      try {
        const payload = await fetchSiteSettingsOnce();
        if (!isMounted) {
          return;
        }

        setSettings(payload);
      } catch {
        if (!isMounted) {
          return;
        }

        setSettings(defaultSiteSettings);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  return { settings: localizedSettings, isLoading };
}
