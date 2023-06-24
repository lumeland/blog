---
title: Lume 1.18.0 release notes
date: 2023-06-22T12:51:21.843Z
author: Óscar Otero
draft: true
tags:
  - Releases
---

This is a summary of the new features introduced in Lume (**1.18.0**).

<!-- more -->

## Picture plugin

Adding images to web pages is a hard task nowadays. There are new modern image
formats like AVIF and JPEG XL with better quality and compression but they are
not supported by all browsers. And it's also possible to provide different
images for different resolutions.

In order to make this work more easy, Lume has the `picture` plugin that
converts any regular `<img>` element to a full featured `<picture>` element
creating all `<source srset>` needed to support all formats and resolutions.
This plugin relies on the `imagick` plugin to make the transformations, so you
need the two plugins installed:

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
  <source srcset="/flowers-300w.avif, /flowers-300w@2.avif 2x" width="300" type="image/avif">
  <source srcset="/flowers-300w.webp, /flowers-300w@2.webp 2x" width="300" type="image/webp">
  <source srcset="/flowers-300w.jpg, /flowers-300w@2.jpg 2x" width="300" type="image/jpeg">
  <img src="/flowers.jpg">
</picture>
```

## Symlinks support

This new version introduces symlinks support in the `src` directory. This means
that you can include a symlink targeting to a file or folder outside of the
`src` (for example a page or a template file) and Lume will follow that link and
will use those files to build the site.

This can be useful if you want to reuse the same files for different projects.
Instead of copying the files for each project, you can store them in a single
place and add symlinks from the different projects.

Note that the Lume watcher doesn't detect changes in these files for now.

## Vento plugin

[Vento](https://github.com/oscarotero/vento) is a new template engine that want
to use the best ideas from Nunjucks, Liquid, Eta/EJS and Mustache.

- Async friendly
- Simple API
- Allows to write JavaScript code in the templates

The template engine has been created by me (Óscar Otero, also the Lume creator)
and I'm thinking of making it the default engine (replacing Nunjucks) at some
point.

For now, you have to enable it in the _config file:

```js
import lume from "lume/mod.ts";
import vento from "lume/plugins/vento.ts";

const site = lume();
site.use(vento());

export default site;
```

## LightningCSS bundler

Until now, the `lightningcss` plugin only transformed the CSS code but
[it couldn't bundle it](https://github.com/lumeland/lume/issues/273) (inline the
`@import`ed files to output a single file with all the code). The reason is
LightningCSS is an NPM package that didn't work on Deno due the lack of support
of some NAPI functions so Lume used the WASM version
[that only transform the code but not bundle it](https://github.com/parcel-bundler/lightningcss/issues/277).
The only way to bundle CSS code was by using the `postcss` plugin.

Deno team finally improved support NAPI and now it's possible to use
`lightningcss` as a NPM package and bundle the code. So as of Lume 1.18 the
plugin **bundles the CSS code by default**.

If you want to disable the bundler and only transform the code (like the
previous version), just add a `includes: false` option in the _config file:

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

New formats
