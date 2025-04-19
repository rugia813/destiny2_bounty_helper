import { getManifest } from "./api";
import axios from 'axios';
import { get, set } from "idb-keyval";

// Define the tables we need
const requiredTables = [
    'DestinyInventoryItemDefinition',
    'DestinyRecordDefinition',
    'DestinyPresentationNodeDefinition',
    'DestinyObjectiveDefinition' // Often needed for objective details
];

class Manifest {
    urls = null;
    tables = {};
    ready = false;
    loadingPromise = null; // To prevent multiple concurrent fetches

    constructor() {
        // No immediate action needed here now
    }

    async fetchManifest() {
        // If already loading or ready, return the existing promise/status
        if (this.loadingPromise) return this.loadingPromise;
        if (this.ready) return true;

        this.loadingPromise = (async () => {
            try {
                console.log("Fetching manifest details...");
                const res = await getManifest();
                if (!res?.data?.Response) throw new Error("Invalid manifest response structure");
                this.urls = res.data.Response;

                const version = this.urls.version; // Use the overall manifest version
                const storedVersion = await get('manifestVersion');

                console.log(`Current Manifest Version: ${version}, Stored Version: ${storedVersion}`);

                if (version === storedVersion) {
                    console.log("Manifest version matches stored version. Attempting to load from cache...");
                    let loadedFromCache = true;
                    for (const tableName of requiredTables) {
                        const tableData = await get(tableName);
                        if (tableData) {
                            this.tables[tableName] = tableData;
                            console.log(`Loaded ${tableName} from cache.`);
                        } else {
                            console.warn(`Cache miss for ${tableName}. Full download required.`);
                            loadedFromCache = false;
                            break; // Exit loop, need to download everything
                        }
                    }
                    if (loadedFromCache) {
                        console.log("Successfully loaded all required manifest tables from cache.");
                        this.ready = true;
                        this.loadingPromise = null;
                        return true;
                    }
                } else {
                    console.log("Manifest version mismatch or no stored version. Downloading new manifest...");
                }

                // Clear old tables if version mismatched
                this.tables = {};

                // Fetch all required tables
                const tablePromises = requiredTables.map(async (tableName) => {
                    const path = this.urls.jsonWorldComponentContentPaths?.en?.[tableName];
                    if (!path) {
                        console.error(`Manifest path for ${tableName} not found!`);
                        return; // Skip this table
                    }
                    const fullUrl = 'https://www.bungie.net' + path;
                    console.log(`Fetching ${tableName} from ${fullUrl}...`);
                    try {
                        const tableRes = await axios.get(fullUrl);
                        this.tables[tableName] = tableRes.data;
                        await set(tableName, tableRes.data); // Store in IndexedDB
                        console.log(`Successfully fetched and cached ${tableName}.`);
                    } catch (fetchError) {
                        console.error(`Failed to fetch ${tableName} from ${fullUrl}:`, fetchError);
                        throw new Error(`Failed to download manifest table: ${tableName}`);
                    }
                });

                await Promise.all(tablePromises);

                // Store the new version
                await set('manifestVersion', version);
                console.log(`Manifest download complete. Stored version: ${version}`);

                this.ready = true;
                this.loadingPromise = null;
                return true;

            } catch (error) {
                console.error("Manifest fetch failed:", error);
                this.ready = false;
                this.loadingPromise = null;
                return false;
            }
        })();

        return this.loadingPromise;
    }

    // Force a fresh manifest download by clearing the cache
    async clearCache() {
        console.log("Clearing manifest cache...");
        try {
            // Clear all cached tables
            await Promise.all([
                set('manifestVersion', null),
                ...requiredTables.map(tableName => set(tableName, null))
            ]);

            // Reset instance state
            this.urls = null;
            this.tables = {};
            this.ready = false;
            this.loadingPromise = null;

            console.log("Manifest cache cleared. Ready for fresh download.");
            return true;
        } catch (error) {
            console.error("Failed to clear manifest cache:", error);
            return false;
        }
    }

    // Get Inventory Item Definition (original 't' function)
    t(hash) {
        return this.tables.DestinyInventoryItemDefinition?.[hash];
    }

    // Get Record Definition
    getRecordDef(hash) {
        const def = this.tables.DestinyRecordDefinition?.[hash];
        if (def?.objectives) {
            console.log(`Record ${hash} (${def.displayProperties?.name}) has objectives:`, {
                objectiveCount: def.objectives.length,
                sampleObjective: def.objectives[0]
            });
        }
        return def;
    }

    // Get Presentation Node Definition
    getPresentationNodeDef(hash) {
        return this.tables.DestinyPresentationNodeDefinition?.[hash];
    }

    // Get Objective Definition
    getObjectiveDef(hash) {
        const def = this.tables.DestinyObjectiveDefinition?.[hash];
        if (!def) {
            console.warn(`Missing objective definition for hash ${hash}`);
        } else {
            console.log(`Found objective ${hash}:`, {
                description: def.progressDescription,
                completionValue: def.completionValue,
                valueStyle: def.valueStyle
            });
        }
        return def;
    }

    // Recursively find all record hashes under a given presentation node
    getRecordHashesFromNode(nodeHash) {
        if (!this.ready || !this.tables.DestinyPresentationNodeDefinition || !this.tables.DestinyRecordDefinition) {
            console.warn("Manifest not ready or missing required tables for getRecordHashesFromNode");
            return [];
        }

        const visitedNodes = new Set(); // Prevent infinite loops in case of cyclic references
        const recordHashes = new Set();

        const traverse = (currentNodeHash) => {
            if (visitedNodes.has(currentNodeHash)) {
                return; // Already visited
            }
            visitedNodes.add(currentNodeHash);

            const nodeDef = this.getPresentationNodeDef(currentNodeHash);
            if (!nodeDef) {
                return;
            }

            // Add records directly associated with this node
            if (nodeDef.children?.records) {
                nodeDef.children.records.forEach(record => recordHashes.add(record.recordHash));
            }

            // Recursively traverse child presentation nodes
            if (nodeDef.children?.presentationNodes) {
                nodeDef.children.presentationNodes.forEach(childNode => traverse(childNode.presentationNodeHash));
            }
        };

        traverse(nodeHash);
        return Array.from(recordHashes);
    }
}

export default new Manifest();