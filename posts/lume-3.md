---
title: Lume 3
author: Óscar Otero
draft: true
tags:
  - Releases
comments: {}
---

## About loaded and copied files

When Lume builds a site, some files are **loaded** and others **copied**.

Files with extensions `.vto`, `.md`, or `.page.ts` are loaded because Lume needs
to read the content to generate HTML pages. They are known as _Page files_.

Files added using the function `site.copy()` are just copied from the `src`
folder to `dest` without reading the content, which is faster and consumes less
memory. These files are known as _Static files_.

However, there are some files that must be loaded or copied, depending on the
configuration. For example, CSS files are loaded if you use a plugin like
Postcss, because the content needs to be processed. In this case, the plugin
internally runs `site.loadAssets([".css"])`, to instruct Lume that the files
with extension `.css` need to be loaded but not to generate HTML pages but
assets.

One of the most recurrent issues is when a file is configured to be copied and
loaded. For example:

```js
site.copy([".css"]);
site.use(postcss());
```

In this configuration, the build copies all CSS files and you may expect these
files to be transformed with the postcss plugin. However due to the `.css` files
being copied, not loaded, **the plugin doesn't process them**.

Another example, a bit less obvious is when you have a folder with different
files, some of them need to be processed and others don't:

```js
site.copy("/assets");
site.use(postcss());
```

In this case, we are copying all files in the `/assets` folder. This folder can
contain CSS files that, as you may guess, won't be processed by Postcss.

This behavior is confusing, but fixing it is a breaking change, so this is the
main reason version 3 was released. Lume should be clever enough to don't
delegate the decision of whether a file must be loaded or copied to you.

## Introducing `add()`

In Lume 3 all this logic was refactored and the functions `site.loadAssets()`
and `site.copy()` were replaced with a single function: `site.add()`.

The `add()` function simply instructs Lume that you want to include this file in
your site, but without specifying how this file must be treated. Lume will load
the file if it needs to (for example, if it needs to be processed), or will copy
it if no transformation needs to be made.

This simplifies a lot the configuration, especially in those cases where copied
and loaded files are mixed in the same folder.

`site.add()` has the same syntax as the old `site.copy()`, so you can add all
CSS files that are loaded and processed by Postcss:

```js
site.add([".css"]);
site.use(postcss());
```

You can add also specific files and folders, and even change the destination
folder:

```js
// Add all files in /assets to the root of dest folder.
site.add("/assets", ".");

// Run Postcss. Any CSS file in /assets will be processed!
site.use(postcss());
```

### Replacing `copyRemainingFiles()`

In Lume 2 there was the `site.copyRemainingFiles()` function as a way to manage
complex situations like this. For example, let's say you have the following
structure:

```txt
|_ articles/
    |_ article-1/
    |   |_ index.md
    |   |_ picture.jpg
    |   |_ document.pdf
    |   |_ foo32.gif
    |_ article-2/
        |_ index.md
        |_ journey.mp4
        |_ download.zip
```

In this structure we want to render all markdown files and copy the remaining
files. In Lume 2 we cannot do `site.copy("articles")`, because the `index.md`
files inside these folders wouldn't be processed (they would be treated as
static files). So we had to use the `copyRemainingFiles` function.

```js
// Lume 2
site.copyRemainingFiles(
  (path: string) => path.startsWith("/articles/"),
);
```

With this configuration, any file not loaded that is inside the `/articles`
folder will be copied.

In Lume 3, we can simply do:

```js
// Lume 3
site.add("articles");
```

**And that's all!** Any file that must be loaded (like `.md` files) will be
loaded. And the others simply will be copied.

### Copy remote files

`site.add()` not only can add files from the `src` folder but also remote files.
In Lume 2 this was possible using `remoteFile` function:

```js
// Lume 2
site.remoteFile("styles.css", "https://example.com/theme/styles.css");
site.copy("styles.css");
```

Lume 3 makes this use case more simple:

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
> `site.remoteFile` is still useful in Lume 3, especially for other file types
> like `_data` files, templates, components, etc.

## Add files explicitly

