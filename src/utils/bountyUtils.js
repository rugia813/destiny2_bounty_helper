/**
 * Categorizes a text description into an activity type
 * @param {string} text - The text to categorize
 * @returns {string} The activity category
 */
export function categorizeActivity(text) {
  if (!text) return 'misc';
  text = text.toLowerCase();
  // Order matters - check more specific categories first
  if (text.includes('crucible')) return 'crucible';
  if (text.includes('gambit')) return 'gambit';
  if (text.includes('strike') || text.includes('vanguard')) return 'strikes';
  if (text.includes('throne world') || text.includes('savathun')) return 'throneworld';
  if (text.includes('neomuna')) return 'neomuna';
  if (text.includes('seasonal') || text.includes('ritual')) return 'seasonal';
  return 'misc';
}

/**
 * Finds matching keyword index from a list of keywords
 * @param {string} text - The text to search in
 * @param {string[]} keywords - List of keywords to match against
 * @returns {number} Index of the matching keyword, or keywords.length if no match
 */
export function findKeywordIndex(text, keywords) {
  if (!text) return keywords.length;
  text = text.toLowerCase();
  for (let i = 0; i < keywords.length; i++) {
    if (text.includes(keywords[i].toLowerCase())) {
      return i;
    }
  }
  return keywords.length;
}

/**
 * Initializes a categorized bounties structure
 * @param {string[]} activities - List of activity categories
 * @param {number} keywordCount - Number of keywords plus one for uncategorized
 * @returns {Object} Initialized categorized bounties structure
 */
export function initializeBountiesStructure(activities, keywordCount) {
  const categoriesMap = {};
  activities.forEach(act => {
    categoriesMap[act.toLowerCase()] = new Array(keywordCount).fill(null).map(() => []);
  });
  return {
    ...categoriesMap,
    misc: new Array(keywordCount).fill(null).map(() => []),
    count: new Array(keywordCount).fill(0)
  };
}

/**
 * Processes challenge objectives with manifest data
 * @param {Object} record - Challenge record from API
 * @param {Object} recordDef - Record definition from manifest
 * @param {Function} getObjectiveDef - Function to get objective definitions
 * @returns {Array} Processed objectives
 */
export function processObjectives(record, recordDef, getObjectiveDef) {
  return (record.objectives || []).map(apiObjective => {
    const objectiveDef = getObjectiveDef(apiObjective.objectiveHash);

    return {
      hash: apiObjective.objectiveHash,
      complete: apiObjective.complete || false,
      progress: apiObjective.progress || 0,
      completionValue: objectiveDef?.completionValue ||
        recordDef.objectives?.find(o => o.objectiveHash === apiObjective.objectiveHash)?.completionValue || 1,
      progressDescription: objectiveDef?.progressDescription || 'Complete Objective'
    };
  }).filter(obj => obj !== null);
}

/**
 * Creates a challenge object from record data
 * @param {Object} record - Challenge record from API
 * @param {Object} recordDef - Record definition from manifest
 * @param {Object} state - Challenge state flags
 * @param {Array} objectives - Processed objectives
 * @returns {Object} Formatted challenge object
 */
export function createChallengeObject(record, recordDef, state, objectives) {
  const { objectiveNotCompleted, recordRedeemed, isRedeemable } = state;

  return {
    hash: recordDef.hash,
    name: recordDef.displayProperties?.name || 'Unknown Challenge',
    description: recordDef.displayProperties?.description || '',
    icon: recordDef.displayProperties?.icon,
    complete: !objectiveNotCompleted && !isRedeemable,
    state: {
      raw: record.state || 0,
      redeemed: recordRedeemed,
      redeemable: isRedeemable,
      inProgress: objectives.some(obj => !obj.complete && obj.progress > 0),
      objectiveNotCompleted
    },
    objectives,
    objectiveProgress: objectives.length > 0 ? {
      complete: objectives.filter(obj => obj.complete).length,
      total: objectives.length
    } : null,
    rewardItems: recordDef.rewardItems || [] // Include rewardItems from recordDef
  };
}