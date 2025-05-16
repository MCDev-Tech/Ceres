import { XMLParser } from 'fast-xml-parser'
import { compareVersions } from 'compare-versions'

export function parseMavenMetadata(xmlString) {
    const parser = new XMLParser()
    const result = parser.parse(xmlString)
    const metadata = result.metadata

    return {
        groupId: metadata.groupId,
        artifactId: metadata.artifactId,
        version: metadata.version,
        latest: metadata.versioning?.latest,
        release: metadata.versioning?.release,
        versions: Array.isArray(metadata.versioning?.versions?.version)
            ? metadata.versioning.versions.version
            : [metadata.versioning?.versions?.version].filter(Boolean),
        lastUpdated: metadata.versioning?.lastUpdated
    }
}

export function versionCompare(v1, v2) {
    try {
        return compareVersions(v1, v2)
    } catch {
        return -1
    }
}

export function formatNameString(name) {
    return name.toLowerCase().split('_').reduce((ret, word) => ret + word[0].toUpperCase() + word.slice(1) + ' ', '')
}

Array.prototype.remove = function () {
    for (var i = 0; i < arguments.length; i++) {
        var ele = arguments[i];
        var index = this.indexOf(ele)
        if (index > -1) this.splice(index, 1)
    }
}

Array.intersect = function (a, b) {
    return a.filter(function (n) {
        return b.indexOf(n) !== -1;
    });
};