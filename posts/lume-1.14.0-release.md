---
title: Lume 1.14.0 is out
tags:
  - Releases
author: Óscar Otero
date: 2022-12-12
---

Lume `1.14.0` was released. This is a list of the main changes and new features.

<!-- more -->

## New functions to (pre)process all pages at the same time

The functions `site.process()` and `site.preprocess()` are used to modify pages
after or before rendering. For example, to process the HTML pages, you can do:

```js
site.process([".html"], (page) => my_processor(page));
```

This callback is executed once per page, so if you have 200 pages, the callback
is executed 200 times.

This is great to transform pages individually, but sometimes it's better to run
the function only once to all pages at the same time. Two new functions were
added for this purpose: `processAll()` and `preprocessAll()`. They are similar
to `process()` and `preprocess()` but will receive all matched pages in the
first argument:

```js
site.processAll([".html"], (pages) => {
  pages.forEach((page) => my_processor(page));
  console.log(`Processed ${pages.length} HTML pages!`);
});
```

In previous versions, the only way to do something like that was through events
like `afterRender`, `beforeRender`, `beforeSave`, etc. The advantage of using
the new `processAll` and `preprocessAll` is they respect the order of the other
processors:

```js
site.process([".html"], first_processor);
site.processAll([".html"], second_processor);
site.process([".html"], third_processor);
```

In this example, `second_processor` is run after `first_processor` and before
`third_processor`.

## Introducing `hooks`

Hooks are functions registered by some plugins that can be invoked by other
plugins or by yourself in the `_config` file. Hooks are stored in `site.hooks`
and are useful to change a plugin configuration after the installation. For
example, the `postcss` plugin sets the hook `addPostcssPlugin`. You can create a
Lume plugin to, for example, minify the css code with
[CSS Nano](https://cssnano.co):

```js
import cssnano from "npm:cssnano@5.1.14";

export default function () {
  return (site) => {
    if (!site.hooks.addPostcssPlugin) {
      throw new Error("This plugin depends on postcss");
    }

    site.hooks.addPostcssPlugin(cssnano);
  };
}
```

Now, you can use this plugin in the `_config.ts` file:

```ts
import lume from "lume/mod.ts";
import postcss from "lume/plugins/postcss.ts";
import nanocss from "./plugins/nanocss.ts";

const site = lume();

site.use(postcss());
site.use(nanocss());

export default site;
```

## Support for `splitting` mode for esbuild

[Code splitting](https://esbuild.github.io/api/#splitting) is a bundle technique
that creates separate files with common code shared by multiple entry points.
For example, if both entry points `a.ts` and `b.ts` imports `c.ts`, instead of
including the `c.ts` code in both files (which would be duplicated), the code is
saved into a _chunk_ file that is imported by both files.

To generate the _chunk_ files, we need to know all entry points first. But
thanks to the implementation of `processAll()` function (previously explained)
this is now possible in Lume. To enable the splitting mode, just need to
configure the esbuild plugin in this way:

```js
site.use(esbuild({
  options: {
    splitting: true,
  },
}));
```

## Improved `metas` plugin

A couple of improvements have been added to `metas`:

### No need for `mergedKeys`

The `metas` plugin needs a `mergedKeys` to customise the merging mode of the
`metas` key:

```yml
metas:
  site: Site title
  icon: /img/icon.png
  lang: en

# Customise the merging mode of "metas"
mergedKeys:
  metas: object
```

You no longer need to add this value manually. The plugin inserts it
automatically for you.

### Field aliases

Field aliases are the new way to reuse a value in the `metas`. For example:

```yml
title: This is the title

metas:
  title: "=title" # Alias to the title value
```

Any value starting with `=` is considered an alias to another field. You can use
dots for subvalues:

```yml
title: This is the title
intro:
  text: Page description
metas:
  title: "=title"
  description: "=intro.text"
```

Field aliases are way more powerful than the `defaultPageData` option of the
plugin, which **is deprecated and will be removed in the future**.

- Field aliases supports subvalues.
- They can be configured at page or folder level with `_data` files.

## Changes to `prism` plugin

The [prism plugin](https://lume.land/plugins/prism/) now loads the
[Prism](https://prismjs.com/) library from `npm:`. This change removes the
`languages` option so if you need to load additional languages, you have to
import them in your `_config.ts` file:

```ts
import lume from "lume/mod.ts";
import prism from "lume/plugins/prism.ts";

// Additional prism languages
import "npm:prismjs@1.29.0/components/prism-less.js";
import "npm:prismjs@1.29.0/components/prism-git.js";

const site = lume();
site.use(prism());

export default site;
```

The good news is you can also [load plugins](https://prismjs.com/#plugins).

## New plugin `filter_pages`

This plugin is the first step to deprecate the `--dev` mode of Lume (that
ignores the pages with `draft=true`). The new plugin `filter_pages` filters
pages using a callback and provides more flexibility. For example, let's say you
want to ignore the `draft` pages in the production environment:

```ts
import lume from "lume/mod.ts";
import filter_pages from "lume/plugins/filter_pages.ts";

const site = lume();
const isProd = Deno.env.get("DENO_ENV") === "prod";

site.use(filter_pages({
  fn: (page) => !isProd || !page.data.draft,
}));

export default site;
```

See the
[CHANGELOG.md file](https://github.com/lumeland/lume/blob/v1.14.0/CHANGELOG.md)
for the full list of changes.
