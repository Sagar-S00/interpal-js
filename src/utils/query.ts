export const buildQuery = (params: Record<string, unknown>): URLSearchParams => {
  const filteredEntries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null);
  const searchParams = new URLSearchParams();
  filteredEntries.forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
    } else {
      searchParams.append(key, String(value));
    }
  });
  return searchParams;
};

