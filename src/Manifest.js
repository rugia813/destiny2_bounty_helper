import _axios, { getManifest } from "./api";
import axios from 'axios'
import { set, get } from "idb-keyval";

class Manifest {
    urls
    tables = {}
    ready = false

    constructor() {

    }

    async fetchManifest() {
        const res = await getManifest()
        this.urls = res.data.Response

        try {
            const ver = await get('ver')
            if (ver !== this.jsonUrl) throw 'manifest is outdated'

            const cache = await get('destiny2Manifest')
            if (cache.DestinyInventoryItemDefinition) {
                console.log('load manifest from cache: ', cache);
                this.tables = cache
                this.ready = true
                return true
            }
        } catch (error) {
            console.log('error: ', error);
        }

        const res2 = await axios.get('https://www.bungie.net' + this.jsonUrl)
        console.log('fetched manifest: ', res2);
        this.ready = true
        this.tables.DestinyInventoryItemDefinition = res2.data
        set('destiny2Manifest', {
            DestinyInventoryItemDefinition: this.tables.DestinyInventoryItemDefinition
        })
        set('ver', this.jsonUrl)
        return true
    }

    get jsonUrl() {
        return this.urls['jsonWorldComponentContentPaths']['en']['DestinyInventoryItemDefinition']
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