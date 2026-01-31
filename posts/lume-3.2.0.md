---
title: Lume 3.2.0 - Rosalía
author: Óscar Otero
date: 2026-01-31
draft: true
tags:
  - Releases
comments: {}
---

So, you thought that Lume only can generate static sites, right?

**Not anymore!** As of version 3.2, Lume can also create books in EPUB format.
That's why I wanted to dedicate this version to one of the most important
galician writer of all time: Rosalía de Castro.

<!--more-->

You maybe know [Rosalía](https://en.wikipedia.org/wiki/Rosal%C3%ADa), the
popular Spanish singer. But in Galicia we have another Rosalía:
[Rosalía de Castro](https://en.wikipedia.org/wiki/Rosal%C3%ADa_de_Castro),
probably our most important poet and novelist. She was a leading figure in the
period of the resurgence and revitalization of the Galician language in the
literature during the 19th century (period known as
[Rexurdimento](https://en.wikipedia.org/wiki/Rexurdimento)).

## New plugin `epub`

[EPUB](https://www.w3.org/publishing/epub3/) is the standard format for ebooks.
Tecnically, it's a zip file containing files in formats like XHTML, CSS, JPEG,
PNG; and other xml files specific for ebooks (a `container.xml` manifest file, a
`content.opf` with the book structure, etc). Robin Whittleton
[wrote a great article](https://www.htmhell.dev/adventcalendar/2025/11/)
explaining how EPUB works.

Since EPUB is based on web standards that Lume understand, it seems feasible to
use Lume to create EPUBs. The only problem was the requirement of
[XHTML](https://www.w3.org/TR/xhtml11/) (HTML is not valid for EPUBs) and this
wasn't easy to do in previous versions of Lume. But in this version Lume can
output `.xhtml` files and treat them in the same way as `.html` hence we have
also a epub plugin to make easy the generation of epubs.

Note that the plugin cannot magically convert any website to a epub, you still
need to have a proper structure, but it does the following:

- Create the `container.xml`, `encryption.xml`, `mimetype` and `content.opf`
  manifest files.
- Create the `toc.ncx` file with the book structure (using the
  [nav plugin](https://lume.land/plugins/nav/) under the hood).
- Change the extension of all `.html` pages to `.xhtml`.
- Compress all files and create the `book.epub` file in the `dest` folder.

This is an example of using the plugin:

```js
import lume from "lume/mod.ts";
import epub from "lume/plugins/epub.ts";

const site = lume({
  prettyUrls: false, // prettyUrls don't make sense for ebooks
}, {
  markdown: {
    options: {
      xhtmlOut: true, // ensure markdown outputs xhtml
    },
  },
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

## New plugin `image_size`

This is a recurrent request and finally Lume has a plugin to add automaticaly
the `width` and `height` values to the images.

The plugin use the awesome
[image-dimensions](https://github.com/sindresorhus/image-dimensions) library by
Sindre Sorhus. To use it, just install like any other plugin:

```js
import lume from "lume/mod.ts";
import imageSize from "lume/plugins/image_size.ts";

const site = lume();

site.use(imageSize());

export default site;
```

Add the `image-size` attribute to the images you want the plugin calculates the
dimmensions

```html
<img src="/image.png" image-size>
```

And the plugin automatically add the `width` and `height` attributes:

```html
<img src="/image.png" width="600" height="300">
```

## New plugin `extract_order`

Sometimes you have a list of pages that you want to show in a specific order. A
common way to do that is defining a `order` variable in the front matter:

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

The problem of this approach is the pages are not ordered in your IDE, because
the order is not in the filename:

```
article-three.md
first-article.md
other-article.md
```

This plugin can extract the order value from the filename so you can see them
sorted in all places:

```
1.first-article.md
2.other-article.md
3.article-three.md
```

This also works great for folders:

```
1.articles/
  1.first-article.md
  2.other-article.md
  3.article-three.md
2.notes/
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

## `parseBasename` can access to the parent values

The option `site.parseBasename` allows to register functions to extract values
from files and folders. In fact, it's what the `extract_order` and
`extract_date` plugins use under the hood.

As of Lume 3.2, the parent value is added as the second argument. This allows to
compose values contextually using the name of different folders. For example,
let's say we have some files with following paths:

```
2026/01/01/happy-new-year.md
2026/01/05/this-year-sucks.md
```

Now you can compose the final date of each file using the values of the
directories and subdirectories. For example:

```js
site.parseBasename((basename, parent) => {
  // Check if the name only contain numbers
  if (!/^\d+$/.test(name)) {
    return;
  }

  // 4 digits, it's the year
  if (basename.length === 4) {
    return { year: basename, basename }
  }

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

## Other changes

This version includes also some other minor changes and several bugfixes. You
can read the details in the CHANGELOG.md file.
