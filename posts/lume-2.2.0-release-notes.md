---
title: Lume 2.2.0 release notes
date: '2024-05-15'
author: Óscar Otero
draft: true
tags:
  - Releases
comments:
  src: ''
---

A new version of Lume was released! This is a summary of the new features,
improvements and bug fixes.

<!--more -->

## Esbuild improvements

### JSR support

[Esbuild plugin](https://lume.land/plugins/esbuild/) supports
[`jsr:`](https://jsr.io/) specifiers. They are handled with esm.sh (the same as
with `npm:` specifiers).

### NPM fixes

In previous versions, importing a bare specifier mapped to `npm:` like the
following would fail:

```json
{
  "imports": {
    "bar": "npm:bar"
  }
}
```

```js
import foo from "bar";
```

This has been fixed and it works fine now.

### Using esbuild without bundler

If you use esbuild with the `bundle` option as `false`, it doesn't change the
imported files. Let's see this code:

```js
import foo from "./bar.ts";
```

Esbuild converts the `bar.ts` file to JavaScript, but
[it doesn't change the extension of the imports](https://github.com/evanw/esbuild/issues/2435)
in other files (looks like this behavior is intended). The Lume plugin try to
fix this. [More info in the issue](https://github.com/lumeland/lume/issues/594).

## New middleware `shutdown`

If you have a site on Deno Deploy that you want to shutdown for reasons, this
new middleware can be useful:

- All HTML requests will return the content of the `/503.html` page with the
  `503` status code.
- It also send the `Retry-After` header with the default value of 24 hours.

```js
import Server from "lume/core/server.ts";
import shutdown from "lume/middlewares/shutdown.ts";

const server = new Server();
server.use(shutdown());

server.start();
```

## New `theme` option for Prism and Highlight.js

The plugins `prism` and `code_highlight` highlight the syntax of your code
autoomatically using the libraries [Prism](https://prismjs.com/) and
[Highlight.js](https://highlightjs.org/) respectively. These libraries provide
some nice premade themes that you have to import manually.

A new option `theme` was introduced to ease this step, so the themes are
downloaded automatically. The option works the same for both plugins, this is an
example with `prism`:

```js
site.use(prism({
  theme: {
    name: "funky",
    path: "_includes/css/code_theme.css",
  },
}));
```

The CSS file for the
[Funky theme](https://github.com/PrismJS/prism/blob/master/themes/prism-funky.css)
is downloaded automatically (using
[remoteFile](https://lume.land/docs/core/remote-files/)) with the local path
`_includes/css/code_theme.css` so you can import it in your CSS file with:

```css
@import "css/code_theme.css";
```

> [!NOTE] If you're not using any CSS plugin (like postcss or lightningcss), you
> have to configure Lume to copy or load the file. Example:

```js
site.use(prism({
  theme: {
    name: "funky",
    path: "/css/code_theme.css",
  },
}));

// Copy the css directory
site.copy("/css");
```

## New `meta` tags

The `metas` plugin allows to include custom meta tags. Useful to insert metas
like `twitter:label1`, `twitter:data1`, etc.

In addition to the regular values, the `metas` object accepts additional values
that are treated as custom meta tags. Example:

```yml
title: Lume is awesome
author: Dark Vader
metas:
  title: =title
  "twitter:label1": Reading time
  "twitter:data1": 1 minute
  "twitter:label2": Written by
  "twitter:data1": =author
```

This configuration generates the following code:

```html
<meta name="title" content="Lume is awesome">
<meta name="twitter:label1" content="Reading time">
<meta name="twitter:data1" content="1 minute">
<meta name="twitter:label2" content="Written by">
<meta name="twitter:data2" content="Dark Vader">
```

## Feed plugin accepts images

The [`feed` plugin](https://lume.land/plugins/feed/) has extended with the new
`image` key that allows to place a image per item. For example:

```js
site.use(feed({
  output: "/feed.xml",
  query: "type=articles",
  items: {
    title: "=title",
    description: "=excerpt",
    image: "=cover",
  },
}));
```

## CMS import changes

[LumeCMS](https://lume.land/cms/) is a simple CMS to manage the content of the
sites. To setup, you have to create the `_cms.ts` file and import the CMS from
`lume/cms.ts` specifier:

```js
import lumeCMS from "lume/cms.ts";

const cms = lumeCMS();

// Configuration here

export default cms;
```

The file `lume/cms.ts`, provided by Lume, exports everything you need from
LumeCMS. But this has also the following issues:

- Lume and LumeCMS have different update paces. It's not easy to update LumeCMS
  if it's coupled to Lume.
- Providing everything in a single file force to download all LumeCMS modules
  even those that you don't need. For example GitHub storage has some NPM
  dependencies like Octokit that you may not need.

The best way to import LumeCMS is using the import map. This is something that
the `init` script has been doing for a while. For example:

```json
{
  "imports": {
    "lume/": "https://deno.land/x/lume@v2.2.0/",
    "lume/cms/": "https://cdn.jsdelivr.net/gh/lumeland/cms@0.4.1/"
  }
}
```

```js
import lumeCMS from "lume/cms/mod.ts";

const cms = lumeCMS();

// Configuration here

export default cms;
```

This allows to import only the specific modules of Lume that you really need and
update LumeCMS at your own pace.

I know this is a BREAKING CHANGE and sorry for that 🙏. But I believe the
current situation wasn't easy to maintain.

## Liquid deprecation

## `_cache` folder relative to root directory

## Removed nesting plugin in PostCSS
