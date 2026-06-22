function getNeedStatus(need) {
  const items = Array.isArray(need.items) ? need.items : [];

  if (!items.length) {
    return "open";
  }

  const completed = items.every((item) => {
    const quantity = Number(item.quantity || 0);
    const brought = Number(item.brought || 0);
    return quantity > 0 && brought >= quantity;
  });

  return completed ? "completed" : "open";
}

function getModerationSearchText(item, type) {
  if (type === "needs") {
    const itemNames = Array.isArray(item.items)
      ? item.items.map((needItem) => needItem.name).join(" ")
      : "";

    return [
      item.title,
      item.description,
      item.location,
      item.organization_name,
      item.organization_email,
      itemNames,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  return [
    item.title,
    item.description,
    item.category,
    item.location,
    item.status,
    item.donor_name,
    item.owner_email,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function filterModerationItems(items, type, search, status, sort) {
  const normalizedSearch = search.trim().toLowerCase();

  return [...items]
    .filter((item) => {
      const itemStatus = type === "needs" ? getNeedStatus(item) : item.status || "available";
      const matchesStatus = status === "all" || itemStatus === status;
      const matchesSearch =
        !normalizedSearch || getModerationSearchText(item, type).includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    })
    .sort((first, second) => {
      if (sort === "title") {
        return (first.title || "").localeCompare(second.title || "");
      }

      const firstDate = new Date(first.created_at || 0).getTime();
      const secondDate = new Date(second.created_at || 0).getTime();

      return sort === "oldest" ? firstDate - secondDate : secondDate - firstDate;
    });
}
