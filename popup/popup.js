document.body.addEventListener("click", () => {
  const url = new URL(location.href);
  browser.runtime.sendMessage({
    loadJail: true,
    tabId: url.searchParams.get("tabId")
  });
});
