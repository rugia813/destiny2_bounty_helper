import _axios, { getManifest } from "@/api";
import axios from 'axios'
import { set, get } from "idb-keyval";

class Manifest {
    urls
    tables = {}

    constructor() {

    }

    async fetchManifest() {
        const res = await getManifest()
        this.urls = res.data.Response

        try {
            const cache = await get('destiny2Manifest')
            if (cache.DestinyInventoryItemDefinition) {
                console.log('cache: ', cache);
                this.tables = cache
                return true
            }
        } catch (error) {
            console.log('error: ', error);
        }

        const res2 = await axios.get('https://www.bungie.net' + this.urls['jsonWorldComponentContentPaths']['en']['DestinyInventoryItemDefinition'])
        console.log('res2: ', res2);
        this.tables.DestinyInventoryItemDefinition = res2.data
        set('destiny2Manifest', {
            DestinyInventoryItemDefinition: this.tables.DestinyInventoryItemDefinition
        })
        return true
    }

    t(hash) {
        try {
            return this.tables.DestinyInventoryItemDefinition[hash]
        } catch(e) {
            return hash
        }
    }
}

export default new Manifest()

/** 
DestinyAchievementDefinition: "/common/destiny2_content/json/en/DestinyAchievementDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyActivityDefinition: "/common/destiny2_content/json/en/DestinyActivityDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyActivityGraphDefinition: "/common/destiny2_content/json/en/DestinyActivityGraphDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyActivityInteractableDefinition: "/common/destiny2_content/json/en/DestinyActivityInteractableDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyActivityModeDefinition: "/common/destiny2_content/json/en/DestinyActivityModeDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyActivityModifierDefinition: "/common/destiny2_content/json/en/DestinyActivityModifierDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyActivityTypeDefinition: "/common/destiny2_content/json/en/DestinyActivityTypeDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyArtDyeChannelDefinition: "/common/destiny2_content/json/en/DestinyArtDyeChannelDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyArtDyeReferenceDefinition: "/common/destiny2_content/json/en/DestinyArtDyeReferenceDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyArtifactDefinition: "/common/destiny2_content/json/en/DestinyArtifactDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyBondDefinition: "/common/destiny2_content/json/en/DestinyBondDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyBreakerTypeDefinition: "/common/destiny2_content/json/en/DestinyBreakerTypeDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyCharacterCustomizationCategoryDefinition: "/common/destiny2_content/json/en/DestinyCharacterCustomizationCategoryDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyCharacterCustomizationOptionDefinition: "/common/destiny2_content/json/en/DestinyCharacterCustomizationOptionDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyChecklistDefinition: "/common/destiny2_content/json/en/DestinyChecklistDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyClassDefinition: "/common/destiny2_content/json/en/DestinyClassDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyCollectibleDefinition: "/common/destiny2_content/json/en/DestinyCollectibleDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyDamageTypeDefinition: "/common/destiny2_content/json/en/DestinyDamageTypeDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyDestinationDefinition: "/common/destiny2_content/json/en/DestinyDestinationDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyEnemyRaceDefinition: "/common/destiny2_content/json/en/DestinyEnemyRaceDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyEnergyTypeDefinition: "/common/destiny2_content/json/en/DestinyEnergyTypeDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyEntitlementOfferDefinition: "/common/destiny2_content/json/en/DestinyEntitlementOfferDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyEquipmentSlotDefinition: "/common/destiny2_content/json/en/DestinyEquipmentSlotDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyFactionDefinition: "/common/destiny2_content/json/en/DestinyFactionDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyGenderDefinition: "/common/destiny2_content/json/en/DestinyGenderDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyInventoryBucketDefinition: "/common/destiny2_content/json/en/DestinyInventoryBucketDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyInventoryItemDefinition: "/common/destiny2_content/json/en/DestinyInventoryItemDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyInventoryItemLiteDefinition: "/common/destiny2_content/json/en/DestinyInventoryItemLiteDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyItemCategoryDefinition: "/common/destiny2_content/json/en/DestinyItemCategoryDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyItemTierTypeDefinition: "/common/destiny2_content/json/en/DestinyItemTierTypeDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyLocationDefinition: "/common/destiny2_content/json/en/DestinyLocationDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyLoreDefinition: "/common/destiny2_content/json/en/DestinyLoreDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyMaterialRequirementSetDefinition: "/common/destiny2_content/json/en/DestinyMaterialRequirementSetDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyMedalTierDefinition: "/common/destiny2_content/json/en/DestinyMedalTierDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyMetricDefinition: "/common/destiny2_content/json/en/DestinyMetricDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyMilestoneDefinition: "/common/destiny2_content/json/en/DestinyMilestoneDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyNodeStepSummaryDefinition: "/common/destiny2_content/json/en/DestinyNodeStepSummaryDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyObjectiveDefinition: "/common/destiny2_content/json/en/DestinyObjectiveDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyPlaceDefinition: "/common/destiny2_content/json/en/DestinyPlaceDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyPlatformBucketMappingDefinition: "/common/destiny2_content/json/en/DestinyPlatformBucketMappingDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyPlugSetDefinition: "/common/destiny2_content/json/en/DestinyPlugSetDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyPresentationNodeBaseDefinition: "/common/destiny2_content/json/en/DestinyPresentationNodeBaseDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyPresentationNodeDefinition: "/common/destiny2_content/json/en/DestinyPresentationNodeDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyProgressionDefinition: "/common/destiny2_content/json/en/DestinyProgressionDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyProgressionLevelRequirementDefinition: "/common/destiny2_content/json/en/DestinyProgressionLevelRequirementDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyProgressionMappingDefinition: "/common/destiny2_content/json/en/DestinyProgressionMappingDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyRaceDefinition: "/common/destiny2_content/json/en/DestinyRaceDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyRecordDefinition: "/common/destiny2_content/json/en/DestinyRecordDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyReportReasonCategoryDefinition: "/common/destiny2_content/json/en/DestinyReportReasonCategoryDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyRewardAdjusterPointerDefinition: "/common/destiny2_content/json/en/DestinyRewardAdjusterPointerDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyRewardAdjusterProgressionMapDefinition: "/common/destiny2_content/json/en/DestinyRewardAdjusterProgressionMapDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyRewardItemListDefinition: "/common/destiny2_content/json/en/DestinyRewardItemListDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyRewardMappingDefinition: "/common/destiny2_content/json/en/DestinyRewardMappingDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyRewardSheetDefinition: "/common/destiny2_content/json/en/DestinyRewardSheetDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyRewardSourceDefinition: "/common/destiny2_content/json/en/DestinyRewardSourceDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinySackRewardItemListDefinition: "/common/destiny2_content/json/en/DestinySackRewardItemListDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinySandboxPatternDefinition: "/common/destiny2_content/json/en/DestinySandboxPatternDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinySandboxPerkDefinition: "/common/destiny2_content/json/en/DestinySandboxPerkDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinySeasonDefinition: "/common/destiny2_content/json/en/DestinySeasonDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinySeasonPassDefinition: "/common/destiny2_content/json/en/DestinySeasonPassDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinySocketCategoryDefinition: "/common/destiny2_content/json/en/DestinySocketCategoryDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinySocketTypeDefinition: "/common/destiny2_content/json/en/DestinySocketTypeDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyStatDefinition: "/common/destiny2_content/json/en/DestinyStatDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyStatGroupDefinition: "/common/destiny2_content/json/en/DestinyStatGroupDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyTalentGridDefinition: "/common/destiny2_content/json/en/DestinyTalentGridDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyTraitCategoryDefinition: "/common/destiny2_content/json/en/DestinyTraitCategoryDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyTraitDefinition: "/common/destiny2_content/json/en/DestinyTraitDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyUnlockCountMappingDefinition: "/common/destiny2_content/json/en/DestinyUnlockCountMappingDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyUnlockDefinition: "/common/destiny2_content/json/en/DestinyUnlockDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyUnlockEventDefinition: "/common/destiny2_content/json/en/DestinyUnlockEventDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyUnlockExpressionMappingDefinition: "/common/destiny2_content/json/en/DestinyUnlockExpressionMappingDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyUnlockValueDefinition: "/common/destiny2_content/json/en/DestinyUnlockValueDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyVendorDefinition: "/common/destiny2_content/json/en/DestinyVendorDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"
DestinyVendorGroupDefinition: "/common/destiny2_content/json/en/DestinyVendorGroupDefinition-cc52c036-30c0-4405-a216-15267b69d370.json"

 */