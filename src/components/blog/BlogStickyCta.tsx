import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";
import { categoryPath } from "@/lib/category-path";

/** Fixed mobile bar: jump to in-article products + category hub. */
export function BlogStickyCta({
  productCount,
  categorySlug,
}: {
  productCount: number;
  categorySlug: string;
}) {
  const T = useI18n();
  const href = useHref();
  if (productCount < 1) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-xl md:hidden">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center rounded-[10px] bg-cta px-4 py-3 text-sm font-semibold text-cta-foreground shadow-cta"
          onClick={() => {
            document.getElementById("blog-products")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          {T.blog.stickyCompare(productCount)} →
        </button>
        <Link
          to={href(categoryPath(categorySlug))}
          className="inline-flex shrink-0 items-center justify-center rounded-[10px] border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground"
        >
          {T.blog.stickyCategory}
        </Link>
      </div>
    </div>
  );
}
