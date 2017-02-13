// Upgrade all URLs to be https
browser.webRequest.onBeforeRequest.addListener(evt => {
  const url = new URL(evt.url);
  if (url.protocol == 'http:') {
    url.protocol='https:';
    return {redirectUrl: String(url)};
  }
}, {
  urls: ["http://*/*"],
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
  const savePath = "https://web.archive.org/save/";
  if (responseDetails.frameId !== 0) {
    return;
  }

  if (!responseDetails.url.startsWith(savePath)) {
    changeUrl(responseDetails.tabId, "about:blank");
    const url = new URL(responseDetails.url);
    url.protocol = "http:";

    const fetchUrl = "https://archive.org/wayback/available?url=" + url;
    fetch(fetchUrl).then((e) => {
      console.log('eee', e);
      e.json().then((r) => {
        console.log('json res', r)
        const closest = getClosest(r);
        if (closest) {
          changeUrl(responseDetails.tabId, r["archived_snapshots"]["closest"]["url"]);
        } else {
          changeUrl(responseDetails.tabId, savePath + url);
        }
      });
    });

  }
}

/* Capture https errors and deal with them */
browser.webRequest.onErrorOccurred.addListener(
  handleError,
  {
    urls: ["<all_urls>"],
    types: ["main_frame"]
  }
);

// Check issues in uprated http requests
browser.webRequest.onCompleted.addListener(
  (details) => {
    console.log('onCompleted: ' + details.url, details);
  },
  {
    urls: ["https://*/*"],
    types: ["main_frame"]
  }
);
