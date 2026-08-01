import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";

function StethoscopeIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 3v6a5 5 0 0 0 10 0V3" />
      <path d="M4 3h4M14 3h4" />
      <path d="M11 14v2a5 5 0 0 0 10 0v-1" />
      <circle cx="20" cy="11" r="2" />
    </svg>
  );
}

export function DoctorReviewedBadge({ compact = false }: { compact?: boolean }) {
  const T = useI18n();
  const href = useHref();
  const full = `${T.product.verifiedByDoctor} · ${T.product.doctorSub}`;
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-cta">
        <StethoscopeIcon className="h-3 w-3" />
        <span>{T.product.verifiedByDoctor}</span>
      </span>
    );
  }
  return (
    <Link
      to={href("/medical-expert")}
      className="inline-flex items-center gap-2 border-b border-cta/40 pb-0.5 text-xs font-semibold text-primary transition hover:border-cta hover:text-cta"
    >
      <StethoscopeIcon className="h-4 w-4 text-cta" />
      <span>{full}</span>
    </Link>
  );
}
