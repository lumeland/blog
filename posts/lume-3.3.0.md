---
title: Lume 3.3.0 - ?
author: Óscar Otero
date: 2026-07-03
draft: true
tags:
  - Releases
comments: {}
---
<!-- more -->

## HMR in ES modules

This is an old requested feature that will make happy to many people!

ES modules are inmutable by design. It means that when you import a module like `import foo from "./bar.ts"`, the content of `bar.ts` is cached forever and the only way to reload it after a change is restarting the process.

Lume bypass that limitation in `--serve` or `--watch` mode by adding a hash at the end of the files. For example, if Lume need to load the `_data.ts` file, it's loaded as `_data.ts#123456`, so when the file changes, it can be loaded again with a different hash.

But this workaround has limitations. It only works for files loaded by Lume. If the `_data.ts` file has nested ES imports (for example, `import foo from "./bar.ts"`), they aren't loaded by Lume, so it can't add the hash.

Fortunately, Deno 2.9.0 implemented the [module hook API of Nodejs](https://nodejs.org/api/module.html#moduleregisterhooksoptions). This API allows to configure Deno how to resolve and load modules, and Lume uses it to add the hash to all local modules loaded by Deno. This means that all modules loaded from your `src` folder will be reloaded with the new changes, no matter how they were imported.

```ts
// If bar.ts changes, it's reloaded in Lume 3.3.0!
import foo from "./bar.ts";
```

Thanks to this, is now possible to import and use JSX components without using the `comp` variable:

```ts
// If button.tsx changes, it's reloaded in Lume 3.3.0!
import Button from "./components/button.tsx";

export default function () {
  return <Button>Click here</Button>
}
```

## New plugin `pwa`

[Progressive web apps](https://developer.mozilla.org/docs/Web/Progressive_web_apps) allows to convert websites to apps installable in your operating system. This plugin makes the task to create a PWA easier, creating the `manifest.json` file and the minimal icons required by all platforms.

To use it, just create the `app` variable in the page that you want to use as the entry point (typically the homepage). Let's see an example

```yml
---
title: E.T. the videogame
description: Webapp with everything about the best videogame created
tags:
  - video-game
  - atari
  - guides
metas:
  color: '#cc104a'
app:
  name: =title
  short_name: "E.T."
  description: =description
  color: =metas.color
  categories: =tags
  icon: favicon.svg
---

E.T. meets Elliott in a field of wells.
```

As you can see, it's possible to use aliases to other variables (i.e. `app.name` is an alias to `title`). The plugin will generates the manifest file and the icons in different sizes using `favicon.svg` as the input image.

PWA can include shortcuts (a submenu with additional pages). Use the `shortcut` variable in other pages to add shortcuts to your application:

```yml
---
title: How to play
description: Tricks and guides to play.

shortcut:
  name: =title
  description: =description
---

E.T. is an adventure game in which players control the alien E.T.
from a top-down perspective.
```

## New plugin `git_date`

In Lume it's possible to use the value "[Git last modified](https://lume.land/docs/creating-pages/page-data/#date)" to extract the date when a file was modified from the Git history.

```yml
---
title: Hello world
date: Git last modified
---
```

This works great but can make the build really slow for large sites because Lume runs a git command for every file. The new plugin `git_date` makes this process way faster because it only runs a single git command to return the modified date for all files.

```ts
import lume from "lume/mod.ts";
import gitDate from "lume/plugins/git_date.ts";

const site = lume();
site.use(gitDate());

export default site;
```

By default it modifies the `date` key, but you can specify a different variable:

```ts
site.use(gitDate({
  varname: "lastModified"
}));
```

## New plugin `git_info`

This plugin extracts some useful info from Git and save it in the `gitInfo` variable. This variable is an object with the following properties:

- `branch`: The name of the current branch
- `hash`: The hash of the most recent commit
- `tag`: If the most recent commit is tagged, this variable contains the tag name, otherwise it's `undefined`.

This info can be used in your templates for multiple purposes. For example to show the latest version:

```vto
Version {{ gitInfo.tag || gitInfo.hash }}
```

Or to prevent caching issues:

```vto
<link rel="stylesheet" href="/styles.css?v={{ gitInfo.hash }}">
```

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

Now it's possible to edit an existing file passing a function to the `content` property. For example, to edit the deno.json file to add a new import:

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
- `deno task new archetype`: Creates the code boilerplate for a custom archetype.
- `deno task new cms`: Creates the `_cms.ts` file to use LumeCMS and update the `deno.json` file to add `lume/cms/` to the import map.

## New `--inspect, -i` flag

Now it's easier to debug Lume thanks to the `--inspect` flag. Run `deno task serve --inspect` to start a [inspect server](https://docs.deno.com/runtime/fundamentals/debugging/). Then, you can open the `chrome://inspect` URL in any Chromium-based browser and add breakpoints to inspect the code.

## Improved Lume debugbar

The [Lume's debug bar](https://lume.land/docs/core/debugbar/) now show the RAM usage info. It's useful to detect the steps in the build that consume more memory. It also shows the time and memory usage by the starting period (everything before starting the build, where the `_config.ts` file is loaded).
