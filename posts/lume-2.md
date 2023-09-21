---
title: Lume 2
date: 2023-09-10T23:29:44.134Z
author: Óscar Otero
draft: true
tags:
  - Releases
---

## Search returns the page data

The [`search` plugin](https://lume.land/plugins/search/) provides the `search`
helper with some useful functions like `search.pages()` to return an array of
pages that meet a query. In Lume 1, this array contained the `Page` object, so
you had to access to the page data from the `data` property. For example:

```vento
{{ for article of search.pages("type=article") }}
<a href="{{ article.data.url }}">
  <h1>{{ article.data.title }}</h1>
</a>
{{ /for }}
```

In Lume 2, the function returns the data object directly, so the code above is
simplified to:

```vento
{{ for article of search.pages("type=article") }}
<a href="{{ article.url }}">
  <h1>{{ article.title }}</h1>
</a>
{{ /for }}
```

This behavior was available in Lume 1 by configuring the plugin with the option
`returnPageData=true`. In Lume 2 this is the default behavior and the option was
removed.
[See the GitHub issue for more info](https://github.com/lumeland/lume/issues/251).

This change also affects to `search.page()` (the singular version of
`search.pages()`). The `data` filter, register by this plugin was also removed
because it's now useless.

### Removed `search.tags()`

The function `search.tags()` was just a shortcut of `search.values("tags")`. It
was removed in Lume 2 because it's useless.

## Removed sub-extensions from layouts

Some extensions like `.js`, `.ts` or `.jsx` can be used to generate pages or
browser interactions. To make a distinction between these two purposes, Lume 1
use the `.tmpl` sub-extension. For example, you can create the homepage of your
website with the file `index.tmpl.js` (from which the `index.html` file is
generated) and also have the file `/carousel.js` with some JavaScript code for
an interactive carousel in the UI (maybe bundled or minified with `esbuild` or
`terser` plugins).

Lume 1 implementation requires the `.tmpl.js` extension not only in the main
file but also in the layouts. This makes no sense because layouts don't need to
be distinguished from other layouts. It's also inconsistent because,
`_components` files don't use the `.tmpl` sub-extension: to create the _button_
component, the file must be named as `/_components/button.js`, and
`/_components/button.tmpl.js` would fail.

This is an example of Lume 1 structure:

```plain
_includes/layout.tmpl.js
_components/button.js
_data.js
index.tmpl.js
```

Lume 2 don't need sub-extension for layouts, so it's more aligned with the
components and removes that unnecessary requirement. The previous example would
become to the following (but not exactly, keep reading below):

```plain
_includes/layout.js
_components/button.js
_data.js
index.tmpl.js
```

### Renamed `.tmpl` to `.page`

The `.tmpl` sub-extension is for "template", but it's not a good name because
this file does not work as a template (or not exclusively). Because this
sub-extension is to distinguish page files from other files, the `.page`
sub-extension makes more sense and is more clear about the real purpose of the
file. So the final site structure for Lume 2 is:

```plain
_includes/layout.js
_components/button.js
_data.js
index.page.js
```

Note that the sub-extension is configurable. If you want keep using `.tmpl` as
the sub-extension, just configure the `modules` and `json` plugins:

```js
import lume from "lume/mod.ts";

const modules = { pageSubExtension: ".tmpl" };
const json = { pageSubExtension: ".tmpl" };

const site = lume({}, { modules, json });

export default lume;
```

Tip: I've created a script to automatically
[rename the files of your repo for Lume 2](https://gist.github.com/oscarotero/c6404f36530cf989ec1ba65b75d41e9c).

## Removed output extension detection from the filename

In Lume 1 the file `/about.njk` outputs the file `/about/index.html`, but it's
possible to output a non-HTML file by adding the extension to the filename. For
example `/styles.css.njk` outputs `/styles.css`.

This automatic extension detection has been proved as a bad decision because it
has unexpected behaviors. For example, we may want to create the file
`/posts/using-missing.css.njk` to talks about the
[missing.css](https://missing.style/) library but Lume outputs the file
`/posts/using-missing.css` and treat it as a CSS file.

Lume 2 remove this automatic detection and all pages will be exported as HTML
pages making it more preditable. This not only solves this issue but also align
Lume with the behavior of other static site generators like Jekyll and Eleventy.
[See more info in the GitHub issue](https://github.com/lumeland/lume/issues/430).

It's still possible to output non-HTML files by setting the `url` variable. For
example:

```vento
---
url: styles.css
color: red
---

body {
  color: {{ color }};
}
```

## Removed `--dev` mode

In Lume 1, the `--dev` mode allows to output the pages marked as `draft`. The
problem with this option is it's automatically detected by Lume after the
instantiation, so it's not available before. For example, let's say we have the
following `_config.ts` file:

```ts
import lume from "lume/mod.ts";

const site = lume();

if (site.options.dev) {
  // Things to do only in dev mode
}

export default site;
```

Because dev mode is calculated before the instantiation, if we want to configure
Lume differently depending on whether we are in dev mode or not, we have to hack
this detection like this:

```ts
import lume from "lume/mod.ts";

const devMode = Deno.args.includes("-d") || Deno.args.includes("--dev");

const site = lume({
  dest: devMode ? "_site" : "publish",
});

export default site;
```

This solution does not work on 100% of the cases because the dev mode can be set
joined with other options, for example: `deno task lume -ds` (`d` for dev mode,
`s` for server).

In addition to that, dev mode can be interpreted as a mode for developers, which
is not. In dev mode you don't have more info about errors and the assets are not
bundled in a specific way. The only difference is draft pages are not ignored.

We think the best way to handle this is using environment variables, so in Lume
2 you can configure Lume to show the draft pages setting the variable
`LUME_DRAFTS=true`. For convenience, you may want to create a task:

```json
{
  "tasks": {
    "lume": "echo \"import 'lume/cli.ts'\" | deno run --unstable -A -",
    "build": "deno task lume",
    "serve": "deno task lume -s",
    "dev": "LUME_DRAFTS=true deno task lume -s"
  }
}
```

Due this variable is not longer stored in the `site` instance, you can access to
it from anywhere:

```js
if (Deno.env.get("LUME_DRAFTS") == "true") {
  // Things to do when the draft posts are visible
}
```

This opens the door for more `LUME_` variables in the future for more
configurations and even use an `.env` file to manage them.

## Removed some configurations functions

### Removed `site.includes()`

This function allowed to configure the includes folder for some extensions. For
example: `site.includes([".css"], "/_includes/css")` configure the includes
folder of `.css` files to the `/_includes/css` path.

This didn't work consistently and conflicts with the `includes` option of some
plugins like `postcss`, for example:

```js
site.use(postcss({
  includes: "_includes/css",
}));

site.includes([".css"], "_includes/styles");
```

In Lume 2, this function was removed and the includes folder is configured only
in the plugins.

### Merged `site.loadComponents()`, `site.engine()` and `site.loadPages()`

These three functions configure the loader or/and engine used for some
extensions for specific cases, but they have some conflicts and can override
each other. For example:

```js
site.loadComponents([".njk"], loader, engine);
site.loadPages([".njk"], loader2, engine2);
site.engine([".njk"], engine3);
```

In reality, when we want to register a new engine (like Nunjucks), we want to
use it to render pages and components, so spliting this configuration in three
different functions didn't make sense. In Lume 2 `loadComponents` and `engine`
were removed and `loadPages` configure automatically the components:

```js
site.loadPages([".njk"], { loader, engine });
```
