/**
 * Generates a default ruleset for cluster generation
 * Parameters can be overwritten by the player to customize cluster properties
 */
function clusterRuleSet() {
  return {
    cluster: {
      size: {
        min: 200,
        max: 800
      }
    },
    constellation: {
      size: {
        min: 2,
        max: 10
      }
    },
    solarSystem: {
      planets: {
        min: 2,
        max: 10
      }
    }
  }
}

export default clusterRuleSet;