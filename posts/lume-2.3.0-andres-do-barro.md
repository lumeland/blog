---
title: Lume 2.3.0 - Andrés do Barro
draft: true
tags:
  - Releases
comments: {}
date: '2024-09-01'
---

Lume 2.3.0 is dedicated to
[Andrés do Barro](https://en.wikipedia.org/wiki/Andr%C3%A9s_do_Barro), a
Galician singer and songwriter who was one of the first artists who achieved
international success singing in Galego. Among his songs, we can find
[Pandeirada](https://www.youtube.com/watch?v=4feqklaMDR8) and
[O trén](https://www.youtube.com/watch?v=CUAOwBknH5I).

<!--more -->

## New function `parseBasename`

When Lume loads a page file, the basename (the filename after removing the
extension) is parsed to extract additional data. This feature makes it possible
that, for instance, if the basename starts with `yyyy-mm-dd_*`, Lume extracts
this value
[to set the page date](https://lume.land/docs/creating-pages/page-files/#page-date),
and remove it from the final name, so the file `2020-06-21_hello-world.md`
generates the page `/hello-world/`.

As of Lume 2.3.0, you can add additional parsers with the new function
`site.parseBasename`.

Let's say we want to use a variable named `order` to sort pages in a menu, and
we want to extract this value from the basename. For example the file
`12.hello-world.md` outputs the page `/hello-world/` and sets `12` as the
`order` variable. We can create a function to parse the basename, save the order
value, and remove it from the final URL:

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

As you can see, the function is simple: it receives the basename and an object
to store the extracted values. The function must return a string with the new
basename, that will be used to generate the final URL.

> [!note]
>
> Keep in mind that the `data` object passed to this function does not contain
> the final data of the page yet, it's just a temporary object that will be
> merged later with the page data (a.k.a. the front matter). **The front matter
> can override a variable defined in the basename parser.**

The `parseBasename` function is used not only for files but also folders. This
allows to extract values from a folder name and store them as
[shared data](https://lume.land/docs/creating-pages/shared-data/), so they are
available to all pages inside.

## Restart after modifying the `_config.ts` and `_cms.ts` files

Until now, if you modify the `_config.ts` file during the server mode, you must
stop the process and start it again to see the changes. This is very
inconvenient, especially in the early phases of development, when you may want
to try different plugins or make changes to the Lume configuration.

From now on, the building process is run inside a Worker. This change allows us
to stop the build and restart it again without stopping the main process (under
the hood, it is done by closing the Worker and creating a new one).

For now, the rebuild is triggered every time a change in the `_config` file is
detected. In the next versions, we can add additional triggers.

In CMS mode (with `deno task cms`), the process is also restarted if the
`_cms.ts` file is modified, which is useful when you are configuring the
documents and collections.

## New sorting methods `asc-locale` and `desc-locale`

When searching pages using the
[`search` helper](https://lume.land/plugins/search/), you can sort them by any
field, for example, the title:

```js
const pages = search.pages("type=post", "title=asc");
```

Under the hood, Lume sorts the pages with
[array sort](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
using basic comparison operators (`>` and `<`):

```js
pages.sort((a, b) => a == 0 ? 0 : a.title > b.title ? 1 : -1);
```

This works fine in many cases, but not when you have strings with accents,
different cases, etc. In these cases
[localeCompare](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare)
works much better. In this version, we have introduced two new locale methods:
`asc-locale` and `desc-locale`. So the previous example can be improved with:

```js
const pages = search.pages("type=post", "title=asc-locale");
```

## New plugin `SRI`

<abbr>SRI</abbr> (Subresource Integrity) is a browser feature to protect your
site and your users from compromised code loaded from external CDN. It verifies
the code loaded by the browser is exactly the same code that you got during the
build process, without unexpected manipulations. You can
[learn more about SRI in the MDN article](https://developer.mozilla.org/en-US/blog/securing-cdn-using-sri-why-how/).

Lume had
[an experimental SRI plugin](https://github.com/lumeland/experimental-plugins)
that has been moved to the main repo, so now it's part of the official plugins
collection:

```ts
import lume from "lume/mod.ts";
import sri from "lume/plugins/sri.ts";

const site = lume();
site.use(sri());

export default site;
```

The plugin search for `<script>` and `<link rel="stylesheet">` elements in your
pages that load resources from other domains and add the `integrity` and
`crossorigin` attributes automatically. For example, if you have this code:

```html
<script src="https://code.jquery.com/jquery-3.7.0.slim.min.js"></script>
```

The plugin outputs the following:

```html
<script src="https://code.jquery.com/jquery-3.7.0.slim.min.js" integrity="sha256-tG5mcZUtJsZvyKAxYLVXrmjKBVLd6VpVccqz/r4ypFE=" crossorigin="anonymous"></script>
```

Note that SRI only works with URLs that always return the same code, so you must
use URLs that are guaranteed never to change. Learn
[how to use SRI with jsDelivr](https://www.jsdelivr.com/using-sri-with-dynamic-files).

## `nav` plugin changes

The [nav plugin](https://lume.land/plugins/nav/) is useful for creating menus at
multiple levels. In this version, this plugin got several improvements and a
**small BREAKING CHANGE** (sorry for that).

### BREAKING CHANGE: Changed the tree data interface

The `nav.menu()` function returns an object tree using the pages' URL. Every
object in the tree is a page or a directory and can have the following
properties:

- `item.slug` The name of the page or folder.
- `item.data` If the element is a page, this is the data object of the page. If
  it's a folder, this value is undefined.
- `item.children` An array of sub-pages and sub-folders.

This structure doesn't fit well to order the elements, especially the sub-folder
items. In the new structure, the `slug` property has been removed and this value
is stored in `data.basename`.

This change affects to how this tree is iterated in your template. For instance,
if in Lume 2.2 we have the following code:

```js
if (item.data) {
  // item.data exists, it's a page
  return `<a href="{{ item.data.url }}">{{ item.data.title }}</a>`;
} else {
  // It's a folder
  return `<strong>{{ item.slug }}</strong>`;
}
```

With the changes in Lume 2.3, the code must be changed to:

```js
if (item.data.url) {
  // item.data.url exists, it's a page
  return `<a href="{{ item.data.url }}">{{ item.data.title }}</a>`;
} else {
  // It's a folder
  return `<strong>{{ item.data.basename }}</strong>`;
}
```

Now both pages and folder items store the `basename` in the same place
(`data.basename`), and it's easy to sort the elements alphabetically:

```js
const menu = nav.menu("/", "", "basename=asc");
```

And even use the new locale sorting methods:

```js
const menu = nav.menu("/", "", "basename=asc-locale");
```

### Added functions to get the next and previous pages

In this version the functions `nav.nextPage()` and `navPreviousPage()` have been
added, to ease the navigation to the next and previous pages.

For example, let's say we have created the following tree structure with the
function `nav.menu()`:

```txt
docs
  |__ getting-started
        |__ installation
        |__ configuration
  |__ plugins
        |__ prettier
```

The new function `nav.nextPage` returns the next page relative to the provided
URL. For example:

```js
const nextPage = nav.nextPage("/docs/getting-started/installation/");
console.log(nextPage.url); // /docs/getting-started/configuration/
```

If the page is the last sibling of the current section, it returns the first
page of the next section:

```js
const nextPage = nav.nextPage("/docs/getting-started/configuration/");
console.log(nextPage.url); // /docs/plugins/
```

If the current section has children, it returns the first child:

```js
const nextPage = nav.nextPage("/docs/plugins/");
console.log(nextPage.url); // /docs/plugins/prettier/
```

The `nav.previousPage()` works similarly but in reverse order.

## Other changes

- Plugins and middlewares can be imported using named imports, in addition to
  the default exports:

  ```js
  import basePath from "lume/plugins/base_path.ts";
  // it's the same as
  import { basePath } from "lume/plugins/base_path.ts";
  ```

- In server/watch mode, if a page is removed, it was removed in the `dest`
  folder. From now on, the page folder will also removed. For example, removing
  the file `/about-us/index.html` removes also the folder`/about-us/` if it's
  empty.
- Fixed some bugs in the file watcher on Windows.

See the complete changelog file at:
