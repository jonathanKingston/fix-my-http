window.addEventListener("load", () => {
  const sandBox = document.querySelector("iframe");
  const url = new URL(location.href);
  sandBox.setAttribute("src", url.searchParams.get("url"));

/* TODO implement history checking
  sandBox.contentWindow.addEventListener("load", (event) => {
  });
  sandBox.contentWindow.onPopState = (event) => {
  };
*/
  document.querySelector("header > img").addEventListener("click", (event) => {
    sandBox.classList.add("removed");
  });
});
