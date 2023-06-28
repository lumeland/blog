---
title: Lume 1.18.0 release notes
date: 2023-06-22T12:51:21.843Z
author: Óscar Otero
tags:
  - Releases
---

This is a summary of the new features introduced in Lume (**1.18.0**).

<!-- more -->

## Picture plugin

Adding images to web pages is a hard task nowadays. There are new modern image
formats like AVIF and JPEG XL with better quality and compression but they are
not supported by all browsers.

In order to make this work more easy, Lume has the `picture` plugin that
converts any regular `<img>` element to a full featured `<picture>` element
creating all `<source srset>` needed to support all formats and resolutions.
This plugin relies on the `imagick` plugin to make the transformations, so you
need the two plugins installed in this exact order:

```ts
import lume from "lume/mod.ts";
import picture from "lume/plugins/picture.ts";
import imagick from "lume/plugins/imagick.ts";

const site = lume();
site.use(picture());
site.use(imagick());

export default site;
```

Once installed, the plugin will search for all HTML elements with the `imagick`
attribute and will convert the images to the specified formats. For example:

```html
<img src="/flowers.jpg" imagick="avif webp jpg 300@2">
```

The `imagick` attribute of this image contains the desired formats (`avif`,
`webp` and `jpg`) and the different sizes (`300` which means 300 pixels). The
`@2` suffix indicates that this size should support also the `2x` resolution.
The output HTML code is:

```html
<picture>
  <source srcset="/flowers-300w.avif, /flowers-300w@2.avif 2x" type="image/avif">
  <source srcset="/flowers-300w.webp, /flowers-300w@2.webp 2x" type="image/webp">
  <source srcset="/flowers-300w.jpg, /flowers-300w@2.jpg 2x" type="image/jpeg">
  <img src="/flowers.jpg">
</picture>
```

[See the documentation](https://lume.land/plugins/picture/) for more info about
this plugin.

## Symlinks support

Lume 1.18.0 introduces symlinks support in the `src` directory. This means that
you can include symlinks targeting files and folders outside of the `src` (for
example a page or a folder with templates) and Lume will follow them and will
use those files to build the site.

This can be useful if you want to reuse the same files for different projects.
Instead of copying the files for each project, you can store them in a single
place and add symlinks from the different projects.

Keep in mind that the Lume watcher doesn't detect changes in these files.

## Vento plugin

[Vento](https://github.com/oscarotero/vento) is a new template engine designed
to use the best ideas from Nunjucks, Liquid, Eta/EJS and Mustache. Some
highlighted features are:

- Async friendly
- Simple API
- Allows to write JavaScript code in the templates

To use it, you must import it in the _config file:

```js
import lume from "lume/mod.ts";
import vento from "lume/plugins/vento.ts";

const site = lume();
site.use(vento());

export default site;
```

Vento template engine has been created by me (Óscar Otero, also the Lume
creator) and I'm thinking of making it the default engine (replacing Nunjucks)
at some point. I would like to know your thoughts.

[See more info about this plugin](https://lume.land/plugins/vento/) in the
documentation.

## LightningCSS bundler

Until now, the `lightningcss` plugin only transformed the CSS code but
[it couldn't bundle it](https://github.com/lumeland/lume/issues/273) (inline the
`@import`'ed styles to output a single file with all the code). The reason is
LightningCSS is an NPM package that didn't work properly on Deno due the lack of
support of some NAPI functions so Lume had to use the WASM version
[that only transform the code but not bundle it](https://github.com/parcel-bundler/lightningcss/issues/277).

Deno team finally improved support for NAPI and now it's possible to use the NPM
version of `lightningcss` and bundle the code. In fact, as of Lume 1.18 the
plugin **bundles the CSS code by default**.

If you want to disable the bundler and only transform the code (back to the
previous behavior), just add a `includes: false` option in the _config file:

```js
import lume from "lume/mod.ts";
import lightningcss from "lume/plugins/lightningcss.ts";

const site = lume();
site.use(lightningcss({
  includes: false, // Disable the bundler
}));

export default site;
```

## Support for JSONC and TOML

Thanks to [@kwaa](https://github.com/kwaa) for working on the JSONC and TOML
support for Lume. Now you not only can use YAML format in the front matter but
also JSON and TOML formats.

To use JSON (or JSONC) in the front matter:

```
{
  "title": "Hello world"
}

Page content
```

To use TOML in the front matter:

```
+++
title = Hello world
+++

Page content
```

JSONC is enabled by default for pages and data files. So any file with the
extension `.tmpl.jsonc` or a data file `_data.jsonc` or `_data/*.jsonc` is
loaded by default.

TOML files can also be used for pages and data files but this format is not
enabled by default (probably it will in Lume 2.0). To enable it, just import the
plugin in the _config file:

```js
import lume from "lume/mod.ts";
import toml from "lume/plugins/toml.ts";

const site = lume();
site.use(toml());

export default site;
```
