import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useHref } from "@/lib/lang-link";
import { cn } from "@/lib/utils";

export function MarketingCta({
  text,
  ctaLabel,
  to,
  className,
}: {
  text: string;
  ctaLabel: string;
  to: string;
  className?: string;
}) {
  const href = useHref();
  return (
    <aside className={cn("mt-8 rounded-[10px] border border-border bg-card p-5 md:p-6", className)}>
      <p className="text-sm leading-relaxed text-foreground">{text}</p>
      <Link
        to={href(to)}
        className="mt-4 inline-flex items-center rounded-[10px] bg-cta px-5 py-2.5 text-sm font-semibold text-cta-foreground shadow-cta transition-transform hover:-translate-y-0.5"
      >
        {ctaLabel}
      </Link>
    </aside>
  );
}

export function SexToggle({
  value,
  onChange,
}: {
  value: "male" | "female";
  onChange: (v: "male" | "female") => void;
}) {
  const T = useI18n();
  const opts = [
    { id: "female" as const, label: T.services.sexFemale },
    { id: "male" as const, label: T.services.sexMale },
  ];
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-foreground">{T.services.sex}</legend>
      <div className="grid grid-cols-2 gap-2">
        {opts.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              "rounded-[10px] border px-3 py-2.5 text-sm font-medium transition-colors",
              value === o.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/40",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-destructive">{message}</p>;
}
