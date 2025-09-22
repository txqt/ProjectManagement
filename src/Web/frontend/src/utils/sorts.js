export function sortByOrder(items, order, key = "id") {
    if (!items || !order || !key) return [];

    const orderMap = new Map();
    order.forEach((value, index) => orderMap.set(value, index));

    return items.sort((a, b) => {
        return orderMap.get(a[key]) - orderMap.get(b[key]);
    });
}