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

![Mom, can I update my website to Lume 3.3? Of course, honey](/uploads/meme.png)

## Lume is on Codeberg

[Codeberg](https://codeberg.org) is an alternative to GitHub, managed by a non-profit association based in Berlin, Germany. For some time now, Lume is available on both [Codeberg](https://codeberg.org/lume) and [GitHub](https://github.com/lumeland/). If you want to star, create a PR, or open issues, you can do it on either GitHub or Codeberg. The code on both platforms is synced: any commit to the GitHub repo is automatically updated on Codeberg and vice versa.

Having the code available on multiple providers gives users more choices and makes Lume more independent since it doesn't rely on a single platform.

## HMR in ES modules

ES modules are immutable by design. This means that when you import a module like `import foo from "./bar.ts"`, the content of `bar.ts` is cached forever, and the only way to reload it after a change is restarting the process.

Lume bypasses that limitation in `--serve` or `--watch` mode by adding a hash at the end of the files. For example, when Lume loads the file `_data.ts`, it's loaded as `_data.ts#123456`, so when the file changes, it can be loaded again with a different hash.

But this workaround has a big limitation: it only works for files loaded by Lume. If the `_data.ts` file has a nested import (for example, `import foo from "./bar.ts"`), this file isn't loaded by Lume, so it can't add the hash and it can't be reloaded after a change.

Fortunately, Deno 2.9.0 implemented the [module hook API of Nodejs](https://nodejs.org/api/module.html#moduleregisterhooksoptions). This API allows you to configure Deno to resolve and load modules in different ways, and Lume uses it to add the hash to all local modules loaded by Deno. This means that all modules loaded from your `src` folder will be reloaded with the new changes, no matter how they were imported.

```ts
// If bar.ts changes, it's reloaded in Lume 3.3.0!
import foo from "./bar.ts";
```

Thanks to this, it's now possible to import and use JSX components without using the `comp` variable:

```ts
// If button.tsx changes, it's reloaded in Lume 3.3.0!
import Button from "./_components/button.tsx";

export default function () {
  return <Button>Click here</Button>
}
```

## New plugin `pwa`

[Progressive web apps](https://developer.mozilla.org/docs/Web/Progressive_web_apps) allow you to convert websites to apps installable in your operating system. This plugin makes the task of creating a PWA easier, creating the `manifest.json` file and the minimal icons required by all platforms.

To use it, just create the `app` variable in the page that you want to use as the entry point (typically the homepage). Let's see an example.

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

As you can see, it's possible to use aliases to other variables (i.e. `app.name` is an alias to `title`). The plugin will generate the manifest file and the icons in different sizes using `favicon.svg` as the input image.

PWA can contain shortcuts (additional pages shown in a submenu). Use the `shortcut` variable in other pages to add shortcuts to your application:

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

## New plugin `well_known`

This plugin makes it easier to generate some [`.well_known` URLs](https://en.wikipedia.org/wiki/Well-known_URI). Since Lume is a static page generator, this plugin is limited to the specs that can be implemented statically and doesn't require dynamic server-side behaviours. In this first version, the implemented standards are:

- [atProto handle](https://atproto.com/specs/handle#https-well-known-method)
- [security.txt](https://securitytxt.org/)
- [trust.txt](https://journallist.net/reference-document-for-trust-txt-specifications)
- [webfinger](https://webfinger.net/), thanks to [Ege Celikci](https://ege.celikci.me/) (it only supports a single fixed subject, not dynamic `?resource=` lookups)
- [gpc](https://w3c.github.io/gpc/)
- [PWA origin migration](https://developer.chrome.com/blog/seamless-pwa-origin-migration)

The plugin allows to configure the data of all these standards from the `_config.ts` file:

```ts
import lume from "lume/mod.ts";
import wellKnown from "lume/plugins/well_known.ts";

const site = lume();
site.use(wellKnown({
  gpc: true,
  atProto: "did:plc:lqbfqodxim3n27heuou7do3g",
  trust: {
    contact: "mailto:info@example.com",
    social: "https://mastodon.gal/@misteroom",
    dataTrainingAllowed: false,
  },
  migratePWA: "https://old-domain.com/pwa",
}));

export default site;
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

By default, it modifies the `date` key, but you can specify a different variable:

```ts
site.use(gitDate({
  varName: "lastModified"
}));
```

## New plugin `git_info`

This plugin extracts some useful info from Git and saves it in the `gitInfo` variable. This variable is an object with the following properties:

- `branch`: The name of the current branch
- `hash`: The hash of the latest commit
- `tag`: If the latest commit is tagged, this variable contains the tag name; otherwise it's `undefined`.

This info can be used in your templates for multiple purposes. For example, to show the latest version:

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

By default, the paths of the generated files are relative to the `src` folder. The new property `base` allows you to change the base path to "root" (the same folder where `_config.ts` and `deno.json` are saved).

### Edit files

Now it's possible to edit an existing file by passing a function to the `content` property. For example, to edit the deno.json file to add a new import:

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

When running this archetype, the `deno.json` file is read, and the parsed JSON is passed to the `content` function.

### Predefined archetypes

Lume provides the following archetypes out of the box:

- `deno task new plugin`: Creates the boilerplate code for a custom plugin in the `_plugins` folder
- `deno task new archetype`: Creates the code boilerplate for a custom archetype in the `_archetypes` folder.
- `deno task new cms`: Creates the `_cms.ts` file to use LumeCMS and updates the `deno.json` file to add `lume/cms/` to the import map.

## New `--inspect, -i` flag

Now it's easier to debug Lume thanks to the `--inspect` flag. Run `deno task serve --inspect` to start an [inspect server](https://docs.deno.com/runtime/fundamentals/debugging/). Then, you can open the `chrome://inspect` URL in any Chromium-based browser and add breakpoints to inspect the code.

## Improved Lume debugbar

The [Lume debug bar](https://lume.land/docs/core/debugbar/) now displays the amount of used RAM. It's useful to detect the steps in the build that consume more memory.
