---
title: Lume 1.17.0 release notes
date: 2023-05-01
author: Óscar Otero
tags:
  - Releases
draft: false
---

This is a brief summary of the main changes introduced in Lume (**1.17.0**).

<!-- more -->

## New plugin: `feed`

One of the most common things to do when developing a web site is the RSS feed.
It's almost mandatory for blogs but it can also be useful for any website with
some regular updates. In the same way that there was a
[`sitemap` plugin](https://lume.land/plugins/sitemap/) to build the sitemap of
the site, Lume 1.17 introduces the new
[`feed` plugin](https://lume.land/plugins/feed/) to build a feed in `RSS` or
`JSON Feed` format.

🔥🔥 Thanks to
[adb-sh for his initial pull request](https://github.com/lumeland/lume/pull/413).

To use this plugin, just import it in your `_config.ts` and configure it:

```ts
import lume from "lume/mod.ts";
import feed from "lume/plugins/feed.ts";

const site = lume();

site.use(feed({
  output: ["/posts.rss", "/posts.json"],
  query: "type=post",
  sort: "date=desc",
  limit: 10,
  info: {
    title: "My awesome blog",
    description: "Post updates of my blog",
  },
  items: {
    title: "=title",
    description: "=excerpt",
  },
}));

export default site;
```

In this example, Lume creates two Feed files defined in the `output` key:
`/posts.rss` (in RSS format) and `/posts.json` (in
[JSON Feed format](https://www.jsonfeed.org/)). The file extensions determines
the format to use.

The `query`, `sort` and `limit` options are the same as you typically use in the
[`search.pages()`](https://lume.land/plugins/search/) API.

The `info` object has the description of the Feed (like title, description, etc)
and the `items` object the description of every item in the Feed. Both objects
use the
[same aliases as `metas` plugin](https://lume.land/plugins/metas/#field-aliases):
any value starting with `=` represents a variable name that will be used to
extract this info. In our example, the title and description is the same as the
title and excerpt variables of the page.

It's also possible to extract the info using CSS selectors. For example, let's
say we want to generate a RSS with the same content as the div `.post-content`.
We just have to start the value of the code with `$`:

```ts
import lume from "lume/mod.ts";
import feed from "lume/plugins/feed.ts";

const site = lume();

site.use(feed({
  output: ["/posts.rss", "/posts.json"],
  query: "type=post",
  sort: "date=desc",
  limit: 10,
  info: {
    title: "My awesome blog",
    description: "Post updates of my blog",
  },
  items: {
    title: "=title",
    description: "=excerpt",
    content: "$.post-content",
  },
}));

export default site;
```

If you want to create more than one feed, just use the plugin once per feed:

```ts
site.use(feed({
  output: "/posts.rss",
  // Posts feed configuration
}));

site.use(feed({
  output: "/articles.rss",
  // Articles feed configuration
}));
```

## SASS supports remote files

In this version, Lume got a big refactoring of how the files in the `src`
directory are scanned, loaded and refreshed. This change fixed some existing
bugs and open the door for new possibilities, because now it will be easier to
implement new features.

Thanks to this refactoring, SASS plugin supports
[remote files](https://lume.land/docs/core/remote-files/), so you can load your
variables and mixings from a remote URL to use them in your build:

```ts
import lume from "lume/mod.ts";
import sass from "lume/plugins/sass.ts";

const site = lume();
site.use(sass());

site.remoteFile(
  "/_includes/variables.scss",
  "https://example.com/theme/variables.scss",
);

export default site;
```

```css
@import "variables.scss";

body {
  color: $main-color;
}
```

The're a breaking change in the SASS plugin: the `includes` option accepts only
a string instead of an array of paths.

## Allow to pass extra data to on demand pages

The [on_demand plugin](https://lume.land/plugins/on_demand/) allows to render a
page on request time, instead of build time. This is useful to insert dynamic
content and reduce the build time specially for big sites. Lume 1.17 introduces
a way to insert additional variables to the page before rendering.

The `onDemand` plugin has the new option `extraData` which accepts a function
that must return an object with the extra data to be passed to the page. For
example, let's say we want to pass the search parameters of the request's url:

```ts
import lume from "lume/mod.ts";
import onDemand from "lume/plugins/on_demand.ts";

site.use(onDemand({
  extraData(request: Request) {
    const searchParams = new URL(request.url).searchParams;
    const params = Object.fromEntries(searchParams.entries());

    return {
      params,
    };
  },
}));

export default site;
```

Now, the on demand pages will have the `params` key with the search params
values. For example, in a Nunjucks page:

```njk
---
layout: layout.njk
ondemand: true
url: /example/
---

Hello {{ params.name }}
```

The URL `/example/?name=Óscar` will return `Hello Òscar`.

Note that on-demand pages works better on Deno CLI than Deno Deploy. There's a
[post explaining the current limitations on Deno Deploy](./ondemand-plugin-november-2022.md),
so you should consider this plugin as highly experimental.

## Removed old code

A few versions ago, Lume removed the ability to be installed globally (with
`deno install ...`) in benefit of `deno task`. Some old files were keept for
backward compatibility when upgrading from an old version. Now these files were
removed (`ci.ts`, `install.ts`). If you get any issue running Lume (specially in
CI environments), please update your script to use `deno task lume`.

There are more changes in Lume 1.17, like bug fixes in some plugins, dependency
updates, etc. See the
[CHANGELOG.md file](https://github.com/lumeland/lume/blob/v1.17.0/CHANGELOG.md)
for the full list of changes.
