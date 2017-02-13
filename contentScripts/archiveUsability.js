const links = document.querySelectorAll('a');
const forms = document.querySelectorAll('form');
const hrefMatcher = /^\/web\/[^\/]+\/(https:\/\/.*)/;
const actionMatcher = /^\/web\/[^\/]+\/(https?:\/\/.*)/;

function rewritePageActions() {
  /* Fix all links to https pages to be direct to the page itself.
     HTTP pages for now are more usable to the archive and faster.
     TODO: consider fixing external HTTP origins be HTTPS */
  [...links].forEach((el) => {
    const href = el.getAttribute("href");
    if (href) {
      const hrefMatch = href.match(hrefMatcher);
      if (hrefMatch !== null) {
        el.setAttribute("href", hrefMatch[1]);
      }
    }
  });
  /* Fixup forms to be https, if they fail well tough I guess */
  [...forms].forEach((el) => {
    const action = el.getAttribute("action");
    if (action) {
      const actionMatch = action.match(actionMatcher);
      if (actionMatch !== null) {
        el.setAttribute("action", actionMatch[1].replace(/^http:/, 'https:'));
      }
    }
  });
}

function reloadIfError() {
  const errorHeader = document.querySelector("#error > h2");
  const noIndexError = "Page cannot be displayed due to robots.txt.";
  const pageDownError = "Bummer.";

  if (errorHeader) {
    if (errorHeader.textContent == pageDownError) {
      // TODO add limiting here
      window.location.reload()
      return true;
    }
    if (errorHeader.textContent == noIndexError) {
      // Message background script to store origin to be loaded into a container
      // TODO
      return true;
    }
  }
}

function closeModal() {
  const elem = document.getElementById("__wb_record_content_done");
  if (elem) {
    elem.style.display = "none";
  }

  const elemOverlay = document.getElementById("__wb_done_overlay_div");
  if (elemOverlay) {
    elem.style.display = "none";
  }
  return true;
}

// Check for redirection headers
function checkForRedirect() {
  const redirectError = document.querySelector('#error .impatient a[href]');
  if (redirectError) {
    const hrefMatch = redirectError.getAttribute('href').match(hrefMatcher);
    if (hrefMatch != null) {
      location.href = hrefMatch[1];
      return true;
    }
  }
}

function checkPageForErrors() {
  const elem = document.getElementById("__wb_record_content_done");
  if (checkForRedirect()) {
    return true;
  }
  if (reloadIfError()) {
    return true;
  }
  if (elem) {
    return closeModal();
  }
  return false;
}

let loop = 0;
let documentLoaded = false;
let foundErrors = false;
function checkLoop() {
  if (checkPageForErrors()) {
    foundErrors = true;
    return;
  } else {
    ++loop;
    if (loop<10 && !documentLoaded && !foundErrors) {
      setTimeout(checkLoop, 300);
    }
  }
}
checkLoop();

document.addEventListener('DOMContentLoaded', (e) => {
  documentLoaded = true;
  if (!foundErrors) {
    checkPageForErrors();
    rewritePageActions();
  }
});
