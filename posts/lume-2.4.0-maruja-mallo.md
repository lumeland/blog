---
title: Lume 2.4.0 - Maruja Mallo
draft: false
tags:
  - Releases
comments: {}
date: '2024-11-06T00:00:00.000Z'
---

Ola 👋!

This new version of Lume is dedicated to
[Maruja Mallo,](https://en.wikipedia.org/wiki/Maruja_Mallo) an extraordinary
surrealist painter born in Galicia in 1902 who gained international fame.
[Learn more about Maruja](https://edspace.american.edu/marujamalloheadsofwomen/maruja-mallo-biography/).

<!-- more -->

## New plugin: `check_urls`

Broken links are one of the biggest issues on the Web. A recent study detected
that
[27.6% of the top 10 million sites are dead](https://medium.com/@tonywangcn/27-6-of-the-top-10-million-sites-are-dead-6bc7805efa85).
And for those sites that are still alive, they are likely to change the URLs at
some point, after a redesign or content updates, causing a lot of broken links.

The new plugin `check_urls` will help you to keep your links healthy, by
checking all links in your website (not only to HTML pages but also files like
images, JavaScript or CSS). This plugin already existed for some time as
[experimental plugin](https://github.com/lumeland/experimental-plugins) thanks
to [iacore](https://github.com/iacore), but it was moved to the main Lume repo
and was improved with additional features.

The basic way to use it is like any other plugin. No big surprises here!

```js
import lume from "lume/mod.ts";
import checkUrls from "lume/plugins/check_urls.ts";

const site = lume();
site.use(checkUrls());

export default site;
```

The default configuration will check all your internal links and warns you when
a broken link is found. This plugin is compatible with
[redirects](https://lume.land/plugins/redirects/): when a link to a non-existing
page is found, but it redirects to an existing page, the url is valid.

### Strict mode

There's a mode for a more _strict_ detection:

```js
site.use(checkUrls({
  strict: true,
}));
```

In the _strict_ mode the **redirects are not allowed,** all links must go to the
final page. This also affects to the trailing slashes: for example `/about-me`
is invalid but `/about-me/` is valid.

### External URLs

By default, the plugin only checks internal links. But you can configure it to
check links to external domains:

```js
site.use(checkUrls({
  external: true,
}));
```

> [!warning]
>
> This option can make the build slower, specially if you have many external
> links, so probably it's a good idea to enable it only occasionally.

Learn more about this plugin
[in the documentation page](https://lume.land/plugins/check_urls/).

## New plugin: `icons`

Nowadays, most websites are using icons to a greater or lesser extent. The
`icons` plugin allows to use some of the most popular SVG icon libraries. The
installation can't be easier:

```js
import lume from "lume/mod.ts";
import icons from "lume/plugins/icons.ts";

const site = lume();
site.use(icons());

export default site;
```

To import an icon, just use the `icon` filter which returns the path of the
icon's svg file.

```html
<img src="{{ "acorn" |> icon("phosphor") }}">
```

Lume will download the "acorn" icon from the popular
[Phosphor](https://phosphoricons.com/) library into `/icons/phosphor/acorn.svg`
(the output folder is configurable) and return the path.

Some icons have different variations that you can configure with the
`name:variation` syntax:

```html
<img src="{{ "acorn:duotone" |> icon("phosphor") }}">
```

Alternatively, you can set the variation in the second argument of the filter:

```html
<img src="{{ "acorn" |> icon("phosphor", "duotone") }}">
```

You can use [`inline` plugin](https://lume.land/plugins/inline/) to inline the
SVG code in the HTML.

```html
<img src="{{ "acorn" |> icon("phosphor") }}" inline>
```

The icon plugin supports the following icon collections and it's easily
extensible with more.

- [Ant](https://ant.design/components/icon)
- [Bootstrap](https://icons.getbootstrap.com/)
- [Boxicons](https://boxicons.com/)
- [Fluent](https://react.fluentui.dev/?path=/docs/icons-catalog--docs)
- [Heroicons](https://heroicons.com/)
- [Iconoir](https://iconoir.com/)
- [Lucide](https://lucide.dev/)
- [Material Icons](https://fonts.google.com/icons?icon.set=Material+Icons)
- [Material Symbols](https://fonts.google.com/icons?icon.set=Material+Symbols)
- [Mingcute](https://www.mingcute.com/)
- [Myna](https://mynaui.com/icons)
- [Octicons](https://primer.style/foundations/icons)
- [Openmoji](https://openmoji.org/)
- [Phosphor](https://phosphoricons.com/)
- [Remix icons](https://remixicon.com/)
- [Sargam](https://sargamicons.com/)
- [Simpleicons](https://simpleicons.org/)
- [Tabler](https://tabler.io/icons)

Learn more about this plugin
[in the documentation page](https://lume.land/plugins/icons/).

## New plugin `google_fonts`

Another common asset used to build sites is webfonts.
[Google Fonts](https://fonts.google.com/) is a fantastic resource for open
source fonts, but loading the fonts from the Google Fonts CDN is not the best
option, not only for privacy and GDPR compliance, but also
[for performance](https://github.com/HTTPArchive/almanac.httparchive.org/pull/607).

The `google_fonts` plugin downloads the optimized font files from Google fonts
automatically into the `/fonts` directory (configurable) and generates the
`/fonts.css` file (also configurable) with the `@font-face` declarations.

To use it, just register the plugin passing the sharing URL of your font
selection. For example, let's say we want to use
[Playfair Display](https://fonts.google.com/share?selection.family=Playfair+Display:ital,wght@0,400..900;1,400..900):

```js
import lume from "lume/mod.ts";
import googleFonts from "lume/plugins/google_fonts.ts";

const site = lume();

site.use(googleFonts({
  fonts:
    "https://fonts.google.com/share?selection.family=Playfair+Display:ital,wght@0,400..900;1,400..900",
}));

export default site;
```

It's possible to rename the fonts, useful if you want to change a font without
changing the code:

```js
site.use(googleFonts({
  fonts: {
    display: "https://fonts.google.com/share?selection.family=Playfair+Display:ital,wght@0,400..900;1,400..900",
    text: "https://fonts.google.com/share?selection.family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900"
}));
```

In the example above, the **Playfair Display** font is renamed to "display" and
**Roboto** to "text", so this allows the use of the fonts in the CSS code with
these names:

```css
h1 {
  font-family: display;
}
body {
  font-family: text;
}
```

[Go to the documentation page](https://lume.land/plugins/google_fonts/) to learn
more about the Google Fonts plugin!

## New plugins `brotli` and `gzip`

Thanks to [Into the V0id](https://github.com/into-the-v0id) for adding these two
plugins to Lume. They are useful for compressing text-based files (like HTML,
JavaScript, SVG, or CSS files) using the Gzip and Brotli algorithms and output
files with the same name but with `.gz` or `.br` extensions. For example, in
addition to the `/index.html` page, the plugins generate also `/index.html.gz`
(for Gzip) and `/index.html.br` (for Brotli).

I think it's not necessary to show how to activate the plugin, but just to
demonstrate how predictable and "boring" Lume is:

```js
import lume from "lume/mod.ts";
import brotli from "lume/plugins/brotli.ts";

const site = lume();

site.use(brotli());

export default site;
```

### New `precompress` middleware

`brotli` and `gzip` plugins can be combined with
[the new `precompress` middleware](https://lume.land/docs/core/server/#precompress)
if you're using [Lume server](https://lume.land/docs/core/server/) to serve your
static files (for example in Deno Deploy). This middleware checks the
`Accept-Encoding` header and if the browser accepts `br` or `gzip` values, it
will serve the precompressed file.

```js
import Server from "lume/core/server.ts";
import precompress from "lume/middlewares/precompress.ts";

const server = new Server();

server.use(precompress());

server.start();
```

Learn more about these plugins in the
[brotli](https://lume.land/plugins/brotli/) and
[gzip](https://lume.land/plugins/gzip/) documentation pages.

## `modify_urls` supports CSS files

The [`modify_urls` plugin](https://lume.land/plugins/modify_urls/) now can
search and modify urls in CSS files. This is not important only for this plugin
but also for other plugins that use `modify_urls` under the hood, like
[`base_path`](https://lume.land/plugins/base_path/) and
[`relative_urls`](https://lume.land/plugins/relative_urls/).

### Example with `base_path`

`base_path` is one of Lume's most useful plugins because it adds a prefix to all
absolute URLs of your site. This is important if your site is hosted in a
subdirectory.

For example, let's say you want to host your blog in the location
`https://my-site.com/blog/` and you have this HTML code:

```html
<a href="/posts/hello-world/">Hello world</a>
```

The plugin automatically fixes the URL to add the `/blog/` prefix:

```html
<a href="/blog/posts/hello-world/">Hello world</a>
```

Until now, the plugin only transformed URLs in HTML pages. If your site has this
CSS code:

```css
.background {
  background-image: url("/img/bg.png");
}
```

The background image will fail because the `/blog/` prefix is missing. As of
Lume 2.4.0, this plugin can transform also CSS files. This option is disabled by
default, it requires to configure it in the _config.ts file:

```js
site.use(basePath({
  extensions: [".html", ".css"],
}));
```

Now not only HTML pages but also CSS files will be processed:

```css
.background {
  background-image: url("/blog/img/bg.png");
}
```

> [!important]
>
> Keep in mind that Lume only processes files that are loaded. To transform CSS
> files they must be loaded before. If you're using any styling plugin like
> [`postcss`](https://lume.land/plugins/postcss/),
> [`lightningcss`](https://lume.land/plugins/lightningcss/), or
> [`sass`](https://lume.land/plugins/sass/), you don't need to do anything else.
> But if you are copying the css files with `site.copy([".css"])` or
> `site.copy("/styles")` they won't be processed. To fix it, you have to use
> `site.loadAssets([".css"])`.

## Fallbacks for `metas` and `feed` plugins

Some plugins like `metas` and `feed` allow to
[define aliases](https://lume.land/plugins/metas/#field-aliases) to other
variables. For example, if we want to use the variable `title` inside
`metas.title`:

```yml
title: Page title
metas:
  title: =title
```

As of Lume 1.4, it's possible to define fallbacks to other variables or provide
a default variable:

```yml
metas:
  title: =title || =header.title || Default title
```

In this example, the title used in metas is the `title` variable. If it's not
defined, the `header.title` variable is used. And if it's doesn't exist, the
string "Default title" will be used.

## Support for author in `feed` plugin

In addition to fallbacks, the [`feed` plugin](https://lume.land/plugins/feed/)
has added support for the author name and author URL variables:

```js
site.use(feed({
  output: ["/posts.rss", "/posts.json"],
  query: "type=post",
  info: {
    title: "=site.title",
    description: "=site.description",
    authorName: "=site.author.name",
    authorUrl: "=site.author.url",
  },
  items: {
    title: "=title",
    description: "=excerpt",
    authorName: "=author.name",
    authorUrl: "=author.url",
  },
}));
```

## Other changes

- Several improvements to [`esbuild` plugin](https://lume.land/plugins/esbuild/)
  by [Into the V0id](https://github.com/into-the-v0id).
- Added the new variable `fediverse` to the
  [`metas` plugin](https://lume.land/plugins/metas/), to generate the
  `<meta name="fediverse:creator" content="...">` tag
  [added to Mastodon](https://blog.joinmastodon.org/2024/07/highlighting-journalism-on-mastodon/).
- Fixed some bugs related to Windows support and CJK characters.
- New option `placeholder` in the
  [`unocss` plugin](https://lume.land/plugins/unocss/) to insert the generated
  code in a specific place.
- New option `placeholder` in the
  [components configuration](https://lume.land/docs/core/components/) to insert
  the generated CSS and JavaScript code in a specific place.
- Updated all dependencies to their latest version.

And more changes. See the
[CHANGELOG file](https://github.com/lumeland/lume/blob/v2.4.0/CHANGELOG.md) for
more details.

**Happy Luming!**
