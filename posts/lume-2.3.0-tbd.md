---
title: Lume 2.3.0 - TBD
draft: true
tags: []
comments: {}
---

## New function `parseBasename`

When Lume loads a page file, the basename (the filename after removing the
extension) is parsed in order to extract additional data. This feature makes
possible that, for instance, if the basename starts with `yyyy-mm-dd_*`, Lume
extract this value
[to set the page date](https://lume.land/docs/creating-pages/page-files/#page-date),
and remove it from the final name. For example the file
`2020-06-21_hello-world.md` generates the page `/hello-world/`.

As of Lume 2.3.0, you can configure additional parsers thanks to the new
function `site.parseBasename`.

Let's say we have want to use a variable named `order` to sort pages in a menu,
and we want to extract this value from the basename. For example the file
`12.hello-world.md` outputs the page `/hello-world/` and set `12` as the `order`
variable. We can create a function to parse the basename, save the order value
and remove it from the final url:

```js
site.parseBasename((basename, data) => {
  // Regexp to detect the order pattern
  const match = basename.match(/(\d+)\.(.+)/);

  if (match) {
    const [, order, newBasename] = match;
    data.order = parseInt(order); // Save the order value in the page data
    return newBasename; // Return the new basename without the order prefix.
  }

  data.order = 0; // Set the default order to 0
  return basename; // Return the basename without modifications
});
```

As you can see, the function is simple: it receives the filename (without
extension) and an object to store the extracted values. The function must return
a string with the new basename, that will be used to generate the final URL.

> [!note]
>
> Keep in mind that the `data` object passed to this function does not contain
> the final data of the page yet, it's just a temporary object that will be
> merged later with the page data (a.k.a. the front matter). The front matter
> can override a variable defined in this function.

The `parseBasename` function is used not only for files, but also folders. This
allows to extract values from a folder name and store them as
[shared data](https://lume.land/docs/creating-pages/shared-data/), so they are
available to all pages inside.
