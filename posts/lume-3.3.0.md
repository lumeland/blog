---
title: Lume 3.3.0 - ?
author: Óscar Otero
date: 2026-07-03
draft: true
tags:
  - Releases
comments: {}
---
## HMR in ES modules

This is an old requested feature that will make happy to many people!

ES modules are inmutable by design. This means that when you import a module like `import foo from "./bar.ts"`, the code of `bar.ts` is cached forever and it's impossible to reload after a change without restarting the process.

Lume tried to bypass that limitation in `--serve` or `--watch` mode adding a hash at the end of the file. For example, if you have a `_data.ts` file that Lume need to load, it's loaded as `_data.ts#123456`, so when the file changes, it can be reloaded again changing the hash.

But this workaround have limitations. It only works for files loaded directly by Lume. If your `_data.ts` file has a `import [...]`, this nested module is not loaded by Lume, so it can't add a hash. That's the reason why JSX components need to be used using the `comp.` variable instead of importing it directly.

Fortunately, this is no longer neccessary. Deno 2.9.0 implemented the [module hook API of Nodejs](https://nodejs.org/api/module.html#moduleregisterhooksoptions). This allows to configure Deno to add the hash instead of Lume, so it will work for all imported modules.

```ts
// If bar.ts changes, it's reloaded in Lume 3.3.0
import foo from "./bar.ts";
```

## New plugin `pwa`

[Progressive web apps](https://developer.mozilla.org/docs/Web/Progressive_web_apps) allows to convert any website to an app, installable in your operating system. This plugin makes the task to create a PWA easier, creating the `manifest.json` file and the minimal icons required by all platforms.

To use it, just create the `app` variable in the page that you want to use as the entry point (typically the homepage). Let's see an example

```yml
---
title: Hello world
description: The best progressive web application
tags:
  - hello
  - world
metas:
  color: '#334455'
app:
  name: =title
  short_name: "hello"
  description: =description
  color: =metas.color
  categories: =tags
  icon: favicon.svg
---

Hello world
```

As you can see, it's possible to use aliases to other variables (i.e. `app.name` is an alias to `title`). The plugin will generates the manifest file and the icons in different sizes using `favicon.svg` as the input image.

PWA can include shortcuts (a submenu with additional pages). Use the `shortcut` variable in other pages to add shortcuts to your application:

```yml
---
title: This is a subsection
description: The description of the subsection

shortcut:
  name: =title
  description: =description
---

Hello world
```

## New plugin `git_date`

to-do

## New plugin `git_info`

to-do

## Improved archetypes

[Lume archetypes](https://lume.land/docs/core/archetypes/) got some improvements in this new version.

### Named archetypes

Now it's possible to add new archetypes under a name from the `_config.ts` file, using the `site.archetype()` function:

```ts
// Use a file path or URL
site.archetype("post", "_archetypes/post.ts");

// Use a function:
site.archetype("post", () => {
  const name = prompt("Name of the post");
  return {
    path: `/posts/${name}.md`,
    content: "Start typing...",
  };
})
```

Now you can run `deno task new post` and the archetype is executed. This can be useful for plugins or themes to register custom archetypes.

### `base` option

By default, the paths of the generated files are relative to the `src` folder. The new property `base` allows to change the base path to "root" (the same folder where `_config.ts` and `deno.json` are saved).

### Edit files

Until now, archetypes only generated new files. Now it's possible to edit an existing file passing a function to the `content` property. For example, to edit the deno.json file to add a new import:

```ts
export default function () {
  return {
    path: "deno.json",
    base: "root", // to save the file in the root directory instead of src
    content(json) {
      json.imports["new-import/"] = "https://example.com/";
      return json;
    }
  }
}
```

When running this archetype, the `deno.json` file is read and the parsed JSON is passed to the `content` function.

### Predefined archetypes

Lume provides the following archetypes out of the box:

- `deno task new plugin`: Creates the boilerplate code for a custom plugin
- `deno task new archetype`: Creates the code scaffold for a custom archetype.
- `deno task new cms`: Creates the `_cms.ts` file to use LumeCMS.

## New `--inspect, -i` flag

Now it's easier to debug Lume thanks to the `--inspect` flag. Run `deno task serve --inspect` to start a [inspect server](https://docs.deno.com/runtime/fundamentals/debugging/). Then, you can open the `chrome://inspect` URL in any Chromium-based browser and add breakpoints to inspect the code.

## Improved Lume debugbar

The [Lume's debug bar](https://lume.land/docs/core/debugbar/) now show the RAM usage info. It's useful to detect the steps in the build that consume more memory.
