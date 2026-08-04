/**
 * Whitelist of medical / health RSS sources for blog ingest.
 * Prefer ScienceDaily niche shelves (title-friendly) — WHO/CDC are mostly institutional PR.
 */

export type BlogRssSource = {
  id: string;
  name: string;
  feedUrl: string;
  /** Optional default shelf when LLM cannot map. */
  defaultCategorySlug?: string;
  /** Max items to consider per feed per run. */
  maxItems?: number;
};

export const BLOG_RSS_SOURCES: BlogRssSource[] = [
  {
    id: "sciencedaily-health",
    name: "ScienceDaily — Health & Medicine",
    feedUrl: "https://www.sciencedaily.com/rss/health_medicine.xml",
    defaultCategorySlug: "traveni",
    maxItems: 16,
  },
  {
    id: "sciencedaily-obesity",
    name: "ScienceDaily — Obesity",
    feedUrl: "https://www.sciencedaily.com/rss/health_medicine/obesity.xml",
    defaultCategorySlug: "hubnuti",
    maxItems: 12,
  },
  {
    id: "sciencedaily-diabetes",
    name: "ScienceDaily — Diabetes",
    feedUrl: "https://www.sciencedaily.com/rss/health_medicine/diabetes.xml",
    defaultCategorySlug: "cukrovka",
    maxItems: 12,
  },
  {
    id: "sciencedaily-nutrition",
    name: "ScienceDaily — Nutrition",
    feedUrl: "https://www.sciencedaily.com/rss/health_medicine/nutrition.xml",
    defaultCategorySlug: "hubnuti",
    maxItems: 10,
  },
  {
    id: "sciencedaily-hypertension",
    name: "ScienceDaily — Hypertension",
    feedUrl: "https://www.sciencedaily.com/rss/health_medicine/hypertension.xml",
    defaultCategorySlug: "krevni-tlak",
    maxItems: 10,
  },
  {
    id: "sciencedaily-joint-pain",
    name: "ScienceDaily — Joint Pain",
    feedUrl: "https://www.sciencedaily.com/rss/health_medicine/joint_pain.xml",
    defaultCategorySlug: "klouby",
    maxItems: 10,
  },
  {
    id: "sciencedaily-sleep",
    name: "ScienceDaily — Sleep Disorders",
    feedUrl: "https://www.sciencedaily.com/rss/health_medicine/sleep_disorders.xml",
    defaultCategorySlug: "stres",
    maxItems: 10,
  },
  {
    id: "sciencedaily-insomnia",
    name: "ScienceDaily — Insomnia",
    feedUrl: "https://www.sciencedaily.com/rss/mind_brain/insomnia.xml",
    defaultCategorySlug: "stres",
    maxItems: 8,
  },
  {
    id: "sciencedaily-gi",
    name: "ScienceDaily — Gastrointestinal",
    feedUrl: "https://www.sciencedaily.com/rss/health_medicine/gastrointestinal_problems.xml",
    defaultCategorySlug: "traveni",
    maxItems: 10,
  },
  {
    id: "sciencedaily-liver",
    name: "ScienceDaily — Liver Disease",
    feedUrl: "https://www.sciencedaily.com/rss/health_medicine/liver_disease.xml",
    defaultCategorySlug: "jatra",
    maxItems: 8,
  },
  {
    id: "sciencedaily-kidney",
    name: "ScienceDaily — Kidney Disease",
    feedUrl: "https://www.sciencedaily.com/rss/health_medicine/kidney_disease.xml",
    defaultCategorySlug: "ledviny",
    maxItems: 8,
  },
  {
    id: "sciencedaily-prostate",
    name: "ScienceDaily — Prostate Cancer",
    feedUrl: "https://www.sciencedaily.com/rss/health_medicine/prostate_cancer.xml",
    defaultCategorySlug: "prostata",
    maxItems: 8,
  },
  {
    id: "sciencedaily-ed",
    name: "ScienceDaily — Erectile Dysfunction",
    feedUrl: "https://www.sciencedaily.com/rss/health_medicine/erectile_dysfunction.xml",
    defaultCategorySlug: "potence",
    maxItems: 8,
  },
  {
    id: "sciencedaily-smoking",
    name: "ScienceDaily — Smoking",
    feedUrl: "https://www.sciencedaily.com/rss/health_medicine/smoking.xml",
    defaultCategorySlug: "odvykani-koureni",
    maxItems: 8,
  },
  {
    id: "sciencedaily-hearing",
    name: "ScienceDaily — Hearing Loss",
    feedUrl: "https://www.sciencedaily.com/rss/health_medicine/hearing_loss.xml",
    defaultCategorySlug: "sluch",
    maxItems: 8,
  },
  {
    id: "sciencedaily-eye",
    name: "ScienceDaily — Eye Care",
    feedUrl: "https://www.sciencedaily.com/rss/health_medicine/eye_care.xml",
    defaultCategorySlug: "zrak",
    maxItems: 8,
  },
  {
    id: "sciencedaily-menopause",
    name: "ScienceDaily — Menopause",
    feedUrl: "https://www.sciencedaily.com/rss/health_medicine/menopause.xml",
    defaultCategorySlug: "zdravi-zen",
    maxItems: 8,
  },
  {
    id: "cdc-newsroom",
    name: "CDC Newsroom",
    feedUrl: "https://tools.cdc.gov/api/v2/resources/media/132608.rss",
    defaultCategorySlug: "stres",
    maxItems: 10,
  },
  {
    id: "who-news",
    name: "WHO News",
    feedUrl: "https://www.who.int/rss-feeds/news-english.xml",
    defaultCategorySlug: "stres",
    maxItems: 6,
  },
];
