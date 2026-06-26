export function ShortsLoadingSkeleton() {
  return (
    <div
      className="sesh-shorts-loading-card"
      role="status"
      aria-label="Загрузка шортсов"
    >
      <div className="sesh-shorts-skeleton-stage">
        <div className="sesh-shorts-skeleton-stack" aria-hidden="true">
          <span className="sesh-shorts-skeleton-line w-[82%]" />
          <span className="sesh-shorts-skeleton-line w-[72%]" />
          <span className="sesh-shorts-skeleton-line w-[90%]" />
          <span className="sesh-shorts-skeleton-line w-[64%]" />
        </div>

        <div className="sesh-shorts-skeleton-info" aria-hidden="true">
          <span className="sesh-shorts-skeleton-pill" />
          <span className="sesh-shorts-skeleton-line w-[58%]" />
          <span className="sesh-shorts-skeleton-line w-[78%]" />
          <span className="sesh-shorts-skeleton-line w-[46%]" />
        </div>

        <div className="sesh-shorts-skeleton-actions" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
