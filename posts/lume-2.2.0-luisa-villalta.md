---
title: Lume 2.2.0 - Luísa Villalta
date: '2024-05-17'
author: Óscar Otero
tags:
  - Releases
comments:
  src: 'https://fosstodon.org/@lume/112456294506815477'
---

From now on, every new minor version of Lume will be dedicated to a relevant
galician person. Today —17 May— is the
[Galician Literature Day](https://en.wikipedia.org/wiki/Galician_Literature_Day)
and this year it was honored to the great poet
[**Luísa Villalta**](https://galicianliterature.com/villalta/). This Lume
version is dedicated to her.

<!--more -->

## TL/DR

Cases requiring some manual changes after updating to Lume 2.2:

- If you have a `_cache` folder in your `src` directory,
  [see this](#_cache-folder-relative-to-root-directory).
- If you importing LumeCMS from `/lume/cms.ts`, [see this](#cms-import-changes).

## Esbuild improvements

The [Esbuild plugin](https://lume.land/plugins/esbuild/) got the following
improvements:

- **JSR support:** Now you can use [`jsr:`](https://jsr.io/) specifiers in your
  code. They are handled using esm.sh (the same as `npm:` specifiers).

- **Fixed `npm:` resolution.** In previous versions, importing a bare specifier
  mapped to `npm:` like the following would fail:

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

- **Using esbuild without bundler:** Let's say you want to compile the following
  code with the `bundle` option to `false`:

  ```js
  import foo from "./bar.ts";
  ```

  Esbuild converts `bar.ts` to `bar.js`, but
  [it doesn't change the file extension in the import](https://github.com/evanw/esbuild/issues/2435).
  The Lume plugin tries to fix this.
  [More info](https://github.com/lumeland/lume/issues/594).

## CMS import changes

[LumeCMS](https://lume.land/cms/) is a simple CMS to manage the content of the
sites. To configure it, you have to create the `_cms.ts` file and import the CMS
from the `lume/cms.ts` specifier:

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
- Providing everything in a single file makes Deno download all LumeCMS modules
  even those that you don't need. For example, GitHub storage has some NPM
  dependencies like Octokit that you may not need.

The best way to import LumeCMS is using the import map. This is something that
[the `init` script](https://lume.land/docs/overview/installation/#setup-lume)
has been doing for a while. For example:

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

This allows you to import only the specific modules of Lume that you need and
update LumeCMS at your own pace.

I know this is a BREAKING CHANGE and sorry for that 🙏. But I believe the
current situation wasn't easy to maintain.

## New middleware `shutdown`

If you have a site on Deno Deploy that you want to shut down for reasons, this
new middleware can be useful:

- All HTML requests will return the content of the `/503.html` page with the
  `503` status code.
- It also sends the `Retry-After` header with the default value of 24 hours
  (customizable).

```js
import Server from "lume/core/server.ts";
import shutdown from "lume/middlewares/shutdown.ts";

const server = new Server();
server.use(shutdown());

server.start();
```

## New `theme` option for Prism and Highlight.js

The plugins `prism` and `code_highlight` highlight the syntax of your code
automatically using the libraries [Prism](https://prismjs.com/) and
[Highlight.js](https://highlightjs.org/) respectively. These libraries provide
some nice premade themes that you can use but need to be loaded manually.

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
[remoteFile](https://lume.land/docs/core/remote-files/) under the hood) with the
local path `_includes/css/code_theme.css` so you can import it in your CSS file
with:

```css
@import "css/code_theme.css";
```

> [!NOTE]
>
> If you're not using any CSS plugin (like postcss or lightningcss), you have to
> configure Lume to copy or load the file. Example:

```js
site.use(prism({
  theme: {
    name: "funky",
    path: "/css/code_theme.css",
  },
}));

// Copy the file
site.copy("/css/code_theme.css");
```

## Extra `meta` tags

The [`metas` plugin](https://lume.land/plugins/metas/) allows to include custom
meta tags. Useful to insert metas like `twitter:label1`, `twitter:data1`, etc.

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

The [`feed` plugin](https://lume.land/plugins/feed/) has been extended with the
new `image` key that allows one to place an image per item. For example:

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

## Liquid deprecation

[Liquid plugin](https://lume.land/plugins/liquid/) allows to use
[Liquidjs](https://liquidjs.com/) library as a template engine in Lume.

Liquidjs is a great library but it has a limitation incompatible with Lume:
[it's not possible to invoke functions](https://github.com/harttle/liquidjs/discussions/580).
This is very unfortunate because it's not possible to use the
[`search` helper](https://lume.land/docs/core/searching/) inside a liquid
template to loop through the pages. For example, the following code doesn't
work:

```html
<ul>
  {% for item in search.pages('post') %}
    <li>{{item.title}}</li>
  {% endfor %}
</ul>
```

Lume has support for Nunjucks which is a good replacement because has a very
similar syntax to Liquid and allows you to run functions, so I decided to
deprecate the Liquid plugin and recommend Nunjucks instead. It will still be
available in Lume 2 but probably be removed in Lume 3 (in the distant future).

## `_cache` folder relative to root directory

The `_cache` folder is created by some plugins like
[`transform_images`](https://lume.land/plugins/transform_images/) in the source
folder. For example, if your source folder is `/src/` the cache folder is
`/src/_cache/`.

As of Lume 2.2.0, this folder is created **in the root directory** (the same
directory where the `_config.ts` file is). This makes its location more
predictable, especially to add it to `.gitignore`.

After updating Lume, if you are using a subdirectory as the source folder, move
your `_cache` folder to the root.

## Removed nesting plugin in PostCSS

The [postcss plugin](https://lume.land/plugins/postcss/) comes with the plugin
[postcss-nesting](https://www.npmjs.com/package/postcss-nesting) and
[autoprefixer](https://www.npmjs.com/package/autoprefixer) enabled by default.

[CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/Nesting_selector)
is now available in all browsers and this plugin is no longer needed, so it's no
longer enabled by default in Lume.

If you still want to use it, you can import it in the _config.ts file:

```js
import lume from "lume/mod.ts";
import postcss from "lume/plugins/postcss.ts";
import nesting from "npm:postcss-nesting";

const site = lume();

site.use(postcss({
  plugins: [nesting()],
}));

export default site;
```

And there are many more changes that you can see in the
[CHANGELOG file.](https://github.com/lumeland/lume/blob/v2.2.0/CHANGELOG.md)
