---
title: Lume 1.13.0 is out
tags:
  - releases
author: Óscar Otero
date: 2022-11-14
---

I'm happy to announce that Lume `1.13.0` was released with some interesting
additions and changes. Let's see the highlights.

<!-- More -->

## MDX support

[MDX](https://mdxjs.com/) support for Lume was requested for a long time. Now
that Deno can handle `npm` imports, it's more easy to bring support for this
library. The new `mdx` plugin allows to create your pages in `.mdx`, so you can
combine markdown and JSX components in a single file.

To enable MDX in your site, you only need to import the `mdx` plugin and any of
the `jsx` plugins available (depending on whether you want to use React or
Preact). This is an example with React:

```js
import lume from "lume/mod.ts";
import jsx from "lume/plugins/jsx.ts";
import mdx from "lume/plugins/mdx.ts";

const site = lume();

site.use(jsx());
site.use(mdx());

export default site;
```

Now you can create `.mdx` files that imports JSX components or use the Lume's
components from the global `comp` variable:

```md
---
title: Hello world
description: This is a description
---

import Image from "./_includes/Image.tsx";

<comp.Header title={title} description={description}/>

## Hello world

This is a markdown file with the title **{ title }**.

<Image alt="foo" />
```

### About Lume string based components

MDX is designed to work with JSX components. If you use a plugin that returns
the HTML code as string it will be escaped. To avoid that, you have to use the
`dangerouslySetInnerHTML` attribute.

For example, let's say you have nunjucks component to render a title:

```liquid
<h1>{{ text }}</h1>
```

A way to use it in a mdx file is:

```md
<div dangerouslySetInnerHTML={{ __html: comp.title({ text: "Hello world" }) }} />
```

Or using a wrapper for a bit more friendly code:

```md
export const Raw = ({ children }) => <div dangerouslySetInnerHTML={{ __html:
children }} />

<Raw>{ comp.title({ text: "Hello world" }) }</Raw>
```

## New `sitemap` plugin

The `sitemap` plugin was created by [Jrson](https://github.com/jrson83) some
time ago in the
[experimental plugins repo](https://github.com/lumeland/experimental-plugins).
It creates a `sitemap.xml` file for SEO purposes and a `robots.txt` file with a
link to the sitemap file.

Now you can import it like any other Lume official plugin:

```js
import lume from "lume/mod.ts";
import sitemap from "lume/plugins/sitemap.ts";

const site = lume();

site.use(sitemap());

export default site;
```

## Deprecated `page.dest` and `page.updateDest`

Pages in Lume have the properties `src`, with info about the source file and
`dest` with info about the destination file.

The destination is calculated according to the `page.data.url` value (if
defined) or the source file name. More info
[in the Lume docs](https://lume.land/docs/creating-pages/page-files/).

The problem is the URL can be modified by preprocessors and processors after the
destination is calculated. For example, a SASS plugin that modifies the
extension of the files from `.scss` to `.css`:

```js
// Extremely simplified code:
site.process([".scss"], (page) => {
  page.content = processSASS(page.content);
  page.data.url = page.data.url.replace(/\.scss$/, ".css");
});
```

Because the `page.dest` value wasn't changed, it still has the old value so the
file will be saved with the `.scss` extension. To prevent this issue, there's
the `page.updateDest` function that changes the `page.dest` and `page.data.url`
values accordingly, ensuring both properties are consistent:

```js
// Extremely simplified code:
site.process([".scss"], (page) => {
  page.content = processSASS(page.content);
  page.updateDest({ ext: ".css" });
});
```

I never felt confortable with this, because it's duplicating the same value in
two different places. Originally it has been created in this way because they
have different purposes and they can have different values (like a page with the
url `/about-us/` but the destination file is `/about-us/index.html`).

In Lume 1.13.0 the `page.dest` and `page.updateDest` are deprecated (and
probably removed in 1.14.0). Now you only have to change the value in one place
(`page.data.url`) and the destination path is calculated just before it's saved.
More simple and intuitive.

## New `slug` value

Now all pages have the `slug` value (it's calculated if it doesn't exist). If
defined, it's used to change the last part of the file URL. Take for example, a
post file in the `/posts` folder with this data:

```md
---
title: Post title
slug: post-title
---

Hello world
```

Because the post has a `slug` defined, the URL of this post will be
`/posts/post-title/` no matter the file name of the source file.

The slug provides also a convenient way to select a page by slug. For example
`search.page("type=post slug=post-title")`. Keep in mind that slugs are not
required to be unique values.

If the `slug` is missing, it will be calculated according to the filename, so
all pages will have this value defined, no matter if they are manually defined
or not.

## New option `returnPageData` to `search` helper

The global helper `search.pages()` returns an array of pages. But in most cases
you don't need the page instance, only its data. The new `returnPageData` option
allows to change this behavior to return only the `page.data` object. This will
be the default behavior in Lume 2.0, but for compatibility it's disabled by
default. See
[more info in this issue](https://github.com/lumeland/lume/issues/251).

To enable it, just configure the plugin in the `_config.ts` file.

```js
import lume from "lume/mod.ts";

const search = { returnPageData: true };

const site = lume({}, { search });

export default site;
```

Once configured, the following code:

```liquid
{% for article in search.pages("type=article", "date=desc") %} 
<a href="{{ article.data.url }}">
  <h1>{{ article.data.title }}</h1>
</a>
{% endfor %}
```

must be changed to:

```liquid
{% for article in search.pages("type=article", "date=desc") %} 
<a href="{{ article.url }}">
  <h1>{{ article.title }}</h1>
</a>
{% endfor %}
```

## Removed `no-html-extension` option for prettyUrls

Pretty URLs configuration allowed the `no-html-extension` value. It exports the
page as regular html (like `/article.html`) but the url of these pages are
`/article` (without extension). You can see more info
[in this issue](https://github.com/lumeland/lume/issues/193).

This option was removed in Lume 1.13.0 because it's not needed. If you want this
functionality, just use the `modify_urls` plugin to remove the extension to the
HTML links:

```js
import lume from "lume/mod.ts";
import modifyUrls from "lume/plugins/modify_urls.ts";

const site = lume();

site.use(modifyUrls({
  fn: (url) => url.replace(/\.html$/, ""),
}));

export default site;
```

There are more changes. See the
[CHANGELOG.md file](https://github.com/lumeland/lume/blob/v1.13.0/CHANGELOG.md)
to see all.
