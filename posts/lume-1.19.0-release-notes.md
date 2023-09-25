---
title: Lume 1.19.0 release notes
date: 2023-09-21T18:25:59.387Z
author: Óscar Otero
tags:
  - Releases
---

Lume 1.19.0 was released! Hopefully, it will be the last minor version of 1.x
before the incoming Lume 2. This is a summary of the changes and new features.

<!-- more -->

## Favicon plugin

The favicon is a common task we have to do every time we build a new website.
It's not as easy as should be because there are different formats, sizes,
resolutions, etc. The new `favicon` plugin was created to make it more simple.

You only have to specify an input file (by default `favicon.svg`) and the plugin
automatically creates the files `/favicon.ico`, `/favicon-16.png`,
`/favicon-32.png` and `/apple-touch-icon.png` and adds the `<link>` elements
needed in all HTML pages.

As any other Lume plugin, the installation can't be easier: just import the
plugin and use it:

```ts
import lume from "lume/mod.ts";
import favicon from "lume/plugins/favicon.ts";

const site = lume();
site.use(favicon());

export default site;
```

See [the favicon plugin documentation](https://lume.land/plugins/favicon/).

## Reading info plugin

This plugin was created by [Jrson](https://github.com/jrson83) and available in
the
[experimental plugins repo](https://github.com/lumeland/experimental-plugins)
since a time ago, under the name `reading_time`. It's a simple plugin to
calculate the time required to read the content of a page.

Due the plugin is being used in several projects (among them, this blog), it was
moved to Lume repo and renamed to `reading_info`. The reason of the new name is
the plugin not only returns the time, but also other interesting info like the
number of words. Maybe we can include more interesting info in the future, let
me know your suggestions.

It uses the
[`Int.Segmenter`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter)
standard function to count the words, using the page variable `lang` to detect
the language. The data is stored in the variable `readingInfo`, so you can use
it in your templates in this way:

```vento
<h1>{{ title }}</h1>
<p>{{ readingInfo.words }} words / {{ readingInfo.minutes }} min read</p>
```

See
[the reading_info plugin documentation](https://lume.land/plugins/reading_info/)

## Improved the `picture` plugin

The [picture plugin](https://lume.land/plugins/picture/) has received many
improvements and bug fixes. The most notable:

### Changed the `src` value of the original `img` element

In previous versions, the `src` value of the `img` element referred to the
original image. But this image isn't always exported so it returns a `404`
error. As of Lume 1.19, the last `source` element will be used as the value for
the `img`:

```html
<!-- Source code -->
<img src="/images/test.jpg" imagick="jpg webp 600">

<!-- Previous output: -->
<picture>
  <source srcset="/images/test-600w.webp" type="image/webp">
  <source srcset="/images/test-600w.jpg" type="image/jpeg">
  <img src="/images/test.jpg">
</picture>

<!-- New output: -->
<picture>
  <source srcset="/images/test-600w.webp" type="image/webp">
  <img src="/images/test-600w.jpg">
</picture>
```

### Formats sorted automatically

In the previous version, the `source` elements were created in the same order as
defined in the `imagick` attribute. For example:

```html
<img src="/images/test.jpg" imagick="jpg webp avif 600">
```

This outputs the `source` elements in the same order (`jpg`, `webp` and `avif`):

```html
<picture>
  <source srcset="/images/test-600w.jpg" type="image/jpeg">
  <source srcset="/images/test-600w.webp" type="image/webp">
  <source srcset="/images/test-600w.avif" type="image/avif">
  <img src="/images/test.jpg">
</picture>
```

Because `jpg` is a format widely supported, it will be choosen by all browsers
because it's the first in the list, even if better formats like `webp` or `avif`
are there. As of Lume 1.19 the formats are sorted automatically. By default the
order is: `jxl, avif, webp, png, jpg` (from the most modern to the most
supported). So the new output is:

```html
<picture>
  <source srcset="/images/test-600w.avif" type="image/avif">
  <source srcset="/images/test-600w.webp" type="image/webp">
  <img src="/images/test-600w.jpg">
</picture>
```

### Allow to define only formats

From now on, the `imagick` attribute can have only formats, sizes are no longer
mandatory. It's useful if you don't want to resize the image, just provide
different formats:

```html
<!-- Source code -->
<img src="/images/test.jpg" imagick="avif jpg webp">

<!-- Ouputs: -->
<picture>
  <source srcset="/images/test.avif" type="image/avif">
  <source srcset="/images/test.webp" type="image/webp">
  <img src="/images/test.jpg">
</picture>
```

### Don't create a new picture just for one source

If the image has only one format, no `picture` element will be created:

```html
<!-- Source code -->
<img src="/images/test.jpg" imagick="avif 300">

<!-- Previous output: -->
<picture>
  <source srcset="/images/test-300.avif" type="image/avif">
  <img src="/images/test.jpg">
</picture>

<!-- New ouput: -->
<img src="/images/test-300.avif">
```

### Support for `size` attribute

The plugin now supports the `size` attribute:

```html
<!-- Source code -->
<img src="img.png" imagick="avif png 100@2" sizes="(width < 700px) 100px, 200px">

<!-- Previous output: -->
<picture>
  <source srcset="img-100w.avif, img-100w@2.avif 2x" type="image/avif">
  <source srcset="img-100w.png, img-100w@2.png 2x" type="image/png">
  <img src="img.png" />
</picture>

<!-- New output: -->
<picture>
  <source srcset="img-100w.avif, img-100w@2.avif 2x" type="image/avif" sizes="(width < 700px) 100px, 200px">
  <img src="img-100w.png" srcset="img-100w@2.png 2x" sizes="(width < 700px) 100px, 200px">
</picture>
```

## New functions to `site` instance

### mergeKey

Lume allows to customize the way some keys are merged with the variable
`mergedKeys`. You can see a
[detailed explanation of this feature](https://lume.land/docs/core/merged-keys/)
in the documentation.

The function `site.mergeKey()` allows to define this value in the _config.ts
file, which is more useful specially for plugins that register new merge
strategies for some keys automatically.

For example, let's say you want to merge the keys `categories` using the
`stringArray` strategy:

```ts
site.mergeKey("categories", "stringArray");
```

### page

The `site.page()` function allows to create new pages dynamically from the
`_config.ts` file, without having a page file in the disk. You only have to set
the data object of the page, for example:

```ts
site.page(
  {
    url: "/about-me/",
    layout: "about-page.njk",
    content: "Hello, my name is Óscar",
  },
);
```

By default, the context of the page is the root directory (`/`), so any shared
data defined in `_data` files/folders is accessible to this page. You can change
the scope of the page in the second argument:

```ts
site.page(
  {
    url: "/about-me/",
    layout: "about-page.njk",
    content: "Hello, my name is Óscar",
  },
  "/pages",
);
```

Now the page is scoped to the `/pages` directory, so it can access to the date
stored in the `/pages/_data.yml` file, for example.

## Upgrade pagefind to v1.0

The great [Pagefind](https://pagefind.app/) library, used by the
[pagefind plugin](https://lume.land/plugins/pagefind/) is now 1.0🎉. This new
version brings
[new awesome features](https://github.com/CloudCannon/pagefind/releases/tag/v1.0.0),
but also some changes:

- The `binary` option was removed. The plugin use the `npm` version that
  downloads the binary automatically in the Deno cache folder. No more `_bin`
  folders!
- The option `indexing.bundleDirectory` was renamed to `outputPath`.
- Added the option `customRecords` that allows to add additional records to the
  pagefind database in addition to those generated by the output pages.

See the
[CHANGELOG.md file](https://github.com/lumeland/lume/blob/v1.19.0/CHANGELOG.md)
for the full list of changes.
