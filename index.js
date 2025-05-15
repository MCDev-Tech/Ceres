import { loaders } from "./loader"
import { formatNameString } from "./util"
import { getFromModrinth } from "./version"

export const releaseVersions = [], snapshotVersions = []
const data = {}, failedText = '<span style="color:red">No Available Version</span>'
let customMods

export function getOrCreateVersionData(key) {
    if (!data[key]) data[key] = {}
    return data[key]
}

window.onload = async _ => {
    createCard(document.getElementById('loaders'), 'img/forge.webp', 'Forge', 'forge', false)
    createCard(document.getElementById('loaders'), 'img/fabric.webp', 'Fabric', 'fabric', false)
    createCard(document.getElementById('loaders'), 'img/neoforge.webp', 'NeoForge', 'neoforge', false)

    let versions = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json').then(res => res.json()).catch(err => console.log(err))
    for (let { id, type } of versions.versions)
        if (type === 'release') releaseVersions.push(id)
        else if (type === 'snapshot') snapshotVersions.push(id)

    let mcVersion = document.getElementById('mcVersion')
    mcVersion.innerHTML = ''
    releaseVersions.forEach(x => mcVersion.innerHTML += `<option value=${x}>${x}</option>`)
    mcVersion.value = window.localStorage.getItem('mcVersion') ?? versions.latest.release

    customMods = JSON.parse(window.localStorage.getItem('customMods') ?? '[]')
    await Promise.all(customMods.map(initializeCard))
    await Promise.all([...loaders, ...customMods.map(getFromModrinth)].map(fn => Promise.resolve().then(fn)))
    console.log(data)

    if (import.meta.env.MODE !== 'production') {
        window.data = data
        window.customMods = customMods
    }
}

window.addNewVersion = async _ => {
    let slug = document.getElementById('slug').value
    if (customMods.indexOf(slug) >= 0) return alert('This project has been added!')
    let meta = await fetch(`https://api.modrinth.com/v2/project/${slug}`).then(res => res.json()).catch(_ => alert('cannot find such project'))
    if (meta) {
        customMods.push(slug)
        window.localStorage.setItem('customMods', JSON.stringify(customMods))
        createCard(document.getElementById('mods'), meta.icon_url, meta.title, slug, true)
        getFromModrinth(slug)
        hideForm()
    }
}

window.hideForm = _ => {
    document.getElementById('addNew').hidden = true
    document.getElementById('slug').value = ''
}

window.updateAll = _ => {
    ['forge', 'fabric', 'neoforge', ...customMods].forEach(updateVersion)
    window.localStorage.setItem('mcVersion', document.getElementById('mcVersion').value)
}

const initializeCard = async slug => {
    createCard(document.getElementById('mods'), 'img/unknown.webp', slug, slug, true)
    let meta = await fetch(`https://api.modrinth.com/v2/project/${slug}`).then(res => res.json()).catch(_ => alert('cannot find such project'))
    if (meta) {
        document.getElementById('logo-' + slug).src = meta.icon_url
        document.getElementById('title-' + slug).innerText = meta.title
    } else {
        customMods.remove(slug)
        window.localStorage.setItem('customMods', JSON.stringify(customMods))
    }
}

export function updateVersion(slug) {
    document.getElementById('verions-' + slug).innerHTML = calculateVerionText(slug, document.getElementById('mcVersion').value)
}

const calculateVerionText = (slug, mcVersion) => {
    let d = data[mcVersion]
    if (!d) return failedText
    switch (slug) {
        case 'forge': return d.forge ?? failedText
        case 'fabric': return `Loader: ${d.fabric ?? failedText}<br>Yarn: ${d.yarn?.name ?? failedText}`
        case 'neoforge': return d.neoforge ?? failedText
        default:
            if (d[slug])
                return Object.keys(d[slug]).map(x => `${formatNameString(x)}: ${d[slug][x].version} (${d[slug][x].id})`).join('<br>')
            else return failedText
    }
}

const createCard = (container, imgSrc, title, slug, canDelete) => {
    let item = document.createElement('div')
    item.className = 'item'
    item.style.position = 'relative'
    container.appendChild(item)

    if (canDelete) {
        let closeBtn = document.createElement('button')
        closeBtn.innerHTML = '&times;'
        closeBtn.className = 'close-btn'
        closeBtn.addEventListener('click', () => {
            item.remove()
            customMods.remove(slug)
            window.localStorage.setItem('customMods', JSON.stringify(customMods))
        })
        item.appendChild(closeBtn)
    }

    let mainFlex = document.createElement('div')
    mainFlex.style.display = 'flex'

    let img = document.createElement('img')
    img.id = 'logo-' + slug
    img.className = 'logo-img'
    img.src = imgSrc
    img.style.margin = '10px'
    mainFlex.appendChild(img)

    let nameH1 = document.createElement('h2')
    nameH1.id = 'title-' + slug
    nameH1.innerText = title
    nameH1.style.margin = '10px'
    nameH1.style.textAlign = 'center'
    mainFlex.appendChild(nameH1)

    item.append(mainFlex)

    let version = document.createElement('div')
    version.id = 'verions-' + slug
    version.innerHTML = 'Loading...'
    version.className = 'version'
    item.append(version)
}