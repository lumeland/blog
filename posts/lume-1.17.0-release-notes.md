---
title: Lume 1.17.0 release notes
date: 2023-05-01
author: Óscar Otero
tags:
  - Releases
draft: true
---

This is a brief summary of the changes introduced in Lume
(**1.17.0**).

<!-- more -->

## New plugin: `feed`

One of the most common things to do when developing a web site is the RSS feed. It's almost mandatory for blogs but can also be useful for any website with some regular updates. In the same way that there was a `sitemap` plugin to build the sitemap of the site, now we have the `feed` plugin to build the feed in `RSS` and `JSON Feed` format.

Thanks to [adb-sh for his initial pull request](https://github.com/lumeland/lume/pull/413).

To use this plugin, just import it in your `_config.ts` and configure it:

```ts
import lume from "lume/mod.ts";
import feed from "lume/plugins/feed.ts";

export default lume()
  .use(feed({
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
      description: "=excerpt"
    }
  }));
```

In this example, Lume creates two Feed files: `/posts.rss` (using the RSS format) and `/posts.json` (in the FEED JSON format). The file extensions determines the format that will be used.

The `query`, `sort` and `limit` options are the same as you typically use in `search.pages()` API.

The `info` object has the description of the Feed (like title, description, etc) and the `items` object the description of every item in the Feed. Both objects use the same syntax as `metas` plugin: any value starting with `=` represents a variable name that will be used to extract this info.

It's also possible to extract the info using CSS selectors. For example, let's say we want to generate a RSS with the same content as the div `.post-content`. We just have to start the value of the code with `$`:

```ts
import lume from "lume/mod.ts";
import feed from "lume/plugins/feed.ts";

export default lume()
  .use(feed({
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
      content: "$.post-content"
    }
  }));
```

