import SectionBanner from "./SectionBanner";
import "../../styles/listingPages.css";

export default function ListingPage({
  title,
  subtitle,
  loading,
  loadingText,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  action,
  filters,
  notice,
  hasResults,
  emptyTitle,
  emptyText,
  children,
}) {
  if (loading) {
    return (
      <div className="listing-loading">
        <h3>{loadingText}</h3>
      </div>
    );
  }

  return (
    <div className="listing-page">
      <SectionBanner title={title} subtitle={subtitle} />

      <div className="listing-shell">
        {notice}

        <div className="listing-toolbar">
          <div className={`listing-toolbar-row ${action ? "with-action" : ""}`}>
            <div className="listing-search-wrap">
              <input
                type="text"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="listing-search-input"
              />
            </div>

            {action}
          </div>

          {filters}
        </div>

        <div className="listing-results">
          {hasResults ? (
            <div className="listing-grid">{children}</div>
          ) : (
            <div className="listing-empty-state">
              <h3>{emptyTitle}</h3>
              <p>{emptyText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
