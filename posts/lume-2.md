---
title: Lume 2 is finally here!!
date: 2023-10-10T23:29:44.134Z
author: Óscar Otero
draft: true
tags:
  - Releases
---

A new major version of Lume was released. In this version I wanted to take the
opportunity to fix some bad design decisions that seemed like a good idea at the
time, remove some confusing APIs and implement some new features.

<!-- more -->

## New `slug` variable

Although Lume allows to customize the final URL of the pages, there are some
cases not easy to achieve:

- If you want to remove a directory name: For example to export all pages in
  `/articles/` without the `/articles` folder.
- You want to change a directory name, so the `/articles/first-article.md` is
  output as `/news/first-article/`.

To achieve that in Lume 1, you have to build the new URL completely by creating
a `url()` function or setting it manually in the front matter of every page.

In Lume 2 you can change how a folder or a page affects to the complete URL with
the `slug` variable. It's a special variable (like `url`) but it only affects to
this part of the url, so it's much more easy to make small changes. You only
have to define a `_data.*` file in the folder which name you want to change,
with the `slug` variable. In the first example, to remove the directory name
from the final URL, just set the slug as empty:

```yml
# /articles/_data.yml

slug: "" # Don't use "/articles" in the final URL
```

To change the directory name:

```yml
# /articles/_data.yml

slug: news # Use "/news" instead of "/articles" in the final URL.
```

Note that you can also remove or add additional paths:

```yml
slug: "../" # Remove the current and previous folder name
```

```yml
slug: "articles/news" # Add two slugs
```

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
`search.pages()`). The `data` filter, registered by this plugin in Lume v1 was
also removed because it's now useless.

### Removed `search.tags()`

The function `search.tags()` was just a shortcut of `search.values("tags")`. It
was removed in Lume 2 for simplicity.

## Removed sub-extensions from layouts

Some extensions like `.js`, `.ts` or `.jsx` can be used to generate pages or
javascript files to be executed by the browser. To make a distinction between
these two purposes, Lume 1 use the `.tmpl` sub-extension. For example, you can
create the homepage of your website with the file `index.tmpl.js` (from which
the `index.html` file is generated) and also have the file `/carousel.js` with
some JavaScript code for an interactive carousel in the UI (maybe bundled or
minified with `esbuild` or `terser` plugins).

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

## Don't prettify the `/404.html` page by default

Most servers and hostings are configured by default to serve the `/404.html`
page if the requested file doesn't exist. For example
[Vercel](https://vercel.com/guides/custom-404-page#static-site-generator-(ssg)),
[Netlify](https://docs.netlify.com/routing/redirects/redirect-options/#custom-404-page-handling)
and others. It's almost a standard when serving static sites. Lume has also this
option by default. But it has also the `prettyUrls` option enabled, so the 404
page is exported to `/404/index.html`, making the default option for the 404
page conflicting with the default option to prettify the urls.

In Lume 2 the `prettyUrls` option is NOT applied if the page is `/404`, so the
file is saved as `/404.html` instead of `/404/`. Note that you can change this
behavior by explicity setting the `url` variable in the front matter of the
page.

## Changed the behavior of plugins with plugins

One of the goals of Lume plugins is to provide good defaults so, in most cases
you don't need to customize anything, just use the plugin and that's all. There
are some Lume plugins like `postcss` that use other libraries that also accept
plugins:

```js
import reporter from "npm:postcss-reporter";

site.use(postcss({
  plugins: [reporter],
}));
```

The `postcss` plugin is configured by default to use `postcssNesting` and
`autoprefixer` plugins. But setting additional plugins replaces the default
plugins. If you want to keep using the default plugins, you have to use the
`keepDefaultPlugins` option:

```js
import reporter from "npm:postcss-reporter";

site.use(postcss({
  plugins: [reporter],
  keepDefaultPlugins: true, // keep using nesting and autoprefixer default plugins, in addition to reporter
}));
```

The desired behavior in most cases is to add additional plugins, not replace the
default plugins. In Lume 2, adding new plugins **doesn't replace the default
plugins.** The option `keepDefaultPlugins` was removed and a new option
`useDefaultPlugins` was added which is `true` by default.

This change affects to all plugins that accept library-specific plugins like
`postcss`, `markdown`, `mdx` and `remark`.

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

Because dev mode is calculated in the instantiation, if we want to instantiate
Lume differently depending on whether we are in dev mode or not, we have to
detect the flag manually:

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

The best way to handle this is by using environment variables, so in Lume 2 you
can configure Lume to show the draft pages by setting the variable
`LUME_SHOW_DRAFTS=true`. For convenience, you may want to create a task:

```json
{
  "tasks": {
    "lume": "echo \"import 'lume/cli.ts'\" | deno run --unstable -A -",
    "build": "deno task lume",
    "serve": "deno task lume -s",
    "dev": "LUME_SHOW_DRAFTS=true deno task lume -s"
  }
}
```

Due this variable is not longer stored in the `site` instance, you can access to
it everywhere:

```js
if (Deno.env.get("LUME_DRAFTS") == "true") {
  // Things to do when the draft posts are visible
}
```

## Removed `--quiet` argument

The `--quiet` flag doesn't ouput anything to the terminal when building a site.
In Lume 2 this option was replaced with the environment variable
`LUME_LOG_LEVEL`. This allows to configure what level of logs you want to see.
It uses the [Deno's `std/log` library](https://deno.land/std/log/mod.ts), that
allows to configure 5 levels: `DEBUG|INFO|WARNING|ERROR|CRITICAL`. By default is
`INFO`.

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
