const splashURL = browser.extension.getURL("content/splash.html");
const archiveSavePath = "https://web.archive.org/save/";
const pageTimeout = 3000;

function getKey(requestId) {
  return `r_${requestId}`;
}

function storeInfo(requestId, data) {
  return browser.storage.local.set({
    [getKey(requestId)]: data
  });
}

function getInfo(requestId) {
  const key = getKey(requestId);
  return browser.storage.local.get([key]).then((res) => {
    if (res && key in res) {
      return res[key];
    }
    return false;
  });
}

function deleteInfo(requestId) {
  const key = getKey(requestId);
  browser.storage.local.remove(key);
}

// Pages sometimes timeout when uprating to https
// This function checks for the loading which onErrorOcurred doesn't catch
function checkForTimeout(requestId) {
  getInfo(requestId).then((request) => {
    if (request) {
      browser.tabs.get(request.tabId).then((tab) => {
        if (tab.status == "loading" && tab.url == "about:blank") {
          changeUrl(request.tabId, archiveSavePath + request.url);
        }
      });
      deleteInfo(requestId);
    }
  });
}

// Upgrade all URLs to be https
browser.webRequest.onBeforeRequest.addListener(evt => {
  const url = new URL(evt.url);
  if (url.protocol == 'http:') {
    url.protocol = 'https:';

    storeInfo(evt.requestId, {
      url: evt.url,
      tabId: evt.tabId,
      uplifted: true
    }).then((r) => {
      setTimeout(() => checkForTimeout(evt.requestId), pageTimeout);
    });

    return {redirectUrl: String(url)};
  }
}, {
  urls: ["http://*/*"],
  types: ["main_frame", "sub_frame"]
},
["blocking"]);

// Upgrade all https internet archive URLs to be https
browser.webRequest.onBeforeRequest.addListener(evt => {
  const hrefMatcher = /^\/web\/[^\/]+\/(https:\/\/.*)/;
  const pageUrl = new URL(evt.url);
  const httpsMatch = pageUrl.pathname.match(hrefMatcher);
  if (httpsMatch != null) {
    return {redirectUrl: httpsMatch[1]};
  }
}, {
  urls: ["https://web.archive.org/web/*"],
  types: ["main_frame"]
},
["blocking"]);

function changeUrl(tabId, url) {
  browser.tabs.update(tabId, {
    url: url
  });
}

function pad(value, length) {
  return (value.toString().length < length) ? pad("0"+value, length):value;
}

function getClosest(r) {
  if (r["archived_snapshots"] &&
      r["archived_snapshots"]["closest"] &&
      r["archived_snapshots"]["closest"]["timestamp"]) {
    const date = new Date();
    const dateString = `${date.getFullYear()}${pad(date.getMonth()+1, 2)}${pad(date.getDate(), 2)}`;
    const timestamp = r["archived_snapshots"]["closest"]["timestamp"];
    if (timestamp.startsWith(dateString)) {
      return timestamp;
    }
  }
  return false;
}

function handleError(responseDetails) {
  if (responseDetails.frameId !== 0) {
    return;
  }
  // Filter requests that don't happen in a tab
  if (responseDetails.tabId === -1) {
    return;
  }
  // This happens because ddg or other pages use location.replace before the window finishes loading
  if (responseDetails.error === "NS_BINDING_ABORTED") {
    return;
  }

  if (!responseDetails.url.startsWith(archiveSavePath)) {
    changeUrl(responseDetails.tabId, splashURL);
    const url = new URL(responseDetails.url);
    url.protocol = "http:";

    const fetchUrl = "https://archive.org/wayback/available?url=" + url;
    fetch(fetchUrl).then((e) => {
      e.json().then((r) => {
        const closest = getClosest(r);
        if (closest) {
          changeUrl(responseDetails.tabId, r["archived_snapshots"]["closest"]["url"]);
        } else {
          changeUrl(responseDetails.tabId, archiveSavePath + url);
        }
      });
    });

  }
}

/* Capture https errors and deal with them */
browser.webRequest.onErrorOccurred.addListener(
  handleError,
  {
    urls: ["https://*/*"],
    types: ["main_frame"]
  }
);

// Check issues in uprated http requests
browser.webRequest.onCompleted.addListener(
  (details) => {
    console.log("onCompleted: " + details.url, details);
    getInfo(details.requestId).then(request => {
      if (request) {
        console.log("Successfully uplifted request!", details, request);
        deleteInfo(details.requestId);
      }
    });
  },
  {
    urls: ["https://*/*"],
    types: ["main_frame"]
  },
  ["responseHeaders"]
);

// Upgrade-Insecure-Requests should make the redirection function less hot which hopefully should be a perf win
// It should also solve mixed content icons from the extension not catching requests too.
browser.webRequest.onHeadersReceived.addListener(
  (responseDetails) => {
    const uir = "upgrade-insecure-requests;";
    const cspHeader = "content-security-policy";
    let CSP = false;
    responseDetails.responseHeaders.map((header => {
      if (header.name.toLowerCase() === cspHeader) {
        CSP = true;
        header.value += `; ${uir}`;
      }
      return header;
    }));
    if (!CSP) {
      const CSPHeader = {
        name: cspHeader,
        value: uir
      };
      responseDetails.responseHeaders.push(CSPHeader);
    }
    return {responseHeaders: responseDetails.responseHeaders};
  },
  {
    urls: ["<all_urls>"],
    types: ["main_frame", "sub_frame"]
  },
  ["blocking", "responseHeaders"]
);
