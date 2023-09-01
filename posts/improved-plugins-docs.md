---
title: Improved plugins docs
date: 2023-09-01T13:54:48.243Z
author: Óscar Otero
draft: false
tags:
  - Plugins
---

Documentation is possibly one of the most important things for the adoption of
any OSS project. No matter if your software is good and easy to use: if you
don't communicate it well, most people won't spend time figuring out how to use
it.

Lume was very clear about that from the beginning and a lot of effort was put
into the documentation website. But one of the difficulties is to keep it
updated with the new changes because **wrong** documentation is worse than no
documentation.**

## Plugins documentation

Documentation is especially challenging for the
[plugins section](https://lume.land/plugins/): A lot of plugins, each one with
its configuration, many of them depend on external libraries (like nunjucks,
pug, etc.) which have more configuration, etc. Maintaining all this info up to
date is a hard time-consuming job.

But Lume is built on top of Deno, and Deno is supposed to make our life better,
right? (at least our life as developers). **And it does!** because Deno includes
a
[Documentation generator](https://deno.land/manual@v1.36.3/tools/documentation_generator)
thanks to `deno`doc`, which can extract a lot of interesting info from
TypeScript files. It's used to build automatically the modules' documentation in
deno.land/x repository. Take a look at
[the options](https://deno.land/x/lume@v1.18.5/plugins/date.ts?s=Options) for
the date plugin](https://deno.land/x/lume@v1.18.5/plugins/date.ts?s=Options).

## Deno Doc + Aldara

With this idea in mind, I started working on a tool to generate this kind of
documentation automatically to be displayed inside the lume.land website. Most
Lume plugins export the following two elements:

- [The `Options` interface](https://github.com/lumeland/lume/blob/5e03f8c13d9e0af6c3737bd2813449d59d2084e6/plugins/code_highlight.ts#L6-L18)
  with the types of plugin options
- [The `defaults` object](https://github.com/lumeland/lume/blob/5e03f8c13d9e0af6c3737bd2813449d59d2084e6/plugins/code_highlight.ts#L21-L31)
  with the default options.

The idea is to use these two elements to build automatically the documentation
for every plugin. This not only saves time but also ensures the documentation is
always up to date.

The command `deno doc --json` outputs the info in JSON format, perfect for
processing. I've created the
[aldara library](https://github.com/oscarotero/aldara) that gets the types from
Deno Doc, transforms the JSON to a more easy-to-consume structure and even
completes some missing info with any JsDoc content found. Then, it can set the
default values from the `defaults` object exported by the plugin and that's all!

The code do all this stuff it is very simple:

```ts
import analyze, {
  mergeDefaults,
} from "https://deno.land/x/aldara@v0.1.1/mod.ts";

async function getScheme(mod: string) {
  const url = `https://deno.land/x/lume@v1.18.5/${mod}`;
  const { defaults } = await import(url);
  const { Options } = await analyze(url, { maxDepth: 2 });

  mergeDefaults(Options, defaults);
  return Options.children;
}
```

You can see an example in the
[Minify HTML plugin documentation](https://lume.land/plugins/minify_html/).

## Future

This is only the first version, there's a lot of room for improvement. I've
found some issues in `deno doc` that I hope they were fixed at some point soon:

- `npm:` dependencies are not supported, so the types provided by NPM packages
  are not included.
- There are memory issues with circular dependencies
  ([issue #303](https://github.com/denoland/deno_doc/issues/303)), so private
  types (those that are not exported) cannot be displayed.

Anyway, even with these issues, I think the plugin documentation is now much
better than it was. Please, let me know if you have any questions or have found
any issues.
