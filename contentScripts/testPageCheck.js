function looksLikeATestPage() {
  const heading = document.querySelector('body > h1:nth-child(1)');
  if (heading && heading.textContent.startsWith("Apache 2 Test Page")) {
    return true;
  }
  return false;
}

function loadArchivePage() {
  const savePath = "https://web.archive.org/save/";
  const page = window.location.href;

  if (!page.startsWith(savePath)) {
    const url = new URL(page);
    if (url.protocol == 'https:') {
      url.protocol = "http:";

      window.location.href = url;
    }
  }
}

if (looksLikeATestPage()) {
  loadArchivePage();
}
