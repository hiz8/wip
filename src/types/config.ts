export interface SiteInfo {
  name: string;
  description: string;
  url: string;
  locale: string;
  ogImage?: string;
}

export interface AuthorInfo {
  name: string;
  bio?: string;
  socialLinks?: SocialLink[];
}

export interface SocialLink {
  label: string;
  url: string;
  icon?: string;
}

export interface NotesContentConfig {
  path: string;
  exclude: string[];
}

export interface GlossaryContentConfig {
  path: string;
}

export interface BooksContentConfig {
  path: string;
}

export interface ContentConfig {
  vaultRoot: string;
  notes: NotesContentConfig;
  glossary: GlossaryContentConfig;
  books: BooksContentConfig;
}

export interface PagesConfig {
  home?: {
    introMarkdown?: string;
    aboutMarkdown?: string;
  };
}

export interface BuildConfig {
  outDir: string;
  publicDir: string;
  strict: boolean;
}

export interface FeaturesConfig {
  rss: boolean;
  sitemap: boolean;
  search: boolean;
}

export interface SiteConfig {
  site: SiteInfo;
  author: AuthorInfo;
  content: ContentConfig;
  pages?: PagesConfig;
  build: BuildConfig;
  features: FeaturesConfig;
}

export type SiteConfigInput = {
  site: SiteInfo;
  author: AuthorInfo;
  content: {
    vaultRoot?: string;
    notes?: Partial<NotesContentConfig>;
    glossary?: Partial<GlossaryContentConfig>;
    books?: Partial<BooksContentConfig>;
  };
  pages?: PagesConfig;
  build?: Partial<BuildConfig>;
  features?: Partial<FeaturesConfig>;
};
