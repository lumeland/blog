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

When Lume search for your files in the `src` directory, now it can follow the
symlinks.

## Vento plugin

A new template engine

## LightningCSS bundler

The lightningcss plugin now bundles the code by default.

## Support for JSONC and TOML

New formats
