const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function ModerationList({
  type,
  loading,
  emptyTitle,
  emptyText,
  items,
  totalItems,
  filteredCount,
  page,
  pageSize,
  totalPages,
  search,
  status,
  sort,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  renderItem,
}) {
  if (loading) {
    return <div className="admin-verification-loading surface-card">Loading moderation queue...</div>;
  }

  const startItem = filteredCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, filteredCount);
  const statusOptions =
    type === "needs"
      ? [
          { value: "all", label: "All statuses" },
          { value: "open", label: "Open" },
          { value: "completed", label: "Completed" },
        ]
      : [
          { value: "all", label: "All statuses" },
          { value: "available", label: "Available" },
          { value: "reserved", label: "Reserved" },
          { value: "inactive", label: "Inactive" },
        ];

  return (
    <div className="admin-moderation-panel">
      <div className="admin-moderation-toolbar surface-card">
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={
            type === "needs"
              ? "Search by title, organization, location, or item..."
              : "Search by title, owner, location, category..."
          }
        />

        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(event) => onSortChange(event.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A-Z</option>
        </select>

        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          aria-label="Items per page"
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option} per page
            </option>
          ))}
        </select>
      </div>

      <div className="admin-moderation-summary">
        {filteredCount > 0 ? (
          <span>
            Showing {startItem}-{endItem} of {filteredCount}
            {filteredCount !== totalItems ? ` filtered from ${totalItems}` : ""} posts
          </span>
        ) : (
          <span>{totalItems} posts in this moderation queue</span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="admin-verification-empty surface-card">
          <h3>{totalItems > 0 ? "No matching posts" : emptyTitle}</h3>
          <p>{totalItems > 0 ? "Try another search term or status filter." : emptyText}</p>
        </div>
      ) : (
        <div className="admin-moderation-list">{items.map(renderItem)}</div>
      )}

      {filteredCount > 0 && (
        <div className="admin-moderation-pagination surface-card">
          <span>
            Page {page} of {totalPages}
          </span>

          <div className="admin-moderation-page-buttons">
            <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              Previous
            </button>

            <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
