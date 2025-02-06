---
title: Lume 2.5.0 - Pedro Días and Muño Vandilaz
tags:
  - Releases
comments:
  src: 'https://fosstodon.org/@lume/113809933279141292'
  bluesky: 'https://bsky.app/profile/lume.land/post/3lfhsmfri6l2y'
date: '2025-01-11T00:00:00.000Z'
draft: false
---

**_Feliz aninovo_ 🎄!**

New year and new Lume version! This time, I'd like to dedicate it to Pedro Días
and Muño Vandilaz, who married on April 16, 1061, almost a thousand years ago.
This is the first same-sex marriage documented in Galicia (and the rest of
Spain).

The wedding took place in a small Catholic chapel. It's surprising to see how
homophobic prejudices have changed since then. If you want to read more about
this event take a look at
[this Qnews article (English)](https://qnews.com.au/on-this-day-april-16-pedro-diaz-and-muno-vandilaz/)
or
[gCiencia post (Galician)](https://www.gciencia.com/tribuna/unha-voda-entre-dous-homes-no-ourense-do-seculo-xi/).

<!-- more -->

## New plugin `json_ld`

[JSON-LD](https://json-ld.org/) (JSON for Linking Data) is a way to provide
[structured data](https://www.schema.org/) to web pages using JSON format, which
is easier to parse and doesn't require to modify the HTML code. It's defined
with a `<script type="application/ld+json">` element containing the JSON code.
For example:

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://oscarotero.com/",
    "headline": "Óscar Otero - Web designer and developer",
    "name": "Óscar Otero",
    "description": "I’m just a designer and web developer",
    "author": {
      "@type": "Person",
      "name": "Óscar Otero"
    }
  }
</script>
```

The `json_ld` plugin, created by [Shuaixr](https://github.com/shuaixr), makes
easier to work with this structured data. Edit your `_config` file to install
it:

```js
import lume from "lume/mod.ts";
import jsonLd from "lume/plugins/json_ld.ts";

const site = lume();
site.use(jsonLd());

export default site;
```

Then, you can create the `jsonLd` variable in your pages. For example:

```yml
jsonLd:
  "@type": WebSite
  url: /
  headline: Óscar Otero - Web designer and developer
  name: Óscar Otero
  description: I’m just a designer and web developer
  author:
    "@type": Person
    name: Óscar Otero
```

Note the following:

- The plugin automatically adds the `@context` property if it's missing
- URLs can omit the protocol and host. The plugin automatically resolves all
  URLs based on the `location` of the site.

Like with other similar plugins like [metas](https://lume.land/plugins/metas/),
you can use field aliases:

```yml
title: Óscar Otero - Web designer and developer
header:
  title: Óscar Otero
  description: I’m just a designer and web developer

jsonLd:
  "@type": WebSite
  url: /
  headline: =title
  name: =header.title
  description: =header.description
  author:
    "@type": Person
    name: =header.title
```

### TypeScript

If you want to use TypeScript, there's the `Lume.Data["jsonLd"]` type (powered
by [schema-dts](https://www.npmjs.com/package/schema-dts) package):

```ts
export const jsonLd: Lume.Data["jsonLd"] = {
  "@type": "WebSite",
  url: "/",
  headline: "Óscar Otero - Web designer and developer",
  description: "I’m just a designer and web developer",
  name: "Óscar Otero",
  author: {
    "@type": "Person",
    name: "Óscar Otero",
  },
};
```

More info in the
[plugin documentation page](https://lume.land/plugins/json_ld/).

## New plugin `purgecss`

[PurgeCSS](https://purgecss.com/) is a utility to remove unused CSS code, making
your CSS files smaller to improve the site performance. The tool provides a
Postcss plugin so, in theory, it can also be used in Lume. Now it has its own
plugin (big thanks to [_into-the-v0id_](https://github.com/into-the-v0id)) which
has some advantages:

- Scan generated HTML pages by Lume
- Scan bundled JS dependencies (bootstrap, etc)
- Only include CSS that is necessary (don't include drafts or conditional HTML
  that does not make it into the build)

```js
import lume from "lume/mod.ts";
import purgecss from "lume/plugins/purgecss.ts";

const site = lume();
site.use(purgecss());

export default site;
```

Go to the [plugin documentation page](https://lume.land/plugins/purgecss/) for
more info.

## New `router` middleware

Lume is a static site generator (and always will be). But sometimes you need
some server-side logic to handle small things. For example, to handle the data a
user sends from an HTML form, or maybe you need a small API to provide dynamic
data.

For sites requiring front and back, you have great options like
[Fresh](https://fresh.deno.dev/), [Astro](https://astro.build/) or
[Hono](https://hono.dev/). But if you only need a couple of entry points, you
may consider using something simpler like `router` middleware, which is a
minimal router that works great with Lume's server.

```js
import Server from "lume/core/server.ts";
import Router from "lume/middlewares/router.ts";

// Create the router
const router = new Router();

router.get("/hello/:name", ({ name }) => {
  return new Response(`Hello ${name}`);
});

// Create the server:
const server = new Server();

server.use(router.middleware());

server.start();
```

That's all. Now the `/hello/laura` request will return a `Hello laura` response!

The router uses the standard
[URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) under
the hood that creates an object with all variables captured in the path and
passes it as the first argument of the route handler.

In addition to the captured variables, you have the `request` property with the
Request instance:

```js
router.get("/search", ({ request }) => {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("query");
  return new Response(`Searching by ${query}`);
});
```

Note that to use this middleware in production, you need a hosting service
running Deno like [Deno Deploy](https://deno.com/deploy) or similar.

## New `plaintext` plugin

Sometimes you have your content in Markdown or HTML, but also need a plain text
version. Let's see the following example:

```vto
---
title: Welcome to **my site**
---
<!doctype html>
<html>
  <head>
    <title>{{ title }}</title>
  </head>

  <body>
    <h1>{{ title |> md(true) }}</h1>
  </body>
</html>
```

The `title` variable uses Markdown syntax to render
`Welcome to <strong>my site</strong>`. But this also affects the `<title>`
element of the page which contains the asterisks.

The new `plaintext` plugin registers the `plaintext` filter, that not only
removes any Markdown and HTML syntax but also linebreaks and extra spaces:

```vto
---
title: Welcome to **my site**
---
<!doctype html>
<html>
  <head>
    <title>{{ title |> plaintext }}</title>
  </head>

  <body>
    <h1>{{ title |> md(true) }}</h1>
  </body>
</html>
```

The plugin is disabled by default so you need to import it to your _config.ts
file:

```js
import lume from "lume/mod.ts";
import plaintext from "lume/plugins/plaintext.ts";

const site = lume();
site.use(plaintext());

export default site;
```

More info in the
[plugin documentation page](https://lume.land/plugins/plaintext/).

## Better control of the generated CSS code

Some plugins like [`google_fonts`](https://lume.land/plugins/google_fonts/),
[`prism`](https://lume.land/plugins/prism/) or
[`code_highlight`](https://lume.land/plugins/code_highlight/) can generate CSS
code. The way this code is generated is different for each plugin.

Google Fonts plugin has the `cssFile` option to configure the filename to output
the CSS code. If the css file doesn't exist, it's created. If it already exists,
the code is appended at the end. You can use the `placeholder` option to insert
the code at some point in the middle of the file.

```js
site.use(googleFonts({
  cssFile: "styles.css",
  placeholder: "/* insert-google-fonts-here */",
  // ...more options
}));
```

Prism and Code Highlight plugins output the theme's CSS code differently. The
`theme` option has the `path` property but it's not the **output** css file but
the **source file**:

```js
site.use(prism({
  theme: {
    name: "funky",
    path: "/_includes/css/code_theme.css",
  },
}));
```

This means that if you set the path as `/_includes/css/code_theme.css`, this
file must be imported somewhere in your CSS code in order to be visible:

```css
@import "css/code_theme.css";
```

The problem with this approach is it requires two steps: first, configure the
source file name in the plugin, and then import the file in your CSS file (or
copy it with `site.copy()`).

The Google fonts approach is more straightforward.

In order to make Lume more consistent across all plugins, I want to unify the
way the CSS code is generated everywhere. That's why the `theme.path` option of
Prism and Code Highlight plugins are now deprecated and the new `theme.cssFile`
and `theme.placeholder` options were added.

```js
site.use(prism({
  theme: {
    name: "funky",
    cssFile: "styles.css",
    placeholder: "/* prism-theme-here */",
  },
}));
```

This change is also aligned with the
[`components.placeholder` option](https://lume.land/docs/configuration/config-file/#components-options)
introduced in Lume 2.4.

## Other changes

- Added `subset` options to
  [Google fonts](https://lume.land/plugins/google_fonts/) plugin.
- Added `ui.globalVariable` option to
  [Pagefind](https://lume.land/plugins/pagefind/) plugin to store the pagefind
  instance in a global variable for future manipulation.
- Hot reload inline script includes the integrity hash, to avoid CSP issues.
- Files with extension `.d.ts` are ignored by Lume, to avoid generating empty
  files.
- Updated the default browser versions supported by
  [LightningCSS](https://lume.land/plugins/lightningcss/) plugin.

See
[the CHANGELOG.md file](https://github.com/lumeland/lume/blob/v2.5.0/CHANGELOG.md)
to see a list of all changes with more detail.
