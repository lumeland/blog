---
title: Lume 2 is finally here!!
date: 2023-10-10T23:29:44.134Z
author: Óscar Otero
_draft: true
tags:
  - Releases
---

A major version of Lume was released. In this new version, I wanted to take this
opportunity to fix some bad design decisions that seemed like a good idea at the
time, remove some confusing APIs, and implement a couple of new features.

An yes, there are some breaking changes. I tried to make the transition from
Lume 1 to Lume 2 as smoothly as possible, but not always possible. I'm sorry for
the trouble!

<!-- more -->

## Vento is the new default template engine

The default template engine in Lume 1 is Nunjucks, which is a great and
battle-tested template engine, this is why it was enabled by default.

But Nunjucks has some limitations, especially with async functions.
[Vento](https://vento.js.org/) is a new template engine that I've created. It
was available in Lume 1 through the
[`vento` plugin](https://lume.land/plugins/vento/), but in Lume 2 it's enabled
by default. Some of the strengths of Vento:

- Created natively with Deno in TypeScript.
- It has an API similar to Nunjucks (but not the same) so it's very ergonomic to
  use.
- It works great with async functions.
- You can use javascript inside the templates, so no need to use filters for
  trivial things like converting to uppercase or filtering an array.

Nunjucks is also available but not installed by default. If you want to keep
using it, just import the plugin in the `_config.ts` file:

```js
import lume from "lume/mod.ts";
import nunjucks from "lume/plugins/nunjucks.ts";

const site = lume();
site.use(nunjucks());

export default site;
```

## New `basename` variable

Although Lume allows to customize the final URL of the pages, there are some
cases not easy to achieve:

- If you want to remove a directory name: For example to export all pages in
  `/articles/` without the `/articles` folder.
- You want to change a directory name, so the `/articles/first-article.md` is
  output as `/news/first-article/`.

To achieve that in Lume 1, you have to build the new URL completely by creating
a `url()` function or setting it manually in the front matter of every page.

In Lume 2 you can change how a folder or a page affects the final URL with the
`basename` variable. It's a special variable (like `url`) but it only affects
this part of the URL, so it's much easier to make small tweaks. You only have to
define a `_data.*` file in the folder which name you want to change, with the
`basename` variable. For example, to remove the directory name from the final
URL, just set the basename as empty:

```yml
# /articles/_data.yml

basename: "" # Don't use "/articles" in the final URL
```

To change the directory name:

```yml
# /articles/_data.yml

basename: news # Use "/news" instead of "/articles" in the final URL.
```

Note that you can also remove or add additional paths:

```yml
basename: "../" # Remove the current and previous folder name
```

```yml
basename: "articles/news" # Create a subfolder
```

The `basename` variable can be used in the pages frontmatter, to change the
filename part in the final URL:

```yml
# /posts/post1.md

title: My first post
basename: my-first-post # Create the URL /posts/my-first-post/
```

The basename variable is defined automatically if it's missing. So you can use
it to search pages:

```js
pages = search.pages("basename=index");
```

Lume 1 has something similar with the `slug` variable in the `page.src`. This
variable was removed, so if you are using it to generate custom URL, you have to
modify the `url` function. Example:

```js
// Lume 1
export function url(page) {
  return `/articles/${page.src.slug}/`;
}

// Lume 2
export function url(page) {
  return `/articles/${page.data.basename}/`;
}
```

## Changes in `process`, `preprocess`, `processAll` and `preprocessAll`

In Lume 1, if you want to modify pages, you can use the `site.process` function.
For example:

```js
site.process([".html"], (page) => {
  page.document?.querySelectorAll("a[href^='http']", (a) => {
    a.setAttribute("target", "_blank");
  });
});
```

But after implementing this, we realized that sometimes we need to run some code
after or before the processor. So we had to add the `processAll` function, that
works similar to `process` but receiving all pages at the same time:

```js
site.process([".html"], (pages) => {
  console.log("Preparing");

  for (const page of pages) {
    page.document?.querySelectorAll("a[href^='http']", (a) => {
      a.setAttribute("target", "_blank");
    });
  }

  console.log("Done!");
});
```

As you can see, `processAll` is much more flexible than `process`: you not only
can run code after or before processing the pages but also decide if the code
must be run in parallel (for async operations or sequentially):

```js
// Run the code in parallel
site.process([".html"], (pages) => {
  return Promise.all(pages.map(asyncFunction));
});
```

Due `processAll` can do the same as `process` and more, for simplicity in Lume 2
the `process` function has changed to behave like `processAll`, and `processAll`
was removed. The same change has been applied to `preprocess` and
`preprocessAll` functions.

```js
// Lume 1
site.process([".html"], (page) => {
  modifyPage(page);
});

// Lume 2
site.process([".html"], (pages) => {
  pages.forEach(modifyPage);
});

// Async functions sequentially:
site.process([".html"], async (pages) => {
  for (const page of pages) {
    await modifyPage(page);
  }
});

// Async functions in parallel:
site.process([".html"], async (pages) => {
  await Promise.all(pages.map(modifyPage));
});
```

Lume has the `concurrent` utility that works similar to `Promise.all` but allows
to customize the number of processes running at the same time, which is useful
to avoid memory issues. It's the function used in Lume 1 to run the processors
in `process` and by default is limited to `200` processes.

```js
import { concurrent } from "lume/core/utils/concurrent.ts";

site.process([".html"], async (pages) => {
  await concurrent(pages, modifyPage);
});
```

## Search returns the page data

The [`search` plugin](https://lume.land/plugins/search/) provides the `search`
helper with some useful functions like `search.pages()` to return an array of
pages that meet a query. In Lume 1, this array contained the `Page` object, so
you had to access the page data from the `data` property. For example:

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

This change also affects `search.page()` (the singular version of
`search.pages()`). The `data` filter, registered by this plugin in Lume v1 was
also removed because it's now useless.

### Removed `search.tags()`

The function `search.tags()` was just a shortcut of `search.values("tags")`. It
was removed in Lume 2 for simplicity.

## TypeScript improvements

Although in Lume 1 it's possible to import and use the Lume types, it's not very
ergonomic. Lume 2 registers the global namespace `Lume` containing some useful
types.

To use the new Lume types, update the `deno.json` by adding the `types` key to
the `compilerOption` entry:

```json
{
  // ...
  "compilerOptions": {
    "types": [
      "lume/types.ts"
    ]
  }
}
```

Now you can use the `Lume` namespace anywhere, without needing to import it
manually:

```ts
export default function (data: Lume.PageData, helpers: Lume.PageHelpers) {
  return `<h1>${data.title}</h1>`;
}
```

The `Lume.PageData` accepts also a generic, so you can extend it with your own
interface:

```ts
interface Props {
  name: string;
}

export default function (data: Lume.PageData<Props>) {
  return `<h1>${data.name}</h1>`;
}
```

### DOM types

Lume uses [`deno-dom`](https://github.com/b-fuze/deno-dom) to manipulate the
HTML pages. It's an awesome package but it uses its types and that's not very
ergonomic. Let's see this example:

```js
import type { Element } "lume/deps/dom.ts";

const document = page.document;

document.querySelectorAll("img").forEach((img) => {
  const src = (img as Element).getAttribute("src");
})
```

With `deno-dom` types, you have to add the
[type assertion for `Element`](https://github.com/b-fuze/deno-dom/issues/141),
so you have to import the `Element` type.

Lume 2 loads the standard libraries
[`dom` and `dom.iterable`](https://github.com/microsoft/TypeScript-DOM-lib-generator)
(that are available by default in TypeScript but disabled in Deno). The code
above can be simplified to:

```js
const document = page.document as Document;

document.querySelectorAll("img").forEach((img) => {
  const src = img.getAttribute("src");
})
```

`deno-dom` is still used under the hood but with different types, which makes
the code much more interoperable between back and front. And no need to import
anything because DOM types are available everywhere.

### Search plugin

Another nice addition is the generics to the `search` helper, so you can search
pages with `search.pages<MyCustomPage>()`.

## Removed sub-extensions from layouts

Some extensions like `.js`, `.ts`, or `.jsx` can be used to generate pages or
javascript files to be executed by the browser. To make a distinction between
these two purposes, Lume 1 uses the `.tmpl` sub-extension. For example, you can
create the homepage of your website with the file `index.tmpl.js` (from which
the `index.html` file is generated) and also have the file `/carousel.js` with
some JavaScript code for an interactive carousel in the UI (maybe bundled or
minified with `esbuild` or `terser` plugins).

Lume 1 implementation requires the `.tmpl.js` extension not only in the main
file but also in the layouts. This makes no sense because layouts don't need to
be distinguished from other layouts. It's also inconsistent because
`_components` JavaScript files don't use the `.tmpl` sub-extension: to create
the _button_ component, the file must be named as `/_components/button.js`, and
`/_components/button.tmpl.js` would fail.

This is an example of Lume 1 structure:

```plain
_includes/layout.tmpl.js
_components/button.js
_data.js
index.tmpl.js
```

Lume 2 doesn't need sub-extension for layouts, so it's more aligned with the
components and removes that unnecessary requirement. The previous example would
become the following (but not exactly, keep reading below):

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

Note that the sub-extension is configurable. If you want to keep using `.tmpl`
as the sub-extension, just configure the `modules` and `json` plugins:

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

In Lume 1 the file `/example.njk` outputs the file `/example/index.html`, but
it's possible to output a non-HTML file by adding the extension to the filename.
For example `/example.css.njk` outputs `/example.css`.

This automatic extension detection has been proven as a bad decision because it
has unexpected behaviors. For example, we may want to create the file
`/posts/using-missing.css.njk` to talks about the
[missing.css](https://missing.style/) library but Lume outputs the file
`/posts/using-missing.css` and treat it as a CSS file.

Lume 2 removes this automatic detection and all pages will be exported as HTML
pages making it more predictable. This not only solves this issue but also align
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

Most servers and static hostings like
[Vercel](https://vercel.com/guides/custom-404-page#static-site-generator-(ssg)),
[Netlify](https://docs.netlify.com/routing/redirects/redirect-options/#custom-404-page-handling),
[GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site)
and others are configured by default to serve the `/404.html` page if the
requested file doesn't exist. It's almost a standard when serving static sites.
Lume has also this option by default. But it has also the `prettyUrls` option
enabled, so the 404 page is exported to `/404/index.html`, making the default
option for the 404 page conflict with the default option to prettify the URLs.

In Lume 2 the `prettyUrls` option is NOT applied if the page is `/404`, so the
file is saved as `/404.html` instead of `/404/`. Note that you can change this
behavior by explicitly setting the `url` variable in the front matter of the
page.

## Changes in `multilanguage` plugin

The `multilanguage` plugin in Lume 1 allows to insert inner translations in the
page data by using the `.[lang]` suffix. For example:

```yml
lang: [en, gl, es]
layout: main.vto

title: The Óscar's blog
title.gl: O blog de Óscar # galician translation
title.es: El blog de Óscar # spanish translation

links:
  - title: My personal site
    title.gl: O meu sitio persoal # galician translation
    title.es: Mi sitio personal   # spanish translation
    url: https://oscarotero.com

  - title: Lume
    url: https://lume.land
```

This feature seemed a good idea because you don't have to repeat the `links`
array only to change the `title` of some links. The problem of this feature is
Lume needs to traverse the entire data object to find keys with these suffix,
then duplicate the object for each language, reconstruct the object using only
the keys of one language without the suffix... It's a lot of stuff that can
affect to the performance, specially for big sites.

Other problem is sometimes it can produce errors if there are circular
references. For example, let's say the page has this data:

```js
export const foo = {};
foo.foo = foo;
```

Due the `foo.foo` property is referenced to the `foo` object, this causes the
_RangeError: Maximum call stack size exceeded_.

In Lume 2, this feature was removed, which makes this plugin much more
performant and removes a can of potential bugs and errors. Note that it's still
possible to have values for different languages using the root variables with
the same name as the language. For example:

```yml
# available languages in this page
lang: [en, gl, es]

# default values to all languages
layout: main.vto
title: The Óscar's blog
links:
- title: My personal site
  url: https://oscarotero.com

- title: Lume
  url: https://lume.land

# galician translations
gl:
  title: O blog de Óscar
  links:
  - title: O meu sitio persoal
    url: https://oscarotero.com

  - title: Lume
    url: https://lume.land

# spanish translations
es:
  title: El blog de Óscar
  links:
  - title: Mi sitio personal
    url: https://oscarotero.com

  - title: Lume
    url: https://lume.land
```

## Removed WindiCSS plugin and added UnoCSS

[WindiCSS is sunsetting](https://windicss.org/posts/sunsetting.html). In Lume 2
this plugin has been removed, or rather, replaced with
[UnoCSS](https://unocss.dev/).

UnoCSS plugin is similar to TailwindCSS: it uses the postcss plugin to apply the
changes and insert the code where the `@unocss` directive is defined.

## Changed the behavior of plugins with plugins

One of the goals of Lume plugins is to provide good defaults so, in most cases,
you don't need to customize anything, just use the plugin and that's all. There
are some Lume plugins like `postcss` or `markdown` that use other libraries that
also accept plugins:

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

This change affects all plugins that accept library-specific plugins like
`postcss`, `markdown`, `mdx`, and `remark`.

## Removed `--dev` mode

In Lume 1, the `--dev` mode allows outputting the pages marked as `draft`. The
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

Because dev mode is calculated in the instantiation if we want to instantiate
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

Due to this variable is not longer stored in the `site` instance, you can access
to it everywhere:

```js
if (Deno.env.get("LUME_DRAFTS") == "true") {
  // Things to do when the draft posts are visible
}
```

If you use [Lume CLI](https://github.com/lumeland/cli), there's the `--drafts`
option to add automatically this environment variable:

```sh
lume -s --drafts
# Runs `LUME_DRAFTS=true deno task lume -s`
```

## Removed `--quiet` argument

The `--quiet` flag doesn't output anything to the terminal when building a site.
In Lume 2 this option was replaced with the environment variable `LUME_LOG`.
This allows you to configure what level of logs you want to see. It uses the
[Deno's `std/log` library](https://deno.land/std/log/mod.ts), which allows
configuring 5 levels: `DEBUG|INFO|WARNING|ERROR|CRITICAL`. By default is `INFO`.

For example, to only show CRITICAL errors:

```sh
LUME_LOG=CRITICAL deno task build
```

For convenience, [Lume CLI](https://github.com/lumeland/cli) has also the
`--debug`, `--info`, `--warning`, `--error` and `--critical` options to add
automatically this environment variable:

```sh
lume -s --error
# Runs `LUME_LOG=error deno task lume -s`
```

## Removed some configuration functions

### Removed `site.includes()`

This function allows to configure the includes folder for some extensions. For
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

These three functions configure the loader and/or engine used for some
extensions for specific cases, but they have some conflicts and can override
each other. For example:

```js
site.loadComponents([".njk"], loader, engine);
site.loadPages([".njk"], loader2, engine2);
site.engine([".njk"], engine3);
```

In reality, when we want to register a new engine (like Nunjucks), we want to
use it to render pages and components, so splitting this configuration into
three different functions didn't make sense. In Lume 2 `loadComponents` and
`engine` were removed and `loadPages` configure automatically the components:

```js
site.loadPages([".njk"], { loader, engine });
```

## And more changes

Please, read the CHANGELOG.md file if you want an exhaustive list of changes.
