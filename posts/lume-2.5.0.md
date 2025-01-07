---
title: 'Lume 2.5.0'
draft: true
tags:
  - Releases
comments: {}
---

Ola 👋!

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

## New plugin `purgecss`

[PurgeCSS](https://purgecss.com/) is a utility to remove unused CSS code, making
your CSS files smaller and improving the site performance. The tool provides a
Postcss plugin so, in theory it can also be used in Lume. Now it has its own
plugin (big thanks to [_into-the-v0id_](https://github.com/into-the-v0id)) which
has some advantages:

- Scan generated HTML pages by Lume
- Scan bundled JS dependencies (bootstrap, etc)
- Only include CSS that is actually necessary (don't include drafts or
  conditional HTML that does not make it into the build)

```js
import lume from "lume/mod.ts";
import purgecss from "lume/plugins/purgecss.ts";

const site = lume();
site.use(purgecss());

export default site;
```

## New `router` middleware

Lume is a static site generator (and always will be). But sometimes you need
some server side logic to handle small things. For example, to handle the data
sent by a user from an HTML form, or maybe you need a small API to provide
dynamic data.

For sites requiring front and back, you have great options like
[Fresh](https://fresh.deno.dev/) or [Hono](https://hono.dev/). Buf if you only
need a couple of entry points, you may consider using something simpler like
`router` middleware, which is a minimal router that works great with the Lume's
server class.

```js
import Server from "lume/core/server.ts";
import Router from "lume/middlewares/router.ts";

// Create the router
const router = new Router();

router.get("/hello/:name", { name }) => {
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
the hood, creates an object with all variables captured in the path, and pass it
as the first argument of the route handler.

In addition to the captured variables, you have the `request` property with the
Request instance:

```js
router.get("/search", { request }) => {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("query");
  return new Response(`Searching by ${query}`);
});
```

Note that to use this middleware in production, you need a hosting service
running Deno like [Deno Deploy](https://deno.com/deploy) or similar.

## Better control of the generated CSS code

Some plugins like [`google_fonts`](https://lume.land/plugins/google_fonts/),
[`prism`](https://lume.land/plugins/prism/) or
[`code_highlight`](https://lume.land/plugins/code_highlight/) can generate CSS
code. The way this code is generated is different for each plugin.

Google fonts plugin has the `cssFile` option to configure the filename to output
the CSS code. If the css file doesn't exist, it's created. And if it already
exists, the code is appended at the end. You can use the `placeholder` option to
insert the code at some point in the middle of the file.

```js
site.use(googleFonts({
  cssFile: "styles.css",
  placeholder: "/* insert-google-fonts-here */",
  // ...more options
}));
```

Prism and Code Highlight plugins output the theme's CSS code in a different way.
The `theme` option has the `path` property but it's not the **output** css file
but the **source file**:

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

The Google fonts approach is simpler and more straightforward.

In order to make Lume more consistent across all plugins, I want to unify the
way the CSS code is generated everywhere. That's why the `theme.path` option of
Prism and Code Highlight plugins is now deprecated and the new `theme.cssFile`
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
- Hot reload inline script includes the integrity hash, to avoid some CSP
  issues.
- Files with extension `.d.ts` are ignored by Lume, to avoid generating empty
  files.
- Updated the default browser versions supported by
  [LightningCSS](https://lume.land/plugins/lightningcss/) plugin.

And several fixes. See the CHANGELOG.md file for more details.
