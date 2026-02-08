---
title: Lume 3.2.0 - Rosalía
author: Óscar Otero
date: 2026-01-31
draft: true
tags:
  - Releases
comments: {}
---

So, you thought that Lume could only generate static sites, right?

**Not anymore!** As of version 3.2, Lume can also **create books** in EPUB
format. That's why I wanted to dedicate this version to one of the most
important figures of Galician literature of all time: **Rosalía de Castro**.

<!--more-->

You may know [Rosalía](https://en.wikipedia.org/wiki/Rosal%C3%ADa), the popular
Spanish singer. But in Galicia, we have another Rosalía:
[Rosalía de Castro](https://en.wikipedia.org/wiki/Rosal%C3%ADa_de_Castro),
probably our most important poet and novelist. She was a leading figure in the
period of the resurgence and revitalization of the Galician language in
literature during the 19th century (period known as
[Rexurdimento](https://en.wikipedia.org/wiki/Rexurdimento)).

Some of her poems were set to music by several artists. Do you want an example?
Enjoy
["Negra sombra" (black shadow)](https://www.youtube.com/watch?v=q_Nx2nq4oiM)
interpreted by Luz Casal.

## New plugin `epub`

[EPUB](https://www.w3.org/publishing/epub3/) is the standard format for ebooks.
Technically, it's a zip file containing files in formats like XHTML, CSS, JPEG,
PNG; and other xml files specific for ebooks (a `container.xml` manifest file, a
`content.opf` with the book structure, etc). Robin Whittleton
[wrote a great article](https://www.htmhell.dev/adventcalendar/2025/11/)
explaining how EPUB works.

Since EPUB is based on web standards that Lume understands, it seems feasible to
use Lume to create EPUBs. The only problem was the requirement of
[XHTML](https://www.w3.org/TR/xhtml11/) (HTML is not valid for EPUBs), and this
wasn't easy to do in previous versions of Lume. But in this version, Lume can
output `.xhtml` files and treat them in the same way as `.html`, hence we also
have an EPUB plugin to help you to generate EPUBs. What this plugin can do?

- Create the `container.xml`, `encryption.xml`, `mimetype`, and `content.opf`
  manifest files.
- Create the `toc.ncx` file with the book structure (using the
  [nav plugin](https://lume.land/plugins/nav/) under the hood).
- Convert the code and change the extension of all `.html` pages to `.xhtml`.
- Compress all files and create the `book.epub` file in the `dest` folder.

This is an example of using the plugin:

```js
import lume from "lume/mod.ts";
import epub from "lume/plugins/epub.ts";

const site = lume({
  prettyUrls: false, // prettyUrls don't make sense for ebooks
});

site.use(epub({
  // Book metadata
  metadata: {
    identifier: "unique identifier of your book",
    cover: "/images/cover.png",
    title: "My awesome book",
    subtitle: "History of my life",
    creator: ["Óscar Otero"],
    publisher: "Lume editions",
    language: "en-US",
    date: new Date("2026-01-31T12:18:28Z"),
  },
}));

export default site;
```

Note that the plugin cannot magically convert any website to an EPUB; you still
need to have a proper structure, use some epub specific attributes, etc. But
don't worry! the [Simple ePub theme](https://github.com/lumeland/simple-epub)
provides a nice boilerplate to start publishing books.

Learn more about this plugin
[on the documentation page](https://lume.land/plugins/epub/).

## New plugin `image_size`

This is a recurrent request, and finally, Lume has a plugin to add automatically
the `width` and `height` values of the images.

The plugin uses the awesome
[image-dimensions](https://github.com/sindresorhus/image-dimensions) library by
Sindre Sorhus. To use it, just install it like any other plugin:

```js
import lume from "lume/mod.ts";
import imageSize from "lume/plugins/image_size.ts";

const site = lume();

site.use(imageSize());

export default site;
```

Add the `image-size` attribute to the images you want the plugin to calculate
the size:

```html
<img src="/image.png" image-size>
```

And the plugin automatically adds the `width` and `height` attributes:

```html
<img src="/image.png" width="600" height="300">
```

More info [on the documentation page](https://lume.land/plugins/image_size/).

## New plugin `extract_order`

Sometimes you have a list of pages that you want to show in a specific order. A
common way to do that is to define an `order` variable in the front matter:

```md
---
title: Article 3
order: 3
---

This is the article 3
```

Then, you only have to select the pages in this specific order:

```vto
{{ set pages = search.pages("type=article", "order=asc") }}
```

This works great, the only problem is that you can't see the pages in the same
order in your code editor or file system because they are ordered
alphabetically:

```
/article-three.md
/first-article.md
/other-article.md
```

With this plugin you can set the order in the filename, using the format
`{number}.filename`, and this value will be used as the `order` variable. The
plugin also removes this prefix from the final URL by default (configurable).

```
/1.first-article.md
/2.other-article.md
/3.article-three.md
```

This also works great for folders:

```
/1.articles/
   1.first-article.md
   2.other-article.md
   3.article-three.md
/2.notes/
   1.note-one.md
   2.note-two.md
```

To use it:

```js
import lume from "lume/mod.ts";
import extractOrder from "lume/plugins/extract_order.ts";

const site = lume();

site.use(extractOrder());

export default site;
```

More info [on the documentation page.](https://lume.land/plugins/extract_order/)

## New plugin `replace`

This simple plugin allows to perform simple text replacements in the site,
something especially useful for documentation sites. For example, let's say you
want to display always the last version of your library in a website:

```md
Welcome to Libros 2.3.0, the library to read ebook. To getting started, run the
following command:

deno install --global https://deno.land/x/libros@2.3.0/mod.ts
```

Instead of harcoding the version number everywhere in your site (and remember to
update it after a new version), this plugin allows to use a placeholder:

```md
Welcome to Libros $VERSION, the library to read ebook. To getting started, run
the following command:

deno install --global https://deno.land/x/libros@$VERSION/mod.ts
```

Now, configure the replacements in the plugin options:

```js
import lume from "lume/mod.ts";
import replace from "lume/plugins/replace.ts";

const site = lume();

site.use(replace({
  replacements: {
    "$VERSION": "2.3.0",
  },
}));

export default site;
```

Now you have this value centralized in one place. This is the approach used in
the Lume website to
[keep the versions of all packages up to date](https://github.com/lumeland/lume.land/blob/055eac5d0a960ab014eedc552492237c6613dbac/_config.ts#L54).

You can use this plugin for any constant value that you want to use globally,
like a query parameter for caching CSS and JS files, the hash of the latest
commit, the year in the copyright, etc.

More info [on the documentation page](https://lume.land/plugins/replace/).

## `parseBasename` can access the parent values

The function
[`site.parseBasename`](https://lume.land/docs/core/basename-parsers/) allows
registering functions to extract values from files and folders. In fact, it's
what the `extract_order` and `extract_date` plugins use under the hood.

As of Lume 3.2, the data from the parent folder is added as the second argument.
This allows us to compose values contextually using the names of different
folders. For example, let's say we have some files with the following paths:

```
/2026/01/01/happy-new-year.md
/2026/01/05/this-year-sucks.md
```

Now you can compose the final date of each file using the values of the
directories and subdirectories. For example:

```js
site.parseBasename((basename, parent) => {
  // Check if the name only contains numbers
  if (!/^\d+$/.test(name)) {
    return;
  }

  // 4 digits, it's the year
  if (basename.length === 4) {
    return { year: basename, basename }
  }

  // 2 digits, it's the month or day
  if (basename.length === 2) {
    // If the month isn't in the parent, this is the month
    if (!parent.month) {
      return { month: basename, basename }
    }

    // This is the day, generate the final date
    const { year, month } = parent;
    return {
      date: `${year}`-${month}`-${basename}`,
      basename,
    }
  }
})
```

## `watcher.dependencies` option

The Lume file watcher detects changes in your files in order to rebuild the site
with the new content. An important aspect is that only the changed files are
reloaded, which is way faster than reloading all files every time something
changed. This works great in 99% of the cases, but there are some edge cases
where we need to say Lume to reload a file when another file has changed.

As an example, let's say you have some data stored in a SQLite database and you
want to expose some of its data to your pages using a `_data.ts` file:

```js
// _data.ts
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("database.db");

export const categories = db.prepare(`
  SELECT
    categories.id,
    categories.name
  FROM categories
`).all();

db.close();
```

As you can see, we are exporting the `categories` variable, and this will make
it available to all pages. If we make changes in the `database.db` file, Lume
will detect that the file has changed, but because `_data.ts` hasn't changed,
Lume won't re-run this file, so the new changes won't be available. What we
really want is to reload the `_data.ts` file every time the `database.db` file
has changed. And now we can do it thanks to the new `watcher.dependencies`
option:

```ts
import lume from "lume/mod.ts";

const site = lume({
  watcher: {
    dependencies: {
      "_data.ts": ["database.db-journal"],
    },
  },
});

export default site;
```

Here we are telling Lume that the file `_data.ts` depends on
`database.db-journal` (the extension `.db-journal` is used by SQLite to create a
temporary file during the data transactions). Now Lume knows that every time any
of its dependencies change, `_data.ts` will be reloaded too.

## Better logs

When Lume builds a site, the logger outputs messages to the terminal in the same
order they are generated. One problem with this approach is that there are
messages more important than others, and, especially if the site has a lot of
pages, those messages can be lost among others. Another problem is that if the
same error is produced by different pages, it's shown once per page, which
produces a lot of noise and prevents seeing other important messages. Let's see
an example:

```
WARN [esbuild plugin] No TS, JS, TSX, JSX files found. Use site.add() to add files. For example: site.add("script.js")
ERROR SourceError: Unclosed tag
/_includes/templates/blocks.vto:4:3
 1 | {{ for block of blocks }}
 2 |   {{ if !block.hide }}
 3 |     {{ await comp[block.type]({ block, lang, url }) }}
 4 |   {{ /if }
   |   ^ Unclosed tag
ERROR SourceError: Unclosed tag
/_includes/templates/blocks.vto:4:3
 1 | {{ for block of blocks }}
 2 |   {{ if !block.hide }}
 3 |     {{ await comp[block.type]({ block, lang, url }) }}
 4 |   {{ /if }
   |   ^ Unclosed tag
🔥 /docs/configuration/env-variables/ <- /docs/configuration/env-variables.md
🔥 /docs/configuration/config-file/ <- /docs/configuration/config-file.md
🔥 /docs/configuration/add-files/ <- /docs/configuration/add-files.md
🔥 /img/extend.svg <- /img/extend.svg
🔥 /img/deploy.svg <- /img/deploy.svg
...
🔥 /img/http-imports.svg <- /img/http-imports.svg
🔥 /init.ts <- /static/init.ts
🔥 /img/gradient.png <- /img/gradient.png
🔥 /img/zero-runtime.svg <- /img/zero-runtime.svg
🔥 /logo.png <- /static/logo.png
WARN [validate_html plugin] 512 HTML error(s) found. Setup an output file or check the debug bar.
WARN [seo plugin] 45 SEO error(s) found. Setup an output file or check the debug bar.
🍾 Site built into ./_site
  188 files generated in 6.28 seconds
```

In the example, the Vento error shown twice because it occurred on two pages.
There are some WARN errors at the start and others at the end, and a long list
of generated pages in the middle.

In order to make the logs clearer, two changes were introduced in this version
of Lume:

- Messages of type WARN, ERROR, and FATAL are shown at the end, sorted by
  severity (WARN first, FATAL last). Other levels (TRACE, DEBUG, and INFO) are
  still shown as they were produced.
- Duplicated logs are removed.

The example above is shown as follows in the new version:

```
...
🔥 /img/http-imports.svg <- /img/http-imports.svg
🔥 /init.ts <- /static/init.ts
🔥 /img/gradient.png <- /img/gradient.png
🔥 /img/zero-runtime.svg <- /img/zero-runtime.svg
🔥 /logo.png <- /static/logo.png
🍾 Site built into ./_site
  188 files generated in 6.28 seconds
WARN [validate_html plugin] 512 HTML error(s) found. Setup an output file or check the debug bar.
WARN [seo plugin] 45 SEO error(s) found. Setup an output file or check the debug bar.
WARN [esbuild plugin] No TS, JS, TSX, JSX files found. Use site.add() to add files. For example: site.add("script.js")
ERROR SourceError: Unclosed tag
/_includes/templates/blocks.vto:4:3
 1 | {{ for block of blocks }}
 2 |   {{ if !block.hide }}
 3 |     {{ await comp[block.type]({ block, lang, url }) }}
 4 |   {{ /if }
   |   ^ Unclosed tag
```

This hopefully ensures that you won't miss anything important during the build
process!

## Other changes

This version also includes some minor changes and several bugfixes. Some of
them:

- `katex` plugin supports `mhchem` extension and includes an option to disable
  the download of CSS and fonts.
- The `date` filter registered by `date` plugin detects the language of the
  current page.
- Some improvements to the LumeCMS integration.
- If you have a `script.ts` file, it no longer conflicts with the `script.js`
  file generated by components.
- Fix globbing on npm/gh specifiers.
- And many more changes that you can see in the CHANGELOG.md file.

Finally, I'd like to thank all contributors for helping make Lume so great with
PR or supporting the project with sponsoring and donations. 🫶
