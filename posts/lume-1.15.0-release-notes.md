---
title: Lume 1.15.0 - Release notes
date: 2023-01-09
draft: true
---

Happy new year, Lumers!

2022 was a great year for Lume, it reached to 1000 stars in GitHub and many of
you have collaborated in form of pull requests, promoting Lume in your blogs and
social networks or [sponsoring me](https://github.com/sponsors/oscarotero/) for
my work on Lume. I want to thank you and promise to keep working hard to make
Lume even better.

🔥🔥🔥🔥🔥🔥🔥🔥🔥

<!-- more -->

The version **1.15.0** is full of exciting new features.

## Archetypes

[Hugo has a nice feature called **archetypes**](https://gohugo.io/content-management/archetypes/),
templates used when creating new content. The most obvious example is a post:
instead of creating a new markdown file from scratch everytime you want to
create a new post, you can run an archetype that creates the post file for you
with a preconfigured front matter and content.

In Lume, an archetype is just a JavaScript or TypeScript file that export a
function returning an object with the file path and the file content. The
archetype must be saved in the `_archetypes` directory, inside the `src` folder.
For example:

```ts
// _archetypes/example.js

export default function () {
  return {
    path: "/pages/example.md",
    content: "Content of the file",
  };
}
```

The archetypes are invoked with the command
`deno task lume new [archetype-name]`, so run `deno task lume new example` to
run this archetype and create the file `/pages/example.md`.

The content of the file can be a string, a `Uint8Array` (for binary files), or
an object. The object is converted to string taking into account the extension
of the output path.

```ts
// _archetypes/page.ts

export default function (title: string) {
  return {
    path: `/pages/example.md`,
    content: {
      title: "This is a page",
      date: new Date(),
      draft: true,
      content: "Page content",
    },
  };
}
```

In the example above, the path has the `.md` extension, so the `content` object
is converted to the following markdown with a front matter:

```md
---
title: This is a page
date: 2023-01-05T17:38:42.550Z
draft: true
---

Page content
```

Additional arguments in the command will be passed to the function as arguments.
For example:

```ts
// _archetypes/post.ts

export default function (title: string) {
  const slug = title.replace(/\s+/g, "-").toLowerCase();

  return {
    path: `/posts/${slug}.md`,
    content: {
      title,
      date: new Date(),
      draft: true,
      content: "Page content",
    },
  };
}
```

Run `deno task lume new post "My First Post"` and the archetype will generate
the post file `/posts/my-first-post.md`.

Use a generator to create multiple files from the same archetype. In this
example, the archetype generate a markdown file and a the associated css file.

```ts
// _archetypes/post.ts

export default function* (title: string) {
  const slug = title.replace(/\s+/g, "-").toLowerCase();

  yield {
    path: `/posts/${slug}.md`,
    content: {
      title,
      date: new Date(),
      draft: true,
    },
  };
  yield {
    path: `/posts/${slug}.css`,
    content: `.post { color: blue; }`,
  };
}
```

## New `Tailwindcss` plugin

[Tailwind](https://tailwindcss.com/) support is a recurring request for Lume.
Until now it was not possible to use Tailwind in Deno, so the only alternative
available was [Windi CSS](https://lume.land/plugins/windi_css/).

The support of `npm:` packages in Deno allowed to use many NPM packages that
until now only work on Node. Still, there were errors in Tailwind due the
[`acorn-node`](https://www.npmjs.com/package/acorn-node) dependency that doesn't
work on Deno due the usage of `__proto__`.

The [`@lumeland`](https://www.npmjs.com/search?q=%40lumeland) organization in
NPM contains modified versions of the packages that don't work in Deno.
[`@lumeland/tailwindcss`](https://www.npmjs.com/package/@lumeland/tailwindcss)
is the same code as [`tailwindcss`](https://www.npmjs.com/package/tailwindcss)
but replacing this dependency. When the official library replace this dependency
with other that works on Deno, that modified version will be deprecated.

The Tailwindcss plugin depends on `postcss`, so you need to use both plugins in
this exact order:

```ts
import lume from "lume/mod.ts";
import tailwind from "lume/plugins/tailwindcss.ts";
import postcss from "lume/plugins/postcss.ts";

const site = lume();

site.use(tailwind());
site.use(postcss());

export default site;
```

## Context data

The function `site.data()` allows to insert arbitrary data in your site from the
`_config.ts` file:

```ts
site.data("layout", "main.njk");
```

The context of this data is global: is available to all pages of the site. It's
equivalent to create a `_data.yaml` file in the root of your site. As of Lume
1.15.0, it's possible to specify the directory of the data. This means that this
data will be assigned only to that directory and subdirectories. For example:

```ts
site.data("layout", "main.njk", "/posts");
```

Now, the `layout` value is available only to the pages inside the `/posts`
directory. Equivalent to creating a `/posts/_data.yml` file with this value.

Note that you can assign data not only to directories but also to files:

```ts
site.data("layout", "main.njk", "/posts/hello-world.md");
```

## Breaking changes in the plugin `date`

The `date` plugin uses the
[Deno version of `date_fns`](https://deno.land/x/date_fns@v2.15.0) to transform
the dates. The Deno's version wasn't updated in 2 years so I decided to switch
to [the Node version](https://www.npmjs.com/package/date-fns). Everything should
work fine, the only difference is to configure the locales, that need to be
imported from npm. For example, to load Galician and Portuguese languages:

```ts
import gl from "npm:date-fns/locale/gl/index.js";
import pt from "npm:date-fns/locale/pt/index.js";

//...
site.use(date({
  locales: { gl, pt },
}));
```

See the
[CHANGELOG.md file](https://github.com/lumeland/lume/blob/v1.15.0/CHANGELOG.md)
for the full list of changes.
