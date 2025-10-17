---
title: Lume 3.1.0 - Alexandre Bóveda
author: Óscar Otero
draft: false
tags:
  - Releases
comments: {}
date: 2025-10-17 18:00
---

The first minor version of Lume 3 is dedicated to
[**Alexandre Bóveda**](https://en.wikipedia.org/wiki/Alexandre_B%C3%B3veda), a
financial officer and politician who was executed on 17 August 1936 by Franco's
dictatorship because of his Galician ideals. The night before his death, he
wrote three farewell letters, the last one to his brother:

> [...] I will die peacefully; I trust that I will be received where we all want
> to get together, and I do it with joy and entrust to God this sacrifice. I
> wanted to do good, I worked for Pontevedra, for Galicia, and for the Republic,
> and the flawed judgment of men (which I forgive and you all must forgive)
> condemns me.
>
> Be more of a man now than ever because this is when you should be the most,
> for our elderly and for the children, to whom, without expecting it, you are
> going to be a little father. Comfort them all and try to always be good. Don't
> regret how much good you have done and can still do. [...]

Alexandre is not only a Galician martyr but also a demonstration that there have
always been good people in the world. Now, more than ever, we have to remember
that.

<!-- more -->

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
- It's already used to
  [publish LumeCMS](https://cdn.jsdelivr.net/gh/lumeland/cms/), deliver the
  development versions of Lume, and fetch some assets like icons or CSS code,
  needed by some plugins.
- It has a nice
  [landing page for each package](https://www.jsdelivr.com/package/gh/lumeland/lume),
  where you can see all the files, and statistics, something not possible in
  deno.land/x. We can even see statistics per file, which lets us know the
  plugins most frequently used.
- The traffic is balanced by different CDN sponsors like Cloudflare, Fastly,
  Bunny.net, etc, which ensure performance and reduce risks of relying on a
  single CDN.
- All content is permanently cached to ensure reliability. Even if the files get
  deleted from GitHub, they will continue to work on jsDelivr without breaking
  anything.

Lume will still be published on `deno.land/x`; the only difference is that the
script to update or initialize a new Lume project will choose jsDelivr by
default. That's one of the many benefits of using HTTP imports: its
decentralized nature allows you to change the CDN at any moment with zero
impact.

## Improved `deno.json` file

Deno added some great improvements to `deno.json` in recent versions that Lume
has adopted for the init and upgrade script:

### `lume` task uses bare specifier

Deno 2.4 added
[support for bare specifiers in `deno run`](https://deno.com/blog/v2.4#deno-run-bare-specifiers).
In older versions, the only way to use a specifier defined in the import map was
using `deno eval` or the ugly:

```json
{
  "tasks": {
    "lume": "echo \"import 'lume/cli.ts'\" | deno run -A -"
  }
}
```

But now, this is supported:

```json
{
  "tasks": {
    "lume": "deno run -A lume/cli.ts"
  }
}
```

### `lume` tasks have descriptions

To improve the UX, the tasks created by Lume include a description. Run
`deno task` to see all available tasks with the description:

```json
{
  "tasks": {
    "lume": {
      "description": "Run Lume command",
      "command": "deno run -A lume/cli.ts"
    },
    "build": {
      "description": "Build the site for production",
      "command": "deno task lume"
    },
    "serve": {
      "description": "Run and serve the site for development",
      "command": "deno task lume -s"
    }
  }
}
```

### Permissions

Deno 2.5
[allows to configure permissions in the `deno.json` file](https://deno.com/blog/v2.5),
and Lume adopted this nice feature. Now you have the `lume` permission preset
that is used when running the `lume` task (previously, it used the `-A` flag,
which disables the permissions). This will improve the security of your builds
and will make it easy to edit the permissions to adapt to your needs. This is
the default configuration:

```json
{
  "permissions": {
    "lume": {
      "read": true,
      "write": [
        "./"
      ],
      "net": [
        "0.0.0.0",
        "jsr.io:443",
        "cdn.jsdelivr.net:443",
        "registry.npmjs.org:443"
      ],
      "env": true,
      "run": true,
      "ffi": true,
      "sys": true
    }
  }
}
```

As you can see, Deno only has writing permissions for the current folder, net
permissions to localhost (to run the local server), and JSR, NPM and JsDelivr
(to fetch dependencies). The other permissions are granted by default because
they are needed for some plugins, but you can edit this configuration to make it
more restrictive or lax.

## Better integration with LumeCMS

One of the main challenges with LumeCMS has been integrating it smoothly with
Lume or other static site generators. Previously, LumeCMS relied on **Hono** to
run both the CMS and the page preview, which could lead to inconsistencies: a
page served by Lume (`deno task serve`) might differ from one served by LumeCMS,
since Hono's static server doesn't exactly match Lume's. For example,
middlewares configured for Lume are not available in the CMS, and this affects
features like live reload, debugbar, etc.

### Moved to middleware

With version 0.13, LumeCMS introduces
[significant changes](https://lume.land/blog/lume-cms-0-13/). Now, LumeCMS **is
a middleware on top of Lume's server**, handling only requests that start with
`/admin/*` while delegating page previews to Lume's server. This makes the
integration easier, eliminating the need for separate commands
(`deno task serve` and `deno task cms`).

This means that **the `cms` task was removed**. Just run `deno task serve` and,
if the `_cms.ts` file is present, the CMS is automatically initialized.

### Improved VPS configuration

When LumeCMS is running on a VPS, it requires two processes:

- The main process is an HTTP server that is always listening.
- The secondary process runs Lume and LumeCMS.

The main process starts the secondary process on demand and works as a reverse
proxy. This allows restarting Lume and LumeCMS after some changes (for example,
when updating the changes with `git pull` or after changing the git branch)
without closing the server.

Until now, you needed to use
[an external package](https://deno.land/x/lume_cms_adapter) to setup it. Now
it's much easier since Lume's main repo includes a module to run the CMS in
production: You only need to run `deno serve -A lume/serve.ts` and that's all!!

## New plugin: `validate_html`

This plugin checks the HTML code of your site and validates it using
[html-validate](https://html-validate.org/), a fast NPM package that works
offline.

The plugin was originally
[created by dish](https://git.pyrox.dev/pyrox/new-blog/src/commit/af1de59ce89084064e2973e0d8d3e095e1b2534a/plugins/validateHTML.ts)
and now it's an official Lume plugin, integrated with the Debug bar and with
different options to export the report.

The easiest way to use it is to import it into the `_config.ts` file:

```ts
import lume from "lume/mod.ts";
import validateHtml from "lume/plugins/validate_html.ts";

const site = lume();
site.use(validateHtml());

export default site;
```

Now you will see a new tab in the Debug bar with all HTML errors detected in the
site:

![Image](/uploads/debugbar_validate_html.png)

I hope this plugin will help you to create more standard and bug-free websites.

## New plugin: `partytown`

[Partytown](https://partytown.qwik.dev/) is a JavaScript library to run
third-party scripts in a web worker. The goal is to dedicate the main thread to
your code, and move other resource-intensive third-party scripts, like analytics
or tracking services to a different thread, making the website faster and more
secure.

The plugin was created originally
[by kwaa 2 years ago](https://github.com/lumeland/experimental-plugins/pull/21)
as an experimental plugin, and now it has moved to the main repo. To use it, you
have to register it in the _config.ts file:

```ts
import lume from "lume/mod.ts";
import partytown from "lume/plugins/partytown.ts";

const site = lume();
site.use(partytown());

export default site;
```

And now add the `type="text/partytown"` attribute to all scripts that you want
to run from the web worker:

```html
<script type="text/partytown">...</script>
```

## New plugin: `seo`

This plugin was created by [Tim Post](https://github.com/timthepost/) with the
help of [Rick Cogley](https://github.com/RickCogley/) for the Japanese language
support (thanks so much, guys!). It's a really interesting plugin that not only
can check the SEO basics (titles, descriptions, alt text in images, etc) but
also other not very common checks like common words percentage.

Since Tim couldn't maintain it, we decided to port it to the Lume repo and
convert it to an "official plugin". It was modified in order to align with the
style and conventions of other plugins, and it was simplified a bit to make it
more maintainable in the long run (originally, the project was more ambitious).

The installation is not different from other plugins, just import it into the
_config.ts file:

```ts
import lume from "lume/mod.ts";
import seo from "lume/plugins/seo.ts";

const site = lume();
site.use(seo());

export default site;
```

Like other validator plugins (`check_urls`, `validate_html`, etc), it creates a
new tab in the debug bar with all SEO issues found in all pages. It also has an
option to export the report to a JSON file or any other format by providing a
custom export function.

The plugin is highly customizable. The default options are enough for most
cases, but you can change how to validate titles, H1 tags, meta descriptions,
heading orders, duplicated titles, etc. Definitely, this plugin will help you to
create more successful websites!

## Improved remote files

The [function `remoteFile`](https://lume.land/docs/core/remote-files/) allows
the use of URLs to download the content of a file if it doesn't exist locally.
For example:

```js
site.remoteFile("/styles/styles.css", "https://example.com/styles/styles.css");
```

If the file `/styles/styles.css` doesn't exist locally, the content of the URL
will be used in place. This is very useful for themes because it allows for
placing all templates and styles used by a theme remotely.

The only problem with this function is that it only works for single files. If
you have several files, you need to call the function once per file:

```js
const files = [
  "styles.css",
  "components/button.css",
  "components/alert.css",
  "components/icons.css",
];

for (const file of files) {
  site.remoteFile("/styles/" + file, "https://example.com/styles/" + file);
}
```

### New `site.remote()` function

Lume 3.1 includes the new function `site.remote()` similar to
`site.remoteFile()` but allows to register more than one file:

```js
const files = [
  "styles.css",
  "components/button.css",
  "components/alert.css",
  "components/icons.css",
];

site.remote("/styles/", "https://example.com/styles/", files);
```

Okay, you may think this isn't a big improvement, it's just a bit simpler. But
the good news is that you can use some specifiers that are compatible with glob
patterns:

- `npm:` to use NPM packages (like `npm:lucide-static@0.544.0`)
- `gh:` to use GitHub repositories (like `gh:lumeland/theme-simple-wiki`)
- `file:` to use local files
- All URLs starting with `https://cdn.jsdelivr.net/`.

For example, let's say the CSS files are stored in a GitHub repository:

```js
const files = [
  "/styles/**/*.css",
];

site.remote("/styles/", "gh:username/repo@tag", files);
```

That's better now! Under the hood, this is possible thanks to the API of
JsDelivr. Any compatible specifier is converted to JsDelivr equivalent.

For example, `gh:lumeland/theme-simple-wiki@0.14.3` is converted to
[https://cdn.jsdelivr.net/gh/lumeland/theme-simple-wiki@0.14.3/](https://cdn.jsdelivr.net/gh/lumeland/theme-simple-wiki@0.14.3/).
And using the JsDelivr API, we can know the paths of all files in the repository
([example](ttps://data.jsdelivr.com/v1/package/gh/lumeland/theme-simple-wiki@v0.14.3?structure=flat)),
so we can filter them using the glob pattern.

### Create themes is now easier

Thanks to this new function, it's easier to create Lume themes, since you don't
have to worry about forgetting to include a new file that was recently created.
Let's see this example:

```js
const themeFiles = [
  "/_includes/**",
  "/*.css",
  "/*.js",
  "/*.vto",
];

site.remote("/", import.meta.resolve("./"), themeFiles);
```

In local development, `import.meta.resolve("./")` resolves to a `file://...`
url, so the glob patterns work great. If this package is published and imported
from JsDelivr, it's resolved to `https://cdn.jsdelivr.net/gh/user/repo@tag`, and
the glob patterns are still supported thanks to the JsDelivr API. This is
another reason to recommend distributing Deno packages on JsDelivr over
deno.land/x.

> [!note]
>
> For backward compatibility, the function `site.remoteFile` is still available
> as an alias of `site.remote`, for example, `site.remoteFile(local, remote)` is
> an alias of `site.remote(local, remote)`.

## Inline plugin works with CSS files

As of Lume 3.1, the [inline](https://lume.land/plugins/inline/) plugin not only
processes HTML files but also CSS. This allows for inlining background images
easily. To use it, just append the `?inline` parameter to the file URL. For
example:

```css
.warning {
  background-image: url("/icons/warning.svg?inline");
}
```

Is converted to:

```css
.warning {
  background-image: url("data:image/svg+xml;utf8,<svg...</svg>");
}
```

## Picture plugin allows to crop images

Until now, the [picture](https://lume.land/plugins/picture/) plugin has only
allowed the width value to resize images. For example, this configuration
transforms the image to 300px and 600px, with versions for 2x resolutions and
formats AVIF, WebP, and JPG:

```html
<img src="/flowers.jpg" transform-images="avif webp jpg 300@2 600@2">
```

Now it's possible to specify a height to crop the images to a specific aspect
ratio:

```html
<img src="/flowers.jpg" transform-images="avif webp jpg 300x150@2 600x300@2">
```

The image will be cropped to 300x150 and 600x300, with a version for 2x
resolutions. For now, there isn't any way to configure the origin of the crop
(it's always centered), but this option can be added in future versions.

---

See
[the CHANGELOG.md file](https://github.com/lumeland/lume/blob/v3.1.0/CHANGELOG.md)
to see a complete list of all changes.
