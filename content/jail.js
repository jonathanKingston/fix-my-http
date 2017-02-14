window.addEventListener("load", () => {
  const sandBox = document.querySelector("iframe");
  const url = new URL(location.href);
  sandBox.setAttribute("src", url.searchParams.get("url"));
});
