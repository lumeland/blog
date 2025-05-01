---
title: Lume 3 was released
author: Óscar Otero
draft: true
tags:
  - Releases
comments: {}
---

After launching Lume 2 almost a year and a half ago, a new major version of Lume
is here!

This version is dedicated to all Galician _cantareiras_ and
_pandereteiras_—women who sing and play the tambourine (or _pandeireta_), one of
the most important instruments in Galician traditional music. Thanks to the
_recollidas_, where musicians and musicologists recorded these traditional songs
sung by anonymous women, we can now enjoy this musical heritage performed by
contemporary musicians with innovative arrangements.

Some examples include
[Xabier Díaz & Adufeiras de Salitre](https://www.youtube.com/watch?v=CwjZd5ak7xA),
[Xosé Lois Romero & Aliboria](https://www.youtube.com/watch?v=Ge9Uu8SeGDE), and
[Berrogüetto](https://www.youtube.com/watch?v=czMGYX0C2zE).

For more disruptive artists, check out
[Tanxugueiras](https://www.youtube.com/watch?v=qjCeKRoGS8s) or
[Baiuca](https://www.youtube.com/watch?v=9ZM0kou3BPQ).

<!-- more -->

> [!note]
>
> **TL/DR:** There's
> [a step-by-step guide to migrate to Lume 3](https://lume.land/docs/advanced/migrate-to-lume3/)
> in the documentation. And the documentation for Lume 2 is still visible at
> [v2.lume.land](https://v2.lume.land/).

To many developers, including myself, breaking changes can be frustrating.
Software updates that force you to revisit a project just to ensure it continues
working as before often feel like a waste of time. This is one of the reasons I
enjoy working with Web APIs—they are stable, reliable, and designed to just work
[without introducing unnecessary disruptions](https://csswizardry.com/2025/01/build-for-the-web-build-on-the-web-build-with-the-web/).

I strive to bring a similar philosophy to Lume by minimizing breaking changes
whenever possible. In fact, I initially had no plans to release a new major
version of Lume. However, after receiving numerous reports about certain
behaviors and limitations, I realized it was necessary to revisit some design
decisions. This effort aims to finally deliver the simple, intuitive static site
generator I have always envisioned, hoping that Lume 4 won't be necesary in a
long time, or never.

## The main problem

The `site.copy()` function allows you to copy files from the `src` folder
without reading the content, which is faster and consumes less memory. But it
has one big drawback: the files are not processed.

For example, let's say you have the following configuration:

```js
site.copy("/assets");
site.use(postcss());
```

When Lume builds your site, the files inside the `/assets` folder are copied
as-is. If the folder contains CSS files, they **won't be processed by Postcss**.
Learn more about
[this issue on GitHub](https://github.com/lumeland/lume/issues/571).

This behavior is confusing and many people reported this as a bug. And they are
right: Lume should be clever enough to not delegate the decision of whether a
file must be loaded or copied.

## The solution: `site.add()`

In Lume 3, the `site.loadAssets()`, `site.copyRemainingFiles()` and
`site.copy()` functions were removed, and now there is a single function for
everything: `site.add()`.

The `add()` function simply tells Lume that you want to include some files in
your site, but without specifying how this file must be treated. Lume will load
the file if it needs to (for example, if it needs to be processed), or will copy
it if no transformations are needed.

```js
site.add("/assets");
site.use(postcss()); // CSS files in /assets will be processed too!
```

To upgrade from Lume 2 to Lume 3, just replace the `site.loadAssets()`,
`site.copyRemainingFiles()`, and `site.copy()` functions with `site.add()`.

For example:

```js
// Lume 2
site.loadAssets([".css"]);
site.copy("/assets", ".");
site.copyRemainingFiles(
  (path: string) => path.startsWith("/articles/"),
);

// Lume 3
site.add([".css"]);
site.add("/assets", ".");
site.add("/articles");
```

### Copy remote files

`site.add()` can add files from the `src` folder as well as remote files. In
Lume 2, this was possible with the `remoteFile` function:

```js
// Lume 2
site.remoteFile("styles.css", "https://example.com/theme/styles.css");
site.copy("styles.css");
```

Lume 3 makes this use case easier:

```js
// Lume 3
site.add("https://example.com/theme/styles.css", "styles.css");
```

The `site.add()` function also accepts `npm` specifiers:

```js
site.add("npm:normalize.css", "/styles/normalize.css");
```

Internally, this uses jsDelivr to download the file. In this example,
`npm:normalize.css` is transformed to
`https://cdn.jsdelivr.net/npm/normalize.css`. Note that only one file is copied,
not all package files.

> [!note]
>
> `site.remoteFile` is still required in Lume 3 for files not directly exported
> to the dest folder, like `_data`, `_components` or `_includes` files.

## Plugins no longer load files automatically

In Lume 2, some plugins configure Lume to load files with a certain extension
automatically. For example, Postcss not only processes the CSS code but also
configures Lume to load all CSS files:

```js
// All .css files are loaded and processed
site.use(postcss());
```

In some cases, this is what you want. But if you don't want to load all CSS
files, this behavior makes Lume load everything, and you have to use the
`site.ignore()` function or move the unwanted files to a folder starting with
`_`.

In addition to that, this behavior is not fully transparent. You have to read
the documentation to know what the plugin is doing.

In short, this approach causes more harm than good.

In Lume 3, thanks to the `site.add()` function, it's very easy to add new files
(and only the files that you want), so plugins **no longer load files by
default**. You have to explicitly add them, which is more intuitive:

```js
// Lume 2
site.use(postcss());

// Lume 3
site.add([".css"]);
site.use(postcss());
```

Another benefit is you have better control of all entry points of your assets.
For example, for esbuild:

```js
// Lume 3
site.add("main.ts");
site.use(esbuild()); // Only main.ts is bundled
```

This change affects the `svgo`, `transform_images`, `picture`, `postcss`,
`sass`, `tailwindcss`, `unocss`, `esbuild` and `terser` plugins.

## JSX

### One JSX plugin

Lume started supporting `JSX` as a template engine thanks to the `jsx` plugin
that uses React under the hood. Later, the `jsx_preact` plugin was added to use
Preact, a smaller and more performant alternative to React.

Having two JSX plugins for the same purpose is useless and adds unnecessary
complexity (for example, combined with the MDX plugin).

Moreover, both libraries are frontend-first libraries, with features like hooks,
event callbacks, hydration, etc, that are not supported at build time, so some
people were confused about what they can or cannot do in Lume.

Lume 3 has only one JSX plugin, and it doesn't use React or Preact but
[SSX](https://github.com/oscarotero/ssx/), a TypeScript library created
specifically for static sites which is faster than React and Preact
([See Benchmarks](https://github.com/oscarotero/ssx/actions/runs/13022300332/job/36325328553#step:7:22))
and more ergonomic. It allows creating asynchronous components, inserting raw
code like `<!doctype html>`, and comes with great documentation including all
HTML elements and attributes, with links to MDN.

Lume 3 uses `lume/jsx-runtime` import source for all JSX and MDX files. So you
only have to configure the `compilerOptions` setting of `deno.json` as following
(other options have been omited for brevity):

```json
{
  "imports": {
    "lume/jsx-runtime": "https://deno.land/x/ssx@v0.1.8/jsx-runtime.ts"
  },
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "lume"
  }
}
```

This allows to upgrade the library (or even replace it with something else)
easily.

> [!note]
>
> With the `esbuild` plugin you still can use React or Preact in Lume but for
> what they were created for: the frontend.

### `.page` Subextension for JSX and TSX Pages

Lume requires the `.page` subextension for certain file types like `.ts`, `.js`,
or `.json` to distinguish between files used to generate pages and those
intended for browser execution. For instance, `index.page.js` generates the
`index.html` page, while `index.js` is a JavaScript file executed by the
browser.

Starting with Lume 3, the `.page` subextension is also applied to `.jsx` and
`.tsx` files. This change allows the `.jsx` and `.tsx` extensions to be
exclusively used for browser-side code (after processing with the `esbuild`
plugin).

```txt
Lume 2:
- /index.jsx

Lume 3:
- /index.page.jsx
```

If you prefer the Lume 2 behavior (where this differentiation is not required),
you can configure the plugin to remove the `.page` subextension:

```js
site.use(jsx({
  pageSubExtension: "", // Reverts to Lume 2 behavior
}));
```

## Improved Lume components

### Async components

One of the main limitations of Lume 2's components was that they were
synchronous. This was to support JSX components that were synchronous with React
and Preact. With SSX, we don't have this limitation anymore, and all components
are async.

For example, you can create a component in JSX that returns a promise:

```jsx
// _components/salute.jsx

export default async function ({ id }) {
  const response = await fetch(`https://example.com/api?id=${id}`);
  const data = await response.json();
  return <strong>Hello {data.name}</strong>;
}
```

This component can be used in any other template engine, like JSX:

```jsx
export default async function ({ comp }) {
  return (
    <p>
      <comp.Salute id="23" />
    </p>
  );
}
```

Or Vento:

```html
<p>{{ comp.Salute({ id: 23}) }}</p>
```

### Folder components

Lume components not only generate HTML code but can also export the CSS and JS
code needed to run it on the browser. The code must be exported in the variables
`css` and `js`. For example:

```md
---
css: |
  .mainTitle {
    color: red;
  }
---

<h1 class="mainTitle">{{ name }}</h1>
```

The problem with this approach is the CSS and JS code is not treated as CSS and
JS code by your code editor, so there's no syntax highlighting.

In Lume 3, it's possible to create a component in a folder, with the CSS and JS
code in different files. To do that, you use the following structure:

```txt
|_ _components/
    |_ button/
        |_ comp.vto
        |_ style.css
        |_ script.js
```

Any folder containing a `comp.*` file will be loaded as a component using the
folder name as the component name, and the `style.css` and `script.js` files
will be loaded as the CSS and JS code for the component. This makes the creation
of components more ergonomic, especially for cases with a lot of CSS and JS
code.

Additionally, it's possible to add a `script.ts` file instead `script.js` to use
TypeScript. Lume will compile it to JavaScript automatically.

### Better interoperability

In Lume 2 components created with text-based engines, like Vento didn't work
well for JSX templates. For example, let's say we have the following Vento
component:

```vto
<button>{{ content }}</button>
```

and we want to use it in a JSX page:

```jsx
export default function ({ comp }) {
  return <comp.Button>Click here</comp.Button>;
}
```

Due JSX escapes the string values, the output code is this:

```html
&lt;button&gt;Click here&lt;/button&gt;
```

To fix it, we need to create a container element with the
`dangerouslySetInnerHTML` attribute:

```jsx
export default function ({ comp }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: <comp.Button>Click here</comp.Button>,
      }}
    />
  );
}
```

In Lume 3, thanks to SSX this is no longer necessary. Components are fully
interoperable and you can insert JSX components in Vento and viceversa. And to
make them even more interchangeable, the `content` and `children` variables are
equivalent.

```jsx
export default function ({ comp }) {
  return (
    <>
      // This works
      <comp.Button>Click here</comp.Button>

      // This also works
      <comp.Button content="Click here" />
    </>
  );
}
```

### Default data in components

In Lume 3, components can have extra data that will be used as default values.
This data is like layout data but applied to components.

Let's see the following `_components/title.vto` component as an example :

```vto
---
title: Hello world
---

<h1>{{ title }}</h1>
```

Now you can use the component with the default title.

```vto
{{ await comp.title() }}
<!-- <h1>Hello world</h1> -->
```

Or with a custom title

```vto
{{ await comp.title({ title: "New title" }) }}
<!-- <h1>New title</h1>  -->
```

## Global cssFile, jsFile and fontsFolder

As mentioned, Lume components can output CSS and JS code. However, some plugins
output code too. For example, `google_fonts` generates the CSS code needed to
load the fonts, `prism` and `code_highlight` export the CSS code with the
themes, and `katex` (that didn't generate CSS code in Lume 2) now generates the
CSS code automatically so you don't need to copy manually the CSS code.

Additionally, some plugins download also font files (specifically,
`google_fonts` and `katex`).

In Lume 2, you have to configure how to export the generated code for every
plugin individually. In Lume 3 there are three global options that will be used
by default by all plugins and components:

```js
const site = lume({
  cssFile: "/style.css", // default value
  jsFile: "/script.js", // default value
  fontsFolder: "/fonts", // default value
});
```

All extra code generated by components and the plugins `code_highlight`,
`google_fonts`, `prism`, `katex` and `unocss` will be stored there.

Of course, you can still change the code destination for a specific plugin:

```js
site.use(unocss({
  cssFile: "/unocss-styles.css",
}));
```

## Tailwind 4

The `tailwindcss` plugin was upgraded to use
[Tailwind 4](https://tailwindcss.com/blog/tailwindcss-v4). The new version is
faster than v3 and no longer needs Postcss to work. There are many changes in
the configuration (especially the CSS-first configuration) so take a look at the
[upgrade guide](https://tailwindcss.com/docs/upgrade-guide) if you want to
upgrade your projects from v3 to v4.

```js
// Lume 2
site.use(tailwindcss());
site.use(postcss());

// Lume 3
site.use(tailwindcss());
site.add("style.css");
```

If you don't want to upgrade to v4, it's still possible to continue using
Tailwind 3 with the postcss plugin:

```js
import tailwind from "npm:tailwindcss@^3.4";

site.use(
  postcss({
    plugins: [tailwind()],
  }),
);
```

## Processors improvements

`site.process()` and `site.preprocess()` are among Lume's most used features.
Lume 3 brings some improvements here to make them easier to use.

### `page.document` no longer returns undefined

One of the many uses of processors is to manipulate HTML pages using the
`page.document` property. But this property can return `undefined` if the page
is not HTML or cannot be parsed, so you have to check the variable type before
using it:

```js
site.process([".html"], (pages) => {
  for (const page of pages) {
    const document = page.document;
    if (!document) {
      continue;
    }
    const title = document.querySelector("title");
  }
});
```

In Lume 3, `page.document` always returns a `Document` instance or throws an
exception if the page cannot be parsed. This allows us to omit the type check:

```js
site.process([".html"], (pages) => {
  for (const page of pages) {
    const title = page.document.querySelector("title");
  }
});
```

### New page properties

The `page.content` variable containing the content of the page can be a string
or a `Uint8Array`, depending on how this page has been loaded. For example,
HTML, CSS or JS pages have the content as a string, but images or other binary
files are loaded as `Uint8Array`.

To process these files in Lume 2 you have to check the content type:

```js
site.process([".css"], (pages) => {
  for (const page of pages) {
    const content = page.content;

    if (typeof content === "string") {
      page.content = "/* © 2025 */" + content;
    }
  }
});
```

In Lume 3, pages have two new properties: `page.text` and `page.bytes` (inspired
by the same properties of the
[Request](https://developer.mozilla.org/en-US/docs/Web/API/Request#instance_methods)
object). As you may guess, `page.text` allows to work with the page content as
strings, making the conversions automatic, and `page.bytes` does the same but
for `Uint8Array`.

```js
site.process([".css"], (pages) => {
  for (const page of pages) {
    page.text = "/* © 2025 */" + page.text;
  }
});
```

### Omit `*` wildcard

In Lume 2, the `*` wildcard allows you to process all pages:

```js
site.process("*", (pages) => {
  // Process all pages
});
```

In Lume 3, the first argument can be omitted:

```js
site.process((pages) => {
  // Process all pages
});
```

## The order of some plugins is now more important

In Lume 2, the order in which some plugins are registered doesn't matter. Let's
see this example from the `sitemap` plugin:

```js
site.use(sitemap()); // Generate the sitemap file
site.use(basePath()); // Add the base path to all URLs
```

The sitemap plugin is registered before basePath, so you may think the sitemap
file is generated before adding the base path prefix to all URLs. But
internally, the sitemap plugin is executed using the "beforeSave" event, which
is triggered at the end, just before saving all files to the _site folder. So
internally the basePath plugin is executed before.

This was designed so you don't have to think about the order of the plugins when
using them. But this behavior has two problems:

- There are many plugins in which the order matters. For example, if you combine
  SASS and Postcss you have to process the SCSS files first and pass the result
  to Postcss. This inconsistency makes you wonder in which plugins the order is
  important or not.
- It's not possible to use a processor to modify the output of these plugins.
  For example, if you want to compress the sitemap file with brotli or gzip, is
  not possible because the sitemap will be always generated at the end.

To make Lume more transparent and intuitive, many plugins using events were
changed to use processors, which respect the order in which they are registered
in the _config.ts file.

The affected plugins are: `code_highlight`, `decap_cms`, `favicon`, `feed`,
`google_fonts`, `icons`, `prism`, `robots`, `sitemap`, and `slugify_urls`.

## esbuild uses `esbuild-deno-loader` to resolve dependencies

Deno is becoming a complicated runtime, especially for everything related to
module resolution. It supports three completely different types of packages
(HTTP, NPM, and JSR), with different behaviors, inconsistencies, and
incompatibilities between them. In addition to the usual complexity of NPM, in
Deno a package can be located in different places, depending on the variable
`nodeModulesDir`, if the file `package.json` is found, if the `node_modules`
folder exists, etc. JSR is not much better, because the resolution of a package
depends on the combination of `imports`, `exports`, and `patch` keys in
different `deno.json` and `deno.jsonc` files. And the addition of workspaces
adds a new layer of complexity.

In Lume 2, the `esbuild` plugin delegates all this complexity to
[esm.sh](https://esm.sh/), which transforms any NPM or JSR package to simple
HTTP imports that are easier to manage. But this solution has its problems with
multiple configuration options (`deps`, `pin`, `alias`, `standalone`, `exports`,
etc) and there are many packages that don't work well after passing them through
esm.sh.

In Lume 3 the `esbuild` plugin uses the
[esbuild-deno-loader](https://jsr.io/@luca/esbuild-deno-loader) plugin created
by Luca Casonato, a member of the Deno team. This will make your bundled code
more reliable and compatible with how Deno works.

## `basename` improvements

In Lume 2, the `basename` variable allows changing the name of a file or
directory. When missing, it's automatically defined by Lume using the page
filename. For example, the page `/posts/first-post.md` has the basename
`first-post`.

In Lume 3 this variable uses the final URL of the page, instead of the source
filename. For example, if the `/post/first-post.md` page generates a different
URL (say `/post/other-name/`) the `basename` is `other-name`.

Additionally, the basename no longer accepts "index" as a value. For example,
the basename for the `/post/hello-world/index.md` is `hello-world` (the folder
name) instead of `index` (the filename).

These changes will make this variable more consistent across all pages, no
matter how the URL is generated. It's especially important for the `nav` plugin
that uses this variable to sort pages alphabetically.

Another interesting use case for `basename` is the ability to generate pages
with the basename instead of returning the complete URL, which is now possible
in Lume 3. Let's see an example:

```ts
// /items.page.ts

export default function* () {
  const items = ["computer", "mug", "spoon"];

  for (const item of items) {
    yield {
      content: `Content for ${item}`,
      basename: item,
    };
  }
}
```

This function generates a page per item. Instead of returning an object with the
`url` property, it returns the `basename` so it's appended to the URL of the
generator (`/items/computer/`, `/items/mug/`, `/items/spoon/`).

## Date detection from filepath is disabled by default

Lume 2 detects automatically the `date` value from the files and folders paths
and remove it. For example, the file `/posts/2020-06-21_hello-world.md` outputs
the page `/posts/hello-world/` (without the date).

Some people don't want this behavior and prefer to keep the date in the output
URL. Following the Lume's philosophy of having a light core and provide extra
features through plugins, this feature was removed from the core and the new
`extract_date` plugin was created to enable it.

```js
import lume from "lume/mod.ts";
import extractDate from "lume/plugins/extract_date.ts";

const site = lume();

site.use(extractDate());

export default site;
```

By default the plugin provides the same behavior of Lume 2, but it's possible to
extract the date without removing it from the URL:

```js
import lume from "lume/mod.ts";
import extractDate from "lume/plugins/extract_date.ts";

const site = lume();

site.use(extractDate({
  remove: false, // Keep the date
}));

export default site;
```

## Removed plugins

In addition to `jsx_preact`, two more plugins were removed in Lume 3: `liquid`
and `on_demand`.

Liquid lets you using [LiquidJS](https://liquidjs.com/) as a template engine to
build pages. The syntax is very similar to Nunjucks and the library is actively
maintained but it has a big limitation: it's not possible to invoke functions.
This makes this template engine useless in Lume because it's not possible to use
helpers like `search` or `nav` to search pages or build the navigation. The
plugin has been deprecated for a while, and it was removed in Lume 3.

The `on_demand` plugin was mainly an experiment to see if it was possible to add
some dynamic behavior to Lume sites. But it never worked well, the
implementation was a bit hacky to make it work on Deno Deploy, and it was too
limited. Lume has the [router](https://lume.land/plugins/router/) for simple use
cases, and for complex cases, maybe you have to use a different framework. The
purpose of Lume never was to become into one-size-fits-all solution.

## Removed some customization

The following removals aim to improve the stability and interoperability between
plugins.

### `extensions` option

In Lume 2, some plugins have the `extensions` option to configure which files
you want to process. You rarely need to modify this option because Lume provides
sensible defaults. For example, the default value for
[Postcss](https://lume.land/plugins/postcss/) plugin is `[".css"]`:

```js
site.use(postcss({
  extensions: [".css"], // <- You don't need this
}));
```

In most cases, this option doesn't make sense, because you can set any value but
the plugin expects a specific format, like HTML pages to use DOM API or CSS code
to process:

```js
site.use(postcss({
  extensions: [".html"], // <- This breaks the build
}));
```

In Lume 3, this option was removed in many plugins:

- purgecss, postcss, and lightningcss always process `.css` files.
- sass always processes `.scss` and `.sass` files.
- svgo always processes `.svg` files.
- check_urls, base_path, relative_urls and modify_urls process `.css` and
  `.html` files.
- filter_pages processes all extensions.
- code_highlight, fff, inline, json_ld, katex, metas, multilanguage, og_images,
  and prism always process `.html` pages.

### Name option

There are other plugins that register filters or helpers that you can use in
your pages. In Lume 2 you could customize the name of these elements. For
example, it's possible to use a different key to store the data for the `metas`
plugin:

```js
site.use(metas({
  name: "opengraph",
}));
```

Or the filter name of the `date` plugin:

```
site.use(date({
  name: "get_date"
}))
```

Changing the default name of the plugins have two problems:

- The types declared by the plugin don't change, so even if you change the key
  `metas` to `opengraph`, `Lume.Data.metas` still exist.
- This breaks the interoperability between plugins. For example, `picture` and
  `transform_images` depend on the same key name. If you change it for only one
  plugin, the other won't work.

In Lume 3, the `name` option was removed in the following plugins, so it's no
longer possible to change it to something else: `date`, `json_ld`, `metas`,
`nav`, `paginate`, `picture`, `reading_info`, `search`, `transform_images`,
`url` and `postcss`.

### Other options

- cache option in `transform_images`, `favicon` and `og_images`
- `attribute` option in `inline`.
- Components are always in the `comp` variable. The option to customize this
  variable name has been removed.

Most Lume users don't change these options, so most likely these removals don't
affect your upgrade to Lume 3.

## Other changes

### Temporal API enabled by default

The [Temporal proposal](https://github.com/tc39/proposal-temporal) provides
standard objects and functions for working with dates and times. It's being
implemented in all browsers and it's supported by Deno with the
`unstable-temporal` flag. Lume 2 uses
[a polyfill](https://www.npmjs.com/package/@js-temporal/polyfill), but Lume 3
uses the Deno implementation, which requires to enable it in `deno.json` file:

```json
{
  "unstable": ["temporal"]
}
```

### Deno LTS support

As of Lume 3, Lume will support at least the most recent Deno LTS version (and
probably some older versions too). Lume 3.0 supports Deno 2.1 and greater. More
info
[about Deno LTS releases](https://docs.deno.com/runtime/fundamentals/stability_and_releases/#long-term-support-(lts)).

### Removed automatic doctype

Lume 2 automatically added `<!doctype html>` to any HTML pages that were missing
it. The original reason was because JSX doesn't allow adding this directive, so
it was difficult to create HTML pages with only JSX. However, some users don't
want this behavior because they create files with fragments of HTML. In Lume 3,
it is possible to add the `doctype` directive in JSX (thanks to SSX) so this
behavior is no longer needed.

### More changes

As always, you can see
[the CHANGELOG.md file](https://github.com/lumeland/lume/blob/v3.0.0/CHANGELOG.md)
for a complete list of all changes with more details.

## Thanks!

All this work wouldn't be possible without the help from all people that
contribute to Lume. Thanks to everyone that
[sponsor Lume](https://opencollective.com/lume)
[or directly me](https://github.com/sponsors/oscarotero). Thanks also to people
that have been testing Lume 3 in the latest months or even using it in real
projects, reporting bugs and providing feedback (specially
[Tim Post](https://timthepost.deno.dev/) and [Rick Cogley](https://cogley.jp/)),
and thanks to [Pyrox](https://pyrox.dev/) for reviewing the grammar of this
post.
