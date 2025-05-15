import { getOrCreateVersionData, updateVersion } from "."
import { allLoaders } from "./loader"

export async function getFromModrinth(slug) {
    let versions = await fetch(`https://api.modrinth.com/v2/project/${slug}/version`).then(res => res.json()).catch(err => console.log(err))
    if (!versions) return
    for (let { game_versions, loaders, version_number, status, id } of versions) {
        if (status != 'listed') continue
        for (let gameVersion of game_versions) {
            let d = getOrCreateVersionData(gameVersion)
            if (!d[slug]) d[slug] = {}
            for (let loader of Array.intersect(loaders, allLoaders))
                if (!d[slug][loader])
                    d[slug][loader] = { version: version_number.endsWith(loader) ? version_number.slice(0, version_number.length - loader.length - 1) : version_number, id: id }
        }
    }
    updateVersion(slug)
}