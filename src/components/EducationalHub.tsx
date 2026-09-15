import { EDUCATION_TOPICS, type EducationTopic } from "../data/education";

const PLACEHOLDER_COLORS = [
  "from-teal-50 to-emerald-50 text-teal-600",
  "from-amber-50 to-yellow-50 text-amber-600",
  "from-sky-50 to-blue-50 text-sky-600",
  "from-rose-50 to-pink-50 text-rose-600",
];

function TopicCard({ topic, index }: { topic: EducationTopic; index: number }) {
  const color = PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length]!;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div
        className={`flex aspect-[16/9] items-center justify-center bg-gradient-to-br ${color}`}
        role="img"
        aria-label={`${topic.title}插圖預留位置`}
      >
        <div className="text-center">
          <span className="text-5xl font-bold opacity-30">{topic.iconLabel}</span>
          <p className="mt-2 text-xs opacity-40">插圖預留位置</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold text-ink">{topic.title}</h3>
        <p className="mt-0.5 text-sm font-medium text-accent">{topic.subtitle}</p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">{topic.body}</p>
        <p className="mt-3 text-xs text-ink-faint">
          資料來源：{topic.source}
        </p>
      </div>
    </article>
  );
}

export function EducationalHub() {
  return (
    <section aria-labelledby="edu-hub-heading" className="mb-10">
      <div className="mb-6">
        <h2 id="edu-hub-heading" className="text-xl font-bold text-ink sm:text-2xl">
          為何要選擇星級企業？
        </h2>
        <p className="mt-1.5 text-sm text-ink-muted">
          了解裝修安全法規與認可制度，保障您的家居工程
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {EDUCATION_TOPICS.map((topic, i) => (
          <TopicCard key={topic.id} topic={topic} index={i} />
        ))}
      </div>
    </section>
  );
}
