/**
 * @fileoverview rnd-to-logistics - Provides rnd-to-logistics functionality.
 */
'use strict';

const { createCrossAgentHandoffDto } = require('../handoff.dto');

function createRnDToLogisticsHandoff({
  handoffId,
  workflowId,
  recipeId,
  recipeName,
  ingredients = [],
  estimatedDailyVolume = 0,
  deadlineAt,
}) {
  if (!recipeId || !recipeName) {
    throw new Error('recipeId and recipeName are required for R&D -> Logistics handoff');
  }

  const payload = {
    recipeId,
    recipeName,
    ingredients,
    estimatedDailyVolume,
    materialImpact: ingredients.map(ing => ({
      ingredientId: ing.id,
      requiredPerUnit: ing.quantity,
      estimatedDailyNeed: ing.quantity * estimatedDailyVolume,
    })),
  };

  return createCrossAgentHandoffDto({
    handoffId,
    sourceAgent: 'dan_rnd',
    targetAgent: 'dan_logistics',
    workflowId,
    contextRefs: [`recipe:${recipeId}`],
    payload,
    expectedResult: 'verify_material_availability_and_prepare_reorder',
    deadlineAt,
  });
}

module.exports = {
  createRnDToLogisticsHandoff,
};
