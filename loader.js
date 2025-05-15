import { parseMavenMetadata, corsProxy, versionCompare } from './util'
import { getOrCreateVersionData, releaseVersions, snapshotVersions, updateVersion } from '.'

export const allLoaders = ['forge', 'fabric', 'neoforge']

const getForgeVersions = async _ => {
    let versions = await fetch('https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml').catch(err => console.log(err))
        .then(res => res.text())
        .then(xml => parseMavenMetadata(xml))
    for (let s of versions.versions) {
        let k = s.split('-')
        if (k.length < 2) continue
        let mc = k[0], forge = k[1], d = getOrCreateVersionData(mc)
        if (versionCompare(d.forge ?? '0.0.0', forge) < 0) d.forge = forge
    }
    updateVersion('forge')
}

const getFabricVersions = async _ => {
    let versions = await fetch('https://meta.fabricmc.net/v2/versions/loader').then(res => res.json()).catch(err => console.log(err))
    if (!versions) return
    let version = '0.0.0'
    for (let { version: v } of versions)
        if (versionCompare(version, v) < 0) version = v
    for (let v of releaseVersions) getOrCreateVersionData(v).fabric = version
    for (let v of snapshotVersions) getOrCreateVersionData(v).fabric = version
    updateVersion('fabric')
}

const getYarnVersions = async _ => {
    let versions = await fetch('https://meta.fabricmc.net/v2/versions/yarn').then(res => res.json()).catch(err => console.log(err))
    if (!versions) return
    for (let { gameVersion, version } of versions)
        getOrCreateVersionData(gameVersion).yarn = { name: version, legacy: false }
    versions = await fetch('https://meta.legacyfabric.net/v2/versions/yarn').then(res => res.json()).catch(err => console.log(err))
    if (!versions) return
    for (let { gameVersion, version } of versions)
        getOrCreateVersionData(gameVersion).yarn = { name: version, legacy: true }
    updateVersion('fabric')
}

const getNeoForgeVersions = async _ => {
    let versions = await corsProxy('https://maven.neoforged.net/net/neoforged/neoforge/maven-metadata.xml')
        .then(res => res.text())
        .then(xml => parseMavenMetadata(xml))
    if (!versions) return
    for (let s of versions.versions) {
        let n = s.split('.'), mc = n[0] == 0 ? n[1] : '1.' + (n[1] == 0 ? n[0] : n[0] + '.' + n[1]), d = getOrCreateVersionData(mc)
        if (versionCompare(d.neoforge ?? '0.0.0', s) < 0) d.neoforge = s
    }
    updateVersion('neoforge')
}

export const loaders = [getForgeVersions, getFabricVersions, getYarnVersions, getNeoForgeVersions]