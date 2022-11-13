---
title: Lume 1.13.0 is out
tags:
  - releases
author: Óscar Otero
date: 2022-11-14
---

I'm happy to announce that Lume `1.13.0` was released with some interesting
additions and changes. Let's see the highlights.

<!-- More -->

## MDX support

[MDX](https://mdxjs.com/) support for Lume was requested for a long time. Now
that Deno can handle `npm` imports, it's more easy to bring support for this
library. The new `mdx` plugin allows to create your pages in `.mdx`, so you can
combine markdown and JSX components in a single file.

To enable MDX in your site, you only need to import the `mdx` plugin and any of
the JSX plugins available (`jsx` to use React, `jsx_preact` to use Preact). This
is an example with React:

```js
import lume from "lume/mod.ts";
import jsx from "lume/plugins/jsx.ts";
import mdx from "lume/plugins/mdx.ts";

const site = lume();

site.use(jsx());
site.use(mdx());

export default site;
```

Now you can create `.mdx` files that imports JSX components or use the Lume's
components from the global `comp` variable:

```md
---
title: Hello world
description: This is a description
---

import Image from "./_includes/Image.tsx";

<comp.Header title={title} description={description}/>

## Hello world

This is a markdown file with the title **{ title }**.

<Image alt="foo" />
```

[See more info in the documentation](https://lume.land/plugins/mdx/)

## New `sitemap` plugin

The `sitemap` plugin was created by [Jrson](https://github.com/jrson83) some
time ago in the
[experimental plugins repo](https://github.com/lumeland/experimental-plugins).
It creates a `sitemap.xml` file and a `robots.txt` file with a
link to the sitemap file.

This plugin is now included in Lume 1.13.0, so you can import it via
`lume/plugins/sitemap.ts`.

[See more info in the documentation](https://lume.land/plugins/sitemap/)

## Deprecated `page.dest` and `page.updateDest`

All pages in Lume have the property
`dest` with info about the destination file.

The destination is calculated according to the `page.data.url` value (if
defined) or the source file name. More info
[in the Lume docs](https://lume.land/docs/creating-pages/page-files/).

The problem is whenever the URL of a page is changed, it's necessary to change
the value in two places, `page.data.url` and `page.dest`. For example, a SASS
plugin that modifies the extension of the files from `.scss` to `.css`:

```js
// Extremely simplified code:
site.process([".scss"], (page) => {
  page.content = processSASS(page.content);

  // Change the page URL
  page.data.url = page.data.url.replace(/\.scss$/, ".css");

  // Change the destination extension
  page.dest.ext = ".css";
});
```

There's the `page.updateDest` function that changes the `page.dest` and
`page.data.url` values accordingly, ensuring both properties are consistent:

```js
// Extremely simplified code:
site.process([".scss"], (page) => {
  page.content = processSASS(page.content);

  // Change the page URL and destination
  page.updateDest({ ext: ".css" });
});
```

I never felt confortable with this, because it's duplicating the same value in
two different places. Originally it has been created in this way because they
have different purposes and they can have different values (like a page with the
url `/about-us/` but the destination file is `/about-us/index.html`).

In Lume 1.13.0 the `page.dest` and `page.updateDest` are deprecated (and
probably removed in 1.14.0). Now you only have to change the value in one place:
`page.data.url`.

More simple and intuitive.

## New option `returnPageData` to `search` helper

The global helper `search.pages()` returns an array of pages. But in most cases
you don't need the page instance, only its data. The new `returnPageData` option
allows to change this behavior to return only the `page.data` object. This will
be the default behavior in Lume 2.0, but for compatibility it's disabled by
default. See
[more info in this issue](https://github.com/lumeland/lume/issues/251).

To enable it, just configure the plugin in the `_config.ts` file.

```js
import lume from "lume/mod.ts";

const search = { returnPageData: true };

const site = lume({}, { search });

export default site;
```

Once configured, the following code:

```liquid
{% for article in search.pages("type=article", "date=desc") %} 
<a href="{{ article.data.url }}">
  <h1>{{ article.data.title }}</h1>
</a>
{% endfor %}
```

needs to be changed to:

```liquid
{% for article in search.pages("type=article", "date=desc") %} 
<a href="{{ article.url }}">
  <h1>{{ article.title }}</h1>
</a>
{% endfor %}
```

## Removed `no-html-extension` option for prettyUrls

Pretty URLs configuration allowed the `no-html-extension` value. It exports the
page as regular html (like `/article.html`) but the url of these pages are
`/article` (without extension). You can see more info
[in this issue](https://github.com/lumeland/lume/issues/193).

This option was removed in Lume 1.13.0 because it's not needed. If you want this
functionality, just use the `modify_urls` plugin to remove the extension to the
HTML links:

```js
import lume from "lume/mod.ts";
import modifyUrls from "lume/plugins/modify_urls.ts";

const site = lume();

site.use(modifyUrls({
  fn: (url) => url.replace(/\.html$/, ""),
}));

export default site;
```

## New `emptyDest` option

Lume needs to load all pages in order to build the site. This may be a problem
for large sites with 50K or more pages that cause out of memory issues.

A solution is to build these large sites in several steps,
creating different builds exporting to the same `dest` directory, so the site can be built incrementally. Lume
automatically empty the `dest` folder before any build, so the new `emptyDest`
option allows to change this behavior:

```ts
const site = lume({
  emptyDest: false, // Don't empty the dest folder
});
```

## Removed timestamp detection in the filename

Lume can
[extract dates from the page's filename](https://lume.land/docs/creating-pages/page-files/#page-date)
(for instance `2022-10-02_post-title.md`).

If there's a number (like `23_post-title.md`), it's
interpreted as a timestamp. This behavior was removed because it's a too
generical pattern
([See this issue](https://github.com/lumeland/lume/issues/284)). If you need
this feature back, you can create a preprocessor for that:

```ts
site.preprocess([".md"], (page) => {
  const [date, url] = myCustomFileParse(page.data.url);
  page.data.date = date;
  page.data.url = url;
});
```

See the
[CHANGELOG.md file](https://github.com/lumeland/lume/blob/v1.13.0/CHANGELOG.md)
for a full list of changes.
