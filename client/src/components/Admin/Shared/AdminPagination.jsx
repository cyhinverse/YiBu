import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminPagination({
  currentPage,
  totalPages,
  label,
  canPrev = true,
  canNext = true,
  onPrev,
  onNext,
  className = '',
}) {
  const resolvedLabel =
    label ??
    (typeof totalPages === 'number'
      ? `Trang ${currentPage} / ${totalPages}`
      : `Trang ${currentPage}`);

  return (
    <div
      className={`admin-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
    >
      <span className="text-sm text-[var(--color-text-secondary)]">
        {resolvedLabel}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={onPrev}
          className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          aria-label="Trang trước"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="w-9 h-9 flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-full text-sm font-semibold">
          {currentPage}
        </div>

        <button
          type="button"
          disabled={!canNext}
          onClick={onNext}
          className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          aria-label="Trang tiếp"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

