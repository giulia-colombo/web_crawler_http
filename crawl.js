const {JSDOM} = require('jsdom')

async function crawlPage (baseURL, currentURL, pages) {
    const baseURLObj = new URL (baseURL)
    const currentURLObj = new URL (currentURL)
    if (baseURLObj.hostname !== currentURLObj.hostname) {
        return pages
    }

    const normalizedCurrentURL = normalizeURL(currentURL)

    if (pages[normalizedCurrentURL] > 0) {
        pages[normalizedCurrentURL]++
        return pages
    }

    pages[normalizedCurrentURL] = 1
    console.log(`Actively crawling: ${currentURL}`)

    try {
        const res = await fetch(currentURL)
        
        if (res.status > 399) {
            console.log(`error in fetch with status code ${res.status} on page ${currentURL}`)
            return pages
        }

        const contentType = res.headers.get("content-type")
        
        if (!contentType.includes("text/html")) {
            console.log(`Non HTML response, content type ${contentType} on page ${currentURL}`)
            return pages
        }

        const htmlBody = await res.text()

        const nextURLs = getURLsfromHTML(htmlBody, baseURL)

        for (const nextURL of nextURLs) {
            pages = await crawlPage(baseURL, nextURL, pages)
        }
        return pages

    } catch (error) {
        console.log(`Error fetching ${error.message}, on page ${currentURL}`)
    }

}

function getURLsfromHTML(htmlBody, baseURL) {
    const urls = []
    const dom = new JSDOM(htmlBody)
   const linkElements = dom.window.document.querySelectorAll('a')
   for (const linkElement of linkElements) {
    if (linkElement.href.slice(0, 1) === '/') {
        // rel
        try {
            const urlObj = new URL(`${baseURL}${linkElement.href}`)
            urls.push(urlObj.href)
        } catch (error) {
            console.log(`Error with relative url ${error.message}`)
        }

    } else {
        // abs 
        try {
            const urlObj = new URL(linkElement.href)
            urls.push(urlObj.href)            
        } catch (error) {
            console.log(`Error with absolute url ${error.message}`)
        }
    }
   }
    return urls
}

function normalizeURL(urlString) {
    const urlObj = new URL(urlString)
    const hostPath = `${urlObj.hostname}${urlObj.pathname}`
    if (hostPath.length > 0 && hostPath.slice(-1) === '/' ) {
        return hostPath.slice(0, -1)
    }
    return hostPath
}



module.exports = {
    normalizeURL, 
    getURLsfromHTML,
    crawlPage
}