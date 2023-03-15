---
title: Lume 1.16.0 release notes
date: 2023-03-15
author: Óscar Otero
draft: true
tags:
  - Releases
---

Hi everyone! This is a brief summary of what the new version of Lume
(**1.16.0**) brings.

<!-- more -->

## Easier TypeScript

Working with Lume's Types is a bit tedious, because you have to import the types
from `lume/core.ts` everywhere:

```ts
import type { PageData, PageHelpers } from "lume/core.ts";

// Create a custom PageData interface
interface CustomPageData extends PageData {
  readingTime?: string;
}

export default function (data: CustomPageData, helpers: PageHelpers) {
  // Return the page content
}
```

Lume 1.16 comes with the `lib.d.ts` file that you can include into
`compilerOptions.lib` in the `deno.json` file:

```json
{
  "tasks": {
    "lume": "echo \"import 'lume/cli.ts'\" | deno run --unstable -A -",
    "build": "deno task lume",
    "serve": "deno task lume -s"
  },
  "imports": {
    "lume/": "https://deno.land/x/lume@v1.16.0/"
  },
  "compilerOptions": {
    "lib": [
      "deno.ns",
      "deno.window",
      "https://deno.land/x/lume@v1.16.0/lib.d.ts"
    ]
  }
}
```

This enables the `Lume` namespace in the global scope so you can use the Lume
types everywhere without importing them:

```ts
interface CustomPageData extends Lume.PageData {
  readingTime?: string;
}

export default function (data: CustomPageData, helpers: Lume.PageHelpers) {
  // Return the page content
}
```

## New `nav` plugin

The `nav` plugin builds automatically a menu of your site using the pages URLs
to define the hierarchy. For example, let's say we have a site with the
following pages:

- `/`
- `/first-article/`
- `/second-article/chapter-1/`
- `/second-article/chapter-2/`

This plugin register the `nav` variable in your templates, similar to `search`
but intended for navigation stuff. The `nav` variable has some useful functions:

### Menu

The `nav.menu()` function returns an object with the whole site structure:

```ts
const tree = nav.menu();

console.log(tree);

{
  children:
  [
    {
      title: "Index title",
      url: "/",
    },
    {
      title: "Articles page",
      url: "/articles/",
      children: [
        {
          title: "First article",
          url: "/articles/first-article/",
        },
        {
          title: "second-article",
          children: [
            {
              title: "Chapter 1",
              url: "/articles/second-article/chapter-1/",
            },
            {
              title: "Chapter 2",
              url: "/articles/second-article/chapter-2/",
            },
          ],
        },
      ],
    },
  ];
}
```

- Every item has the `title` value:
  - If it's a page or a folder with an `index` page, the `title` of this page is
    used.
  - If its a folder without an `index` page, the value is the folder name. For
    example, the `/articles/second-article/` folder doesn't have any `index`
    file so the title is the folder name (`second-article`).
- Items can have the `url` value if it's a page or a folder with an `index`
  page.
- Items can have the `children` value if it contains more pages inside.

### Breadcrumb

The `nav.breadcrumb()` function returns all parent pages of a specific page. For
example:

```ts
const breadcrumb = nav.breadcrumb("/articles/second-article/chapter-2/");

console.log(breadcrumb);

[
  {
    title: "Chapter 2",
    url: "/articles/second-article/chapter-2/",
  },
  {
    title: "second-article",
    children: ...
  },
  {
    title: "Articles page",
    url: "/articles/",
    children: ...
  },
  {
    title: "Index title",
    url: "/",
    children: ...
  },
]
```

You can see an example of the nav plugin in the
[Simple Wiki theme](https://lumeland.github.io/theme-simple-wiki/posts/firstpost/).

- The lateral menu is built with `nav.menu()`
  ([see the code](https://github.com/lumeland/theme-simple-wiki/blob/main/src/_includes/templates/menu.njk))
- The breadcrumb above the title is built with `nav.breadcrumb()`
  ([see the code](https://github.com/lumeland/theme-simple-wiki/blob/main/src/_includes/templates/breadcrumb.njk))
