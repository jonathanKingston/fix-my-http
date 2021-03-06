function looksLikeATestPage() {
  const heading = document.querySelector("body > h1:nth-child(1)");
  if (heading && heading.textContent.startsWith("Apache 2 Test Page")) {
    return true;
  }
  const nginxHeading = document.querySelector("html body h1");
  if (nginxHeading && nginxHeading.textContent == "Welcome to nginx!") {
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

      window.location.replace(url);
    }
  }
}

if (looksLikeATestPage()) {
  loadArchivePage();
}
