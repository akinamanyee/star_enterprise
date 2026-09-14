import type { Contractor } from "../utils/contractors";
import {
  TRADE_LABELS,
  formatPhone,
  whatsappUrl,
  telUrl,
} from "../utils/contractors";

function SafetyBadge({ tier }: { tier: Contractor["safety_tier"] }) {
  const isGold = tier === "osh_gold_star";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${
        isGold
          ? "bg-gold-light text-gold"
          : "bg-star-light text-star"
      }`}
    >
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="size-3.5"
        aria-hidden="true"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
      </svg>
      {isGold ? "金星級" : "星級"}
    </span>
  );
}

function TradePill({ trade }: { trade: Contractor["trade"] }) {
  return (
    <span className="inline-block rounded bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
      {TRADE_LABELS[trade]}
    </span>
  );
}

export function ContractorCard({ contractor: c }: { contractor: Contractor }) {
  const hasPhone = c.telephone.length > 0;
  const primaryPhone = c.telephone[0] ?? null;

  const effectiveRange =
    c.recertification_in_progress
      ? "認證進行中"
      : c.effective_date_start && c.effective_date_end
        ? `${c.effective_date_start} – ${c.effective_date_end}`
        : "—";

  return (
    <article className="group flex flex-col rounded-xl border border-border bg-surface-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md">
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-snug text-ink">
            {c.enterprise_name_zh}
          </h3>
          <p className="mt-0.5 text-sm leading-snug text-ink-muted">
            {c.enterprise_name_en}
          </p>
        </div>
        <SafetyBadge tier={c.safety_tier} />
      </header>

      <div className="mb-4 space-y-1.5 text-sm text-ink-muted">
        <p className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 text-ink-faint" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
              <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14 15.91 15.91 0 0 0 2.862-2.014c1.898-1.662 3.878-4.174 3.878-7.29A7.356 7.356 0 0 0 10 2.286 7.356 7.356 0 0 0 2.644 9.48c0 3.115 1.98 5.627 3.878 7.29a15.932 15.932 0 0 0 3.143 2.154l.018.008.006.003ZM10 11.714a2.857 2.857 0 1 0 0-5.714 2.857 2.857 0 0 0 0 5.714Z" clipRule="evenodd" />
            </svg>
          </span>
          <span>{c.address}</span>
        </p>

        {hasPhone && (
          <p className="flex items-center gap-2">
            <span className="shrink-0 text-ink-faint" aria-hidden="true">
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-.65 1.548l-.344.258a.25.25 0 0 0-.07.315c.651 1.165 1.663 2.468 2.93 3.422a.25.25 0 0 0 .312-.01l.262-.205a1.5 1.5 0 0 1 1.595-.132l3.073 1.536A1.5 1.5 0 0 1 14.75 14.6v1.9a1.5 1.5 0 0 1-1.364 1.494 16.7 16.7 0 0 1-1.886.106c-5.38 0-9.5-4.49-9.5-10.1V3.5Z" clipRule="evenodd" />
              </svg>
            </span>
            <span>{c.telephone_display || formatPhone(primaryPhone!)}</span>
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <TradePill trade={c.trade} />
        {c.district && (
          <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-ink-muted">
            {c.district}
          </span>
        )}
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div>
          <dt className="text-ink-faint">有效期</dt>
          <dd className="font-medium text-ink-muted">{effectiveRange}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">首次認可</dt>
          <dd className="font-medium text-ink-muted">{c.accreditation_since} 年</dd>
        </div>
      </dl>

      <div className="mt-auto flex gap-2">
        {hasPhone ? (
          <>
            <a
              href={telUrl(primaryPhone!)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-gray-50"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-.65 1.548l-.344.258a.25.25 0 0 0-.07.315c.651 1.165 1.663 2.468 2.93 3.422a.25.25 0 0 0 .312-.01l.262-.205a1.5 1.5 0 0 1 1.595-.132l3.073 1.536A1.5 1.5 0 0 1 14.75 14.6v1.9a1.5 1.5 0 0 1-1.364 1.494 16.7 16.7 0 0 1-1.886.106c-5.38 0-9.5-4.49-9.5-10.1V3.5Z" clipRule="evenodd" />
              </svg>
              致電
            </a>
            <a
              href={whatsappUrl(primaryPhone!)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-whatsapp px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.12 1.52 5.857L0 24l6.335-1.652A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0Zm0 21.818a9.782 9.782 0 0 1-5.204-1.49l-.374-.223-3.86 1.006 1.032-3.762-.247-.39A9.765 9.765 0 0 1 2.182 12 9.818 9.818 0 1 1 12 21.818Z" />
              </svg>
              WhatsApp
            </a>
          </>
        ) : (
          <p className="w-full rounded-lg bg-gray-50 py-2 text-center text-sm text-ink-faint">
            暫無聯絡方式
          </p>
        )}
      </div>
    </article>
  );
}
