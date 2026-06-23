import "../../styles/components/SectionBanner.css";

export default function SectionBanner({
  title,
  subtitle,
  stats = [],
  actions = null,
}) {
  const hasStats = stats.length > 0;

  return (
    <section className={`section-banner ${hasStats ? "with-stats" : ""}`}>
      <div className="section-banner-inner">
        <h1>{title}</h1>

        {subtitle && (
          <p className={`section-banner-subtitle ${actions || hasStats ? "spaced" : ""}`}>
            {subtitle}
          </p>
        )}

        {actions && (
          <div className="section-banner-actions">
            {actions}
          </div>
        )}

        {hasStats && (
          <div className="section-banner-stats">
            {stats.map((stat, index) => (
              <div key={stat.label} className="section-banner-stat-group">
                <div className="section-banner-stat">
                  <div className="section-banner-stat-value">
                    {stat.value}
                  </div>
                  <div className="section-banner-stat-label">
                    {stat.label}
                  </div>
                </div>

                {index !== stats.length - 1 && (
                  <div className="section-banner-divider" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
