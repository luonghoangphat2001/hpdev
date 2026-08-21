/**
 * @fileoverview menu-analysis.service - Provides menu-analysis functionality.
 */
'use strict';

/**
 * MenuAnalysisService
 * Manages menu analysis logic.
 */
class MenuAnalysisService {
  constructor({
    slowSalesThreshold = 5,
    minimumMarginRate = 0.2,
  } = {}) {
    this.slowSalesThreshold = slowSalesThreshold;
    this.minimumMarginRate = minimumMarginRate;
  }

  /**
   * analyze - Executes analyze.
   * @param {*} products - Input parameter.
   * @returns {*} Result of operation.
   */
  analyze(products) {
    return products.map((product) => {
      const price = Number(product.price || 0);
      const cost = Number(product.cost || 0);
      const salesCount = Number(product.sales_count || 0);
      const marginRate = price > 0 ? (price - cost) / price : 0;
      const signals = [];

      if (salesCount <= this.slowSalesThreshold) {
        signals.push('slow_sales');
      }
      if (marginRate < this.minimumMarginRate) {
        signals.push('low_margin');
      }

      return Object.freeze({
        product_id: product.id,
        product_name: product.name,
        sales_count: salesCount,
        margin_rate: Number(marginRate.toFixed(4)),
        signals: Object.freeze(signals),
      });
    });
  }
}

module.exports = MenuAnalysisService;
