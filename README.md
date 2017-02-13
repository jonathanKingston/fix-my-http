# Fix my HTTP

Upgrades all HTTP connections to be HTTPs, if a site doesn't work it will try and push the link to the way back machine.

Some fixes are done to the internet archive page to make it simpler to browse that way.

Will likely break your internet for HTTP pages that ban crawling and currently there isn't an undo button.

## TODO

- Increase number of checks for test/new server pages for HTTPS
- Reduce further breakage on using InternetArchive
- Consider solving uncrawlable HTTP pages

## Install

- Clone the repo or download to a directory
- Open about:debugging in Firefox
- Load temporary extension and browse the downloaded directory
- Click open on a file in the extension directory