In Lume 2, some plugins configure Lume to load files with a certain extension
automatically. For example, Postcss configures Lume to load all CSS files:

```js
// Lume 2

// All .css files are loaded and processed
site.use(postcss());
```

In most cases, this is what you want. But if you don't want to output all CSS
files, you have to use the `ignore()` function.

For example, let's say we have the following structure and only want to process
`homepage.css` and `about.css` but not the files inside `utils` (because they
are already imported):

```txt
|_ styles/
    |_ homepage.css
    |_ about.css
    |_ utils/
        |_ typography.css
        |_ color.css
```

In Lume 2 we have to ignore this folder.

```js
// Lume 2
site.use(postcss());
site.ignore("styles/utils");
```

The problem with this behavior is that Lume by default adds everything and then
you have to ignore what you don't want. Sometimes this approach causes more harm
than benefit.

In Lume 3, thanks to the `site.add()` function, it's very easy to add new files
(and only the files that you want), so plugins **no longer load files by
default**. You have to explicitly add them, which is more clear and intuitive:

```js
// Lume 3

site.use(postcss());
site.add("styles/homepage.css");
site.add("styles/about.css");
```

Or if you want to load all css files:

```js
// Lume 3

site.use(postcss());
site.add(".css");
```

Another benefit is you have better control of all entry points of your assets.
For example, for esbuild:

```js
// Lume 3

site.use(esbuild());
site.add("main.ts"); // Only this file will be bundled
```

This change affects to the following plugins: `svgo`, `transform_images`,
`picture`, `postcss`, `sass`, `tailwindcss`, `unocss`, `esbuild` and `terser`.

## One JSX

Lume started supporting `JSX` as a template engine thanks to the `jsx` plugin
that uses React under the hood. The reason for choosing React is because it's
the default library, so it worked without any configuration.

Some versions later, Lume added support for Preact, a smaller and more
performant React alternative, with the plugin `jsx_preact`. Having two JSX
plugins for the same purpose is not good, and adds unnecessary complexity (for
example to use MDX plugin).

In addition to that, both libraries are frontend-first libraries, with features
like hooks, events callbacks, hydration, etc, that are not supported on the
server side, and some people were confused about what they are able to do with
them in Lume.

Lume 3 has only one JSX library, and it's not React or Preact. It's
[SSX](https://github.com/oscarotero/ssx/) a library created specifically for
static sites, created in TypeScript, faster than React and Preact
[See Benchmarks](https://github.com/oscarotero/ssx/actions/runs/13022300332/job/36325328553#step:7:22)
and more ergonomic. It allows to create asynchronous components, insert raw code
like `<!doctype html>`, and comes with great documentation including all HTML
elements and attributes, with links to MDN.

And because Lume has only a JSX library, the MDX plugin works automatically
without needing to use a JSX plugin before.

## Improved Lume components

### Async components

One of the main limitations of Lume components was the synchronous nature. The
reason is to support JSX components that were synchronous in React and Preact.
With SSX, we don't have this limitation any more and all components are async.

For example, you can create a component in JSX that returns a promise:

```jsx
// _components/salute.jsx

export default async function ({ id }) {
  const response = await fetch(`https://example.com/api?id=${id}`);
  const data = await response.json();
  return <strong>Hello {data.name}</strong>;
}
```

And this component can be used in any other template engine, like JSX:

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

Lume components not only generate HTML code to reuse but can also export the CSS
and JS code needed to run this code on the browser. The code must be exported in
the variables `css` and `js`. For example:

```md
---
css: |
  .mainTitle {
    color: red;
  }
---

<h1 class="mainTitle">{{ name }}</h1>
```

The problem of this approach is the CSS and JS code is not treated as CSS and JS
code by the code editor, so there's no syntax highlight.

In Lume 3 it's possible to generate a component in a folder, with the CSS and JS
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
of components more ergonomic, specially for cases with a lot of CSS and JS code.

Now you can use the component anywhere:

```html
{{ await comp.Button({ content: "click here" }) }}
```

## Tailwind 4

## Processors improvements
