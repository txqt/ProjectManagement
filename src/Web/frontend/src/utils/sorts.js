// utils/sorts.js - Updated mapOrder function
/**
 * Map và sắp xếp items theo rank (LexoRank)
 * @param {Array} items - Mảng items cần sắp xếp
 * @param {Array} rankIds - Mảng ranks theo thứ tự mong muốn (không cần thiết nữa)
 * @param {string} key - Key để compare (nếu items không có rank property)
 * @returns {Array} Mảng items đã sắp xếp
 */
export const mapOrder = (items, rankIds, key = 'rank') => {
  if (!items || items.length === 0) return [];
  
  // Nếu rankIds được truyền vào (backward compatibility)
  if (rankIds && rankIds.length > 0 && typeof rankIds[0] === 'string' && !rankIds[0].includes('|')) {
    // Cách cũ: dùng ID order - vẫn hỗ trợ nhưng không khuyến khích
    return items
      .map(item => ({
        ...item,
        _order: rankIds.indexOf(item.id)
      }))
      .filter(item => item._order !== -1)
      .sort((a, b) => a._order - b._order);
  }

  // Cách mới: sắp xếp theo rank property
  return items
    .filter(item => item && item[key])
    .sort((a, b) => {
      const rankA = a[key] || '';
      const rankB = b[key] || '';
      return rankA.localeCompare(rankB);
    });
};

/**
 * So sánh hai rank strings
 * LexoRank format: base62 encoded strings like "0|000000:", "0|000001:", etc.
 * @param {string} rankA 
 * @param {string} rankB 
 * @returns {number} -1 if A < B, 0 if equal, 1 if A > B
 */
export const compareRanks = (rankA, rankB) => {
  if (!rankA && !rankB) return 0;
  if (!rankA) return -1;
  if (!rankB) return 1;
  return rankA.localeCompare(rankB);
};

/**
 * Extract position of item in sorted order
 * @param {Array} items - Sorted items array
 * @param {string} itemId - Item ID to find position
 * @returns {number} Index of item, or -1 if not found
 */
export const getItemPosition = (items, itemId) => {
  return items.findIndex(item => item.id === itemId);
};

// BoardContent.jsx - Updated to use rank-based sorting
export const sortColumnsByRank = (columns) => {
  if (!columns || columns.length === 0) return [];
  return [...columns].sort((a, b) => 
    (a.rank || '').localeCompare(b.rank || '')
  );
};

export const sortCardsByRank = (cards) => {
  if (!cards || cards.length === 0) return [];
  return [...cards].sort((a, b) => 
    (a.rank || '').localeCompare(b.rank || '')
  );
};