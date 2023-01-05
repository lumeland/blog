---
title: Lume 1.15.0 - Release notes
date: 2023-01-05T17:38:42.550Z
draft: true
---

Happy new year, Lumers!

2022 was a great year: Lume reached to 1000 stars in GitHub and it becomes one
of the most popular frameworks to build websites in the
[Deno's third party modules repository](https://deno.land/x). Many of you have
collaborated in form of pull requests, promoting Lume in your blogs and social
networks or [sponsoring me](https://github.com/sponsors/oscarotero/) for my work
on Lume. I want to thank you and promise to keep working hard to make Lume even
better.

🔥🔥🔥🔥🔥🔥🔥🔥🔥

<!-- more -->

The version **1.15.0** is full of exciting new features.

## Archetypes

[Hugo has a nice feature called archetypes](https://gohugo.io/content-management/archetypes/)
that are templates used when creating new content. The most obvious example is a
post: instead of creating a new markdown file from scratch everytime you want to
create a new post, you can run an archetype that creates a new post with a
preconfigured front matter and content.

In Lume, an archetype is just a JavaScript or TypeScript file that export a
function returning an object with the file path and the file content. The
archetype must be saved in the `_archetypes` directory, inside the `src` folder.
For example:

```ts
// _archetypes/post.ts

export default function (title: string) {
  const slug = title.replace(/\s+/g, "-").toLowerCase();
  const content = `---
title: ${title}
date: ${new Date().toISOString()}
draft: true
---
Post content
`;

  return {
    path: `/posts/${slug}.md`,
    content,
  };
}
```

Run `deno task lume new post "Post title"` to run this archetype and create the
new post (saved in `/posts/post-title.md`). Any argument passed to the archetype
is passed to the function (in our example it's the title).

You can return an object as the content, and Lume will convert it to the
appropiate format depending on the extension used in the path. The example above
can be simplified as following:

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
    },
  };
}
```

Use a generator to create multiple files from the same archetype. In this
example, the archetype generate a markdown file and a css file.

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
work on Deno due the usage of `__proto__`. The last version of this package is
from 3 year ago, so it's unlikely to be updated soon.

I've decided to create the
[`@lumeland`](https://www.npmjs.com/search?q=%40lumeland) organization in NPM
and publish there the modified versions of the packages that don't work in Deno.
[`@lumeland/tailwindcss`](https://www.npmjs.com/package/@lumeland/tailwindcss)
is the same code as [`tailwindcss`](https://www.npmjs.com/package/tailwindcss)
but replacing this dependency. When the official library replace this dependency
with other that works fine in Deno, the `@lumeland` version will be deprecated.

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
equivalent to create the following `_data.yaml` file in the root of your site:

```yml
# /_data.yaml
layout: main.njk
```

As of Lume 1.15.0, you can specify the directory of the data. This means that
this data will be assigned only to that directory and subdirectories. For
example:

```ts
site.data("layout", "main.njk", "/posts");
```

Now, the `layout` value is available only to the pages inside the `/posts`
directory. Equivalent to creating a `/posts/_data.yml` file with this value.

Note that you can assign data not only to directories but also to files:

```ts
site.data("layout", "main.njk", "/posts/hello-world.md");
```

## Some breaking changes

### Plugin `relations`

### Plugin `date`

See the
[CHANGELOG.md file](https://github.com/lumeland/lume/blob/v1.15.0/CHANGELOG.md)
for the full list of changes.
