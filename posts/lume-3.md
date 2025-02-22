---
title: Lume 3
author: Óscar Otero
draft: true
tags:
  - Releases
comments: {}
---

## The main problem

The function `site.copy()` allows you to copy files from the `src` folder
without reading the content, which is faster and consumes less memory. But it
has a big drawback: the copied files are not processed.

For example, let's say you have the following configuration:

```js
site.copy("/assets");
site.use(postcss());
```

When Lume builds the site, the files inside the `/assets` folder are copied
as-is. If the folder contains CSS files, they **won't be processed by Postcss**.
Learn more about
[this issue on GitHub](https://github.com/lumeland/lume/issues/571).

This behavior is confusing and many people reported this as a bug. And they are
right: Lume should be clever enough to don't delegate to you the decision of
whether a file must be loaded or copied.

## The solution: `site.add()`

In Lume 3 `site.loadAssets()`, `site.copyRemainingFiles()` and `site.copy()`
functions were removed and now you have a new single function for everything:
`site.add()`.

The `add()` function simply says to Lume that you want to include some files in
your site, but without specifying how this file must be treated. Lume will load
the files if it needs to (for example, if they need to be processed), or will
copy them if no transformations are needed.

```js
site.add("/assets");
site.use(postcss()); // CSS files in /assets will be processed too!
```

To upgrade from Lume 2 to Lume 3, just replace `site.loadAssets()`,
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

`site.add()` not only can add files from the `src` folder but also remote files.
In Lume 2 this was possible using `remoteFile` function:

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

The `site.add()` function accepts also `npm` specifiers:

```js
site.add("npm:normalize.css", "/styles/normalize.css");
```

Internally, uses jsDelivr to download the file. In this example,
`npm:normalize.css` is transformed to
`https://cdn.jsdelivr.net/npm/normalize.css`.

> [!note]
>
> `site.remoteFile` is still useful in Lume 3 for files not directly exported to
> the dest folder, like `_data`, `_components` or `_includes` files.

## Plugins no longer load files automatically

In Lume 2, some plugins configure Lume to load files with a certain extension
automatically. For example, Postcss not only processes the CSS code but also
configures Lume to load all CSS files:

```js
// All .css files are loaded and processed
site.use(postcss());
```

In some cases, this is what you want. But if you don't want to load all CSS
files, this behavior makes Lume to load everything and you have to use the
`ignore()` function or move the unwanted files to a folder starting with `_`.

In addition to that, this behavior is not fully transparent. You have to read
the documentation to know what the plugin is doing.

This approach causes more harm than benefit.

In Lume 3, thanks to the `site.add()` function, it's very easy to add new files
(and only the files that you want), so plugins **no longer load files by
default**. You have to explicitly add them, which is more clear and intuitive:

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

This change affects to the following plugins: `svgo`, `transform_images`,
`picture`, `postcss`, `sass`, `tailwindcss`, `unocss`, `esbuild` and `terser`.

## One JSX library

Lume started supporting `JSX` as a template engine thanks to the `jsx` plugin
that uses React under the hood. Some versions later the plugin `jsx_preact` was
added to use Preact, a smaller and more performant alternative to React.

Having two JSX plugins for the same purpose is useless and adds unnecessary
complexity (for example combined with MDX plugin).

In addition to that, both libraries are frontend-first libraries, with features
like hooks, events callbacks, hydration, etc, that are not supported at building
time, and some people were confused about what they can do with them in Lume.

Lume 3 has only one JSX library, and it's not React or Preact. It's
[SSX](https://github.com/oscarotero/ssx/), a TypeScript library created
specifically for static sites which is faster than React and Preact
([See Benchmarks](https://github.com/oscarotero/ssx/actions/runs/13022300332/job/36325328553#step:7:22))
and more ergonomic. It allows to create of asynchronous components, insert raw
code like `<!doctype html>`, and comes with great documentation including all
HTML elements and attributes, with links to MDN.

And because Lume has only a JSX library, the MDX plugin works automatically
without needing to use the JSX plugin before.

## Improved Lume components

### Async components

One of the main limitations of Lume components was they were synchronous. The
reason is to support JSX components that were synchronous in React and Preact.
With SSX, we don't have this limitation anymore and all components are async.

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
<p>{{ await comp.Salute({ id: 23}) }}</p>
```

### Folder component

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
JS code by the code editor. There's no syntax highlight.

In Lume 3 it's possible to create a component in a folder, with the CSS and JS
code in different files. To do that, you have to keep the following structure:

```txt
|_ _components/
    |_ button/
        |_ comp.vto
        |_ style.css
        |_ script.js
```

Any folder containing a `comp.*` file will be loaded as a component using the
folder name as the component name. And the files `style.css` and `script.js`
will be loaded as the CSS and JS code for the component. This makes the creation
of components more ergonomic, especially for cases with a lot of CSS and JS
code.

### Default data in components

In Lume 3, components can have extra data that will be used as default values.
This data is like layout data but applied to components.

Let's see the following `_components/title.vto` component as an example :

```html
--- title: Hello world ---

<h1>{{ title }}</h1>
```

Now you can use the component with the default title.

```html
{{ await comp.title() }}
<!-- <h1>Hello world</h1> -->
```

Or with a custom title

```html
{{ await comp.title({ title: "New title" }) }}
<!-- <h1>New title</h1>  -->
```

> [!note]
>
> The variables `css`, `js`, and `inheritData` are not used as default values
> because they are used to configure the component itself.

## Global cssFile and jsFile

As said, Lume components can output CSS and JS code. But there are some plugins
that output code too. For example, `google_fonts` generates the CSS code needed
to load the fonts, `prism` and `code_highlight` export the CSS code with the
themes, etc. In Lume 2, every plugin has its own configuration. In Lume 3 there
are two global options that will be used by default by all plugins and
components:

```js
const site = lume({
  cssFile: "/style.css", // default value
  jsFile: "/script.js", // default value
});
```

All extra code generated by components and the plugins `code_highlight`,
`google_fonts`, `prism` and `unocss` will use these files to store the code.

Of course, you can change the code destination for a specific plugin:

```js
site.use(unocss({
  cssFile: "/unocss-styles.css",
}));
```

## Tailwind 4

The `tailwindcss` plugin was upgraded to use
[Tailwind 4](https://tailwindcss.com/blog/tailwindcss-v4). The new version is
faster than v3 and no longer needs postcss to work. There are many changes in
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

If you don't want to upgrade to v4 it's still possible to use Tailwind 3 with
the postcss plugin:

```js
import tailwind from "npm:tailwindcss@^3.4";

site.use(
  postcss({
    plugins: [tailwind()],
  }),
);
```

## Processors improvements

`site.process()` and `site.preprocess()` are one of the most used features of
Lume. Lume 3 brings some improvements here to make them easier to use.

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
exception if the page cannot be parsed. This allows us to omit the type
checking:

```js
site.process([".html"], (pages) => {
  for (const page of pages) {
    const title = page.document.querySelector("title");
  }
});
```

### New page properties

The `page.content`, which returns the content of the page, can be a string or a
`Uint8Array`, depending on how this page has been loaded. For example, HTML, CSS
or JS pages have the content as string but images or other binary files have
`Uint8Array`.

To process these files in Lume 2 you have to check the content type:

```js
site.process([".css"], (pages) => {
  for (const page of pages) {
    const content = page.content;
    if (typeof content !== "string") {
      continue;
    }
    page.content = "/* © 2025 */" + content;
  }
});
```

In Lume 3, pages have two new properties: `page.text` and `page.bytes` (inspired
by the same properties of the
[Request](https://developer.mozilla.org/en-US/docs/Web/API/Request#instance_methods)
object). As you may guess, `page.text` allows to work with the page content as
strings, making the conversions automatically and `page.bytes` does the same but
for `Uin8Array`.

```js
site.process([".css"], (pages) => {
  for (const page of pages) {
    page.text = "/* © 2025 */" + page.text;
  }
});
```

### Omit `*` wildcard

In Lume 2, the `*` wildcard allows to process all pages:

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
see this example from `sitemap` plugin:

```js
site.use(sitemap()); // Generate the sitemap file
site.use(basePath()); // Add the base path to all URLs
```

The sitemap plugin is registered before basePath, so you may guess the sitemap
file is generated before adding the base path prefix to all URLs. But
internally, the sitemap plugin is executed using the "beforeSave" event, which
is triggered at the end, just before saving all files to the _site folder. So
internally the basePath plugin is executed before.

This was designed in this way, so you don't have to think about the order of the
plugins when using it. But this behavior has two problems:

- There are many plugins in which the order matters. For example, if you combine
  SASS and Postcss you may want to process the SCSS files first and pass the
  result to Postcss. This inconsistency makes you wonder in which plugins the
  order is important or not.
- It's not possible to use a processor to modify the output of these plugins.
  For example, if you want to compress the sitemap file with brotly or gzip, is
  not possible because the sitemap will be executed always later.

To make Lume less magic and more transparent and intuitive, many plugins using
events were changed to use processors, which respect the order in which they are
registered in the _config.ts file.

The affected plugins are: code_highlight, decap_cms, favicon, feed,
google_fonts, icons, prism, robots, sitemap, and slugify_urls.

## esbuild uses `esbuild-deno-loader` to resolve dependencies

Deno is becoming a complicated runtime, especially for everything related with
module resolution. It supports three completely different types of packages
(HTTP, NPM and JSR), with different behaviors, inconsistencies and
incompatibilities between them. In addition to the usual complexity of NPM, in
Deno a package can be located in different places, depending on the variable
`nodeModulesDir`, if the file `package.json` is found, if the `node_modules`
folder exists, etc. JSR is not much better, because the resolution of a package
depends on the combination of `imports`, `exports` and `patch` keys in different
`deno.json` and `deno.jsonc` files. And the addition of workspaces adds a new
layer of complexity.

In Lume 2, the `esbuild` plugin delegates all this complexity to
[esm.sh](https://esm.sh/), that can transform any NPM and JSR package to simple
HTTP imports that are easier to manage. But this solution has its own complexity
in form of multiple configuration options (`deps`, `pin`, `alias`, `standalone`,
`exports`, etc) and there are many packages that don't work well after passing
them through esm.sh.

In Lume 3 the `esbuild` plugin uses the
[esbuild-deno-loader](https://jsr.io/@luca/esbuild-deno-loader) plugin created
by Luca Casonato, member of the Deno team. This will make the bundlering of your
code more reliable and compatible with how Deno works.

## basename variable

## remove extensions option from many plugins

## remove name option from many plugins

## removed automatic doctype

## removed on_demand plugin

## removed liquid plugin
