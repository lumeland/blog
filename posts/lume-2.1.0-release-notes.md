---
title: Lume 2.1.0 release notes
date: '2024-02-21'
author: Óscar Otero
draft: false
tags:
  - Releases
comments:
  src: 'https://fosstodon.org/@lume/111976763965094939'
---

The first minor version of Lume 2 has been released, which brings many new
features like a CMS, some new plugins, improvements, and bug fixes.

<!--more -->

## LumeCMS

Yes, Lume has a built-in CMS to help you (or your customers) edit the website
easily. You can read the [announcement post](/posts/lume-cms/) for more details
about how it works.

LumeCMS is a simple and framework-agnostic CMS that you can use for any kind of
website. Lume 2.1.0 has a built-in integration to connect your website with the
CMS and make content updates easier for non-technical people. The CMS is still
in the early phases and will be improved with time, but it's pretty usable right
now.

To configure a cms, just create a `_cms.ts` file with some configuration like
the storage method, documents, and collections that you want to edit. For
example:

```js
import lumeCMS from "lume/cms.ts";

const cms = lumeCMS({
  site: {
    name: "My awesome blog",
    url: "https://example.com",
  },
});

cms.document("homepage", "src:index.md", [
  "title: text",
  "description: textarea",
  "content: markdown",
]);

cms.collection("posts", "src:posts/*.md", [
  "title: text",
  "tags: list",
  "content: markdown",
]);

export default cms;
```

Now you can run `deno task lume cms` (or `deno cms` if you're using Lume CLI)
and start editing your content!

See more info at [the documentation section](https://lume.land/cms/) at the Lume
website.

## Redirects plugin

Nobody likes breaking links, they affect the experience of your visitors and SEO
ranking. If you want to change the URL of a page, is highly recommended to
create a redirect from the old URL to the new one.

The new `redirects` plugin makes this task easier: you only have to edit the
page URL and indicate the old URL. The plugin automatically will create the
redirect.

For example, let's say I have this page:

```md
---
url: /about-me/
title: Hello, I'm Óscar
---
```

And I decided to change the url to `/about-oscar/`. The only thing I have to do
is to save the old url in the `oldUrl` variable:

```md
---
url: /about-oscar/
title: Hello, I'm Óscar
oldUrl: /about-me/
---
```

The plugin automatically generates the redirection from `/about-me/` to
`/about-oscar/` using one of the available output methods:

- Generate a page `/about-me/` with the tag
  `<meta http-equiv="refresh" content="0; url="/about-oscar/">`. (The default
  output).
- Generate a JSON file with all redirects, that you can use with the
  [`redirects` middleware](https://lume.land/docs/core/server/#redirects)
  (useful if you host your site on Deno Deploy)
- Generate or update the `_redirects` file, compatible with Netlify.
- Generate or update the `vercel.json` file, compatible with Vercel.

For example, if your site is hosted on Netlify:

```js
site.use(redirects({
  output: "netlify",
}));
```

More info at
[lume.land/plugins/redirects](https://lume.land/plugins/redirects/).

## Open Graph Images plugin

The new plugin `og_images` allows to generate Open Graph images using
[Satori](https://github.com/vercel/satori), a library to convert JSX code to
SVG. It also saves the URL of the image generated in the `metas.image` variable,
so it works great combined with [Metas](https://lume.land/plugins/metas/)
plugin.

To create an Open Graph image for a page, add the `openGraphLayout` variable
with the URL of the layout that you want to use. For example:

```yml
---
openGraphLayout: layouts/open_graph_image.jsx
---
```

The layout must be a JSX file exporting a HTML compatible with Satori. See the
documentation for a
[complete list of all CSS properties and HTML elements supported](https://github.com/vercel/satori?tab=readme-ov-file#documentation).

```jsx
/** @jsxImportSource npm:react@18.2.0 */

export default function ({ title, description }) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        fontSize: 32,
        fontWeight: 600,
      }}
    >
      <svg
        width="75"
        viewBox="0 0 75 65"
        fill="#000"
        style={{ margin: "0 75px" }}
      >
        <path d="M37.59.25l36.95 64H.64l36.95-64z"></path>
      </svg>
      <div style={{ marginTop: 40 }}>{title}</div>
      <div>{description}</div>
    </div>
  );
}
```

More info at
[lume.land/plugins/og_images](https://lume.land/plugins/og_images/).

## FFF plugin

[FFF](https://fff.js.org/) is a front matter specification designed to be
framework-agnostic, so you can reuse your data with a different static site
generators, like Hexo, Hugo, or Lume.

This plugin can convert the page data to follow the FFF standard, useful if you
use this standard with any other SSG and want to migrate to Lume (or vice
versa).

More info at [lume.land/plugins/fff](https://lume.land/plugins/fff/).

## Robots plugin

A simple plugin to create the `robots.txt` file. You can configure which agents
you allow to scrap your site and which do not. For example, if you only want to
allow Google and Bing search engines:

```js
site.use(robots({
  allow: ["Googlebot", "Bingbot"], // Allow Google and Bing bots
  disallow: "*", // Disallow everything else
}));
```

The plugin provides options for more advanced configuration. See more info at
[lume.land/plugins/robots](https://lume.land/plugins/robots/).

## Other changes

- The plugins **multilanguage** and **sitemap** supports `x-default` urls.
- Improved **favicon** plugin to use the SVG favicon in all browsers supporting
  it.
- The **transform_images** plugin doesn't enlarge the images if the new size is
  bigger than the original size.
- Upgrade `date-fns` to version 3. If you're using the **date** plugin, you will
  have to change the way to import the languages:
  ```js
  // Old
  import gl from "npm:date-fns/locale/gl";

  // New
  import { gl } from "npm:date-fns/locale/gl";
  ```
- The default behavior of the **slugify_urls** plugin has changed. As of Lume
  2.1, only the HTML pages are slugified. Use the `extensions` option to change
  this.

And there are many more changes that you can see in the
[CHANGELOG file.](https://github.com/lumeland/lume/blob/v2.1.0/CHANGELOG.md)
