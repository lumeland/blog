---
title: How to use the "on demand" plugin in November 2022
tags:
  - How to
  - Plugins
author: Óscar Otero
date: 2022-11-22
---

The [`on_demand` plugin](https://lume.land/plugins/on_demand/) is the attempt of
Lume to provide some server-side rendering behaviour to a static site. The idea
is simple: omit some pages in the build process (with `ondemand: true`) in order
to build them when they are requested.

<!-- more -->

This allows insert dynamic content in the pages like
[in this example](https://lume-ondemand.deno.dev/), a site with the pages
showing the current time. You can see the
[code repository](https://github.com/lumeland/test-lume-ondemand), where the
current time is defined as a
[helper in the `_config.ts` file](https://github.com/lumeland/test-lume-ondemand/blob/0ea72e6449cd7e6d5ca7013d2a2b0ca0d5e3f5a5/_config.ts#L8)
and then
[called in the Nunjucks layout](https://github.com/lumeland/test-lume-ondemand/blob/0ea72e6449cd7e6d5ca7013d2a2b0ca0d5e3f5a5/_includes/layout.njk#L14)
used by both pages.

This plugin was tested only in Deno Deploy but it should work on any hosting
with Deno. But it is not all rosy in the garden, because Deno Deploy has some
limitations that makes more difficult to use this plugin, compared with the Deno
CLI that you have installed locally:

## No support for dynamic imports

One of the
[most requested features](https://github.com/denoland/deploy_feedback/issues/1)
in Deno Deploy is the ability to import modules dynamically. One year and half
since the issue was created, it's still not possible and looks like it won't be
in the short term. Lume uses dynamic imports to load pages and data in
JavaScript, JSX and TypeScript, so if your on demand pages use any of these
formats, they will fail on Deno Deploy. The only way to skip this limitation is
by generating a file that imports statically all files that should be imported
dynamically (this file is generated automatically
[by the ondemand plugin](https://lume.land/plugins/on_demand/#preload-modules)).
It's not an elegant solution but it's the only solution that works at this
moment.

## No support for NPM modules

As of version 1.12.0, Lume uses `npm:` modules for dependencies loaded
previously from esm.sh. NPM especifiers
[are not yet supported in Deno Deploy](https://github.com/denoland/deploy_feedback/issues/314).
Fortunately we can use import maps to use the esm.sh version of the NPM
packages. In the repository of the plugin demo, you can
[see the import_map.json file](https://github.com/lumeland/test-lume-ondemand/blob/0ea72e6449cd7e6d5ca7013d2a2b0ca0d5e3f5a5/import_map.json)
needed to map all NPM lume dependencies to the esm.sh equivalent.

And this is the state of the dynamic pages in Lume for now. I hope these
limitations disappear in the short term (I guess NPM modules will be supported
soon). If you know of other hosting providers with Deno support and you get the
`on demand` plugin to work there, please, let me know.
