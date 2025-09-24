---
title: Lume 3.1.0 - ?
author: Óscar Otero
draft: true
tags:
  - Releases
date:
---

## Lume is moving to jsDelivr

For the past 5 years, Lume's main distribution channel has been
[deno.land/x](https://deno.land/x), the CDN created by Deno to distribute
packages using HTTP imports. This package registry has been deprecated in favor
of [JSR](https://jsr.io/), a new registry that doesn't support HTTP. Since Deno
doesn't want people to use `deno.land/x` (as indicated in the two
[big yellow banners in the page to add new modules](https://deno.com/add_module))
and migration to JSR is not an option, we decided to switch to a different CDN.

**jsDelivr** is the obvious choice for many reasons:

- It's supported by Deno
  [without any configuration](https://docs.deno.com/runtime/fundamentals/security/#importing-from-the-web).
- It's already used to publish LumeCMS, deliver the development versions of
  Lume, and fetch some assets like icons or CSS code, needed by some plugins.
- It has a nice
  [landing page for each package](https://www.jsdelivr.com/package/gh/lumeland/lume),
  where you can see all the files, and statistics, something not possible in
  deno.land/x. Since we can view statistics per file, we can also determine
  which plugins are most frequently used.
- The traffic is balanced by different CDN sponsors like Cloudflare, Fastly,
  Bunny.net, etc, which ensure performance and reduce risks of relying on a
  single CDN.
- All content is permanently cached to ensure reliability. Even if the files get
  deleted from GitHub, they will continue to work on jsDelivr without breaking
  anything.

Lume will still be published on `deno.land/x`; the only difference is that the
script to update or initialize a new Lume project will choose jsDelivr by
default. That's one of the many benefits of using HTTP imports: its
decentralized nature allows you to change the package registry at any moment
with zero impact.

## Better integration with LumeCMS

One of the biggest problems of LumeCMS is the difficulty to integrate it with
Lume or other static site generators. The reason is the use of Hono, not only
for the CMS but also to preview of the pages. This causes that a page served by
Lume (using `deno task serve`) can be different as if it were served by LumeCMS,
because the static server of Hono doesn't not work exactly like Lume's server.
For example, middlewares configured to Lume are not available in the CMS.

LumeCMS has received a lot of changes in the version 0.13 (we can talk about
that in another post), and one of them is the replacement of Hono with a
[simpler router](https://github.com/oscarotero/galo). To be clear, Hono is a
great framework, it's just that it's not the right framework for this use case.

Now, LumeCMS works as a middleware on top of the Lume's server (and only for
request starting with `/admin/*`). This makes it super easy to integrate
anywhere and removes the need of two commands `deno task serve` and
`deno task cms`. The CMS is added automatically on `deno task serve` if a
`_cms.ts` is found.
