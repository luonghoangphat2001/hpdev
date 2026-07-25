'use strict';

class InventoryReorderService {
  calculate(inventoryItems) {
    const shortages = inventoryItems
      .map((item) => {
        const quantity = Number(item.qty ?? item.quantity ?? 0);
        const securityStock = Number(item.security_stock ?? 0);
        const reorderQuantity = Math.max(securityStock - quantity, 0);
        const unitCost = Number(item.unit_cost ?? item.cost ?? 0);
        return Object.freeze({
          product_id: item.product_id ?? item.id,
          quantity,
          security_stock: securityStock,
          reorder_quantity: reorderQuantity,
          unit_cost: unitCost,
          estimated_cost: reorderQuantity * unitCost,
        });
      })
      .filter(({ reorder_quantity: reorderQuantity }) => reorderQuantity > 0);

    return Object.freeze({
      shortages: Object.freeze(shortages),
      total_amount: shortages.reduce((sum, item) => sum + item.estimated_cost, 0),
    });
  }
}

module.exports = InventoryReorderService;
