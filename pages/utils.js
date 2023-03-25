export function sortData(data, property, direction) {
  const sortedData = [...data];

  sortedData.sort((a, b) => {
    if (a[property] === null || a[property] === '') {
      return direction === 'asc' ? 1 : -1;
    }
    if (b[property] === null || b[property] === '') {
      return direction === 'asc' ? -1 : 1;
    }

    // Sort IP addresses numerically
    if (property === 'ip') {
      const aParts = a.ip.split('.');
      const bParts = b.ip.split('.');
      for (let i = 0; i < 4; i++) {
        const aPart = parseInt(aParts[i], 10);
        const bPart = parseInt(bParts[i], 10);
        if (aPart < bPart) {
          return direction === 'asc' ? -1 : 1;
        }
        if (aPart > bPart) {
          return direction === 'asc' ? 1 : -1;
        }
      }
      return 0;
    }

    if (a[property] < b[property]) {
      return direction === 'asc' ? -1 : 1;
    }
    if (a[property] > b[property]) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return sortedData;
}
