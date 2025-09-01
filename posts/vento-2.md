---
title: Vento 2 is here!
author: Óscar Otero
draft: false
tags:
  - Releases
  - Vento
comments:
  src: 'https://fosstodon.org/@lume/115128718698242188'
  bluesky: 'https://bsky.app/profile/lume.land/post/3lxritwpakk2y'
extra_head: |-
  <style>
    .vento-logo {
      border: none !important;
      width: 100%;
      display: block;
      margin: 2rem 0;
    }
    table {
      width: 100%;
      background-color: var(--color-highlight);
      font-variant-numeric: tabular-nums;
    }
    th {
      color: var(--color-base);
      border-bottom: solid 1px var(--color-line);
    }
    th, td {
      padding: 4px 8px;
    }
  </style>
date: '2025-09-01T00:00:00.000Z'
---
![Vento 2](/uploads/vento-2.svg){.vento-logo}

Vento was born two years ago as an experiment to create a modern, ergonomic, and
async-friendly template engine for JavaScript. Initially, it was a Deno-only
project, intended to become the default template engine for **Lume**. But as
soon as the [NPM package was available](https://www.npmjs.com/package/ventojs),
other projects started to use it.

<!-- more -->

During this period, a number of people got involved in the development.

- [wrap](https://github.com/wrapperup) made a wonderful work implementing and
  maintaining a JavaScript analyzer to automatically resolve the global
  variables (so you can type `{{ somevariable }}` instead of
  `{{ it.somevariable }}`. She's also responsible for the
  [tree-sitter](https://github.com/ventojs/tree-sitter-vento) parser to bring
  support for Neovim and similar editors.
- [Noel Forte](https://github.com/noelforte) created the
  [11ty plugin](https://github.com/noelforte/eleventy-plugin-vento) that made
  Vento popular in the 11ty ecosystem.
- [Deniz Akşimşek](https://github.com/dz4k) created the
  [Zed plugin](https://github.com/dz4k/zed-vento).
- [Illyrius](https://github.com/illyrius666) brought
  [support for WebStorm](https://github.com/ventojs/webstorm-vento).

Vento wouldn't be so awesome without the help of these contributors and
[many other](https://github.com/ventojs/vento/graphs/contributors) that improve
it with their selfless work. **THANK YOU SO MUCH!**

## Why create a version 2?

Everything started with
[this post](https://vrugtehagel.nl/posts/my-doubts-about-vento/) where
Vrugtehagel exposed some issues detected in Vento. He was kind enough to send me
an email to let me know about the post whose constructive feedback was very
helpful and several issues mentioned were addressed in Vento 1.

However, Vrugtehagel not only limited himself to providing feedback, but he also
started to get involved in the
[Sublime Text plugin](https://github.com/ventojs/sublime-vento) and created a
bunch of
[pull requests to the Vento repository](https://github.com/ventojs/vento/pulls?q=is%3Apr+is%3Aclosed+author%3Avrugtehagel),
leading to some interesting discussions about Vento's philosophy and its
implementation approach. The most demanding challenge, for which we made
different proofs of concept, was to find an alternative way to analyze the
JavaScript code without using meriyah or any other dependency. This would make
the compilation faster and remove all Vento dependencies.

Thanks to this change, the local footprint was reduced **from 1.8MB to less than
80Kb** (**18KB** bundled and minified).

The next step was to convert Vento in an isomorphic library, which makes it to
work on browsers and on Node-like runtimes (Node, Deno, Bun) without changes or
the need for a compilation step.

And finally, one of the pain points of Vento, error reporting, was also
addressed thanks to the
[initial work of Vrugtehagel](https://github.com/ventojs/vento/pull/131) and
some subsequent changes by me.

Vento is now a modern, lean, and powerful template engine that can be used on
any JavaScript runtime and embedded on any framework easily.

## Main changes

After upgrading to Vento 2, almost everything in your .vto files should continue
working as usual without changes, although there might be some edge cases that
now have a different behavior.

### New variable resolution

In Vento 1, when you run `Hello {{ name }}`, the compiler converts it
automatically to `Hello {{ it.name }}`. This means that, **technically,** you
could define a variable directly in the `it` global variable and it would be
accessible without the prefix. For example, the following code would print
_"Hello World"_:

```vto
{{> it.name = "World" }}
Hello {{ name }}
```

Vento 2 uses a different approach. When Vento compiles the following template:

```vto
Hello {{ name }}
```

all variables used are initialized preventively at the begining like this:

```js
var { name } = it;
```

The variable is not replaced with `it.name` automatically everywhere but the
real variable `name` is created instead. If you edit the value of `it.name` in
your code directly, **it won't affect `name`**. However, this is more a Vento's
internals change and it's unlikely to affect to final users since they never
should edit the `it` variable directly, but use the code
`{{ set name = "other value" }}`.

### New error handler

Any error produced while compiling or running the templates is now converted to
a `VentoError` class. This class contains all the information required to report
the exact point where the error originates. For example, the following template
produce an error because we are invoking a function from a `null` variable:

```vto
{{ set name = null }}
{{ name.foo() }}
```

In order to run and pretty-print errors, you can use the `printError` helper:

```js
import vento from "vento/mod.ts";
import { printError } from "vento/core/error.js";

const env = vento();

try {
  const result = await env.run("my-template.vto");
} catch (err) {
  console.error(await printError(err));
}
```

This outputs the following:

```
TypeError: Cannot read properties of null (reading 'foo')
test/main.vto:2:1
 1 | {{ set name = null }}
 2 | {{ name.foo() }}
   | ^
   | __exports.content += (name.foo()) ?? "";
   |                              ^ Cannot read properties of null (reading 'foo')
```

The error displays the tag where the error occurs and it can show also the error
in the compiled code (the final JavaScript code) to give more context.

Note that the error handler doesn't work consistently accross all runtimes, due
their differences providing useful data from the error stack. For example, it
works pretty well on Deno, but Node and Bun cannot recover the exact location of
some errors so it's not possible to provide detailed info in some cases. There
may be also some differences between browsers.

I hope this feature can be improved in next versions. PR are very appreciated!

### Removed sync mode

Vento is **async** by default, it's one of its main selling points. In Vento 1
there was also the function `runStringSync` to run arbitrary code in a
synchronous context. For example:
`env.runStringSync("Hello {{ name }}", { name: "World"})`.

This mode was originally created because Lume needed it. However, the
synchronous mode doesn't fit well with how Vento works internally. Having both
sync and async modes makes everything more complicated, and the sync mode breaks
if your template has async tags, like `{{ include }}`, or runs any async
function or filter.

Since Lume no longer needs this feature, the function was removed in Vento 2,
and now all templates are run consistently in an async context.

### New `slot` tag

The [`layout` tag](https://vento.js.org/syntax/layout/) allows to render a
template passing extra content. This is great for layouts expecting only one
piece of content. But if the layout requires more pieces, you have to pass them
as variables:

```vto
{{ layout "article.vto" { header: "<h1>This is the title</h1>" } }}
  <p>This is the content</p>
{{ /layout }}
```

The new `slot` tag allows to capture and store the content in different
variables, similar to what web components do.

```vto
{{ layout "article.vto" }}
  {{ slot header }}
    <h1>This is the title</h1>
  {{ /slot }}

  <p>This is the content</p>
{{ /layout }}
```

Learn more about [slots in the documentation site](https://vento.js.org/syntax/layout/#slots).

### Browser support

As said, Vento 2 works also on browsers, without any compilation step, thanks to
not having dependencies and the use of standard APIs. You can download the NPM
package or use a CDN like jsDelivr:

```js
import vento from "https://cdn.jsdelivr.net/npm/ventojs@2.0.0/web.js";

const env = vento({
  includes: import.meta.resolve("./templates"),
});

const result = await env.run("main.vto");
console.log(result.content);
```

Note that instead of importing the `mod.js` module, you have to import `web.js`.
The only difference is that `web.js` uses the `URL` loader by default to load
templates using `fetch`. The `includes` option defines the base URL to load all
templates.

## Benchmarks

Vento 1 was already quite fast, but version 2 is even faster thanks to the new
compiler.

### Vento 1 vs Vento 2

The compiler in Vento 2 is almost **200% faster** as you can see in the
following benchmark:

| Compilation | time/iter (avg) | iter/s |
| :---------- | --------------: | -----: |
| Vento 2     |        196.0 µs |  5,102 |
| Vento 1     |        378.0 µs |  2,646 |

When comparing the rendering performance of Vento 1 and Vento 2, there are no
significant differences. Vento 1 may be slightly faster, but the difference is
minimal and not easily noticeable.

| Rendering | time/iter (avg) |    iter/s |
| :-------- | --------------: | --------: |
| Vento 2   |        860.9 ns | 1,162,000 |
| Vento 1   |        820.0 ns | 1,220,000 |

Comparing compilation and rendering performance, Vento 2 demonstrates **a 180%
speed improvement**. Even if a few milliseconds are lost during rendering, the
overall performance gain more than compensates for it.

| Comp. & rendering | time/iter (avg) | iter/s |
| :---------------- | --------------: | -----: |
| Vento 2           |        186.0 µs |  5,376 |
| Vento 1           |        342.8 µs |  2,917 |

## Comparison with other libraries

To compare the performance of Vento with other template engines, you can
[run the bench code](https://github.com/ventojs/vento/tree/main/bench) in
Vento's repository. As of writing this post, the benchmark data is:

| Compilation | time/iter (avg) | iter/s |
| :---------- | --------------: | -----: |
| 1. Eta      |         51.1 µs | 19,580 |
| 2. EJS      |        145.2 µs |  6,888 |
| 3. Vento    |        196.0 µs |  5,102 |
| 4. Nunjucks |        602.1 µs |  1,661 |
| 5. Liquid   |        635.0 µs |  1,575 |
| 6. Preact   |        978.4 µs |  1,022 |
| 7. Pug      |          4.2 ms |    237 |

| Rendering   | time/iter (avg) |    iter/s |
| :---------- | --------------: | --------: |
| 1. Vento    |        860.9 ns | 1,162,000 |
| 2. Pug      |          1.6 µs |   632,100 |
| 3. Preact   |          8.8 µs |   113,900 |
| 4. Eta      |         11.2 µs |    89,600 |
| 5. EJS      |         14.8 µs |    67,790 |
| 6. Liquid   |        351.3 µs |     2,847 |
| 7. Nunjucks |        812.5 µs |     1,231 |

| Comp. & rendering | time/iter (avg) | iter/s |
| :---------------- | --------------: | -----: |
| 1. Eta            |         68.0 µs | 14,700 |
| 2. EJS            |        177.3 µs |  5,639 |
| 3. Vento          |        186.0 µs |  5,376 |
| 4. Edge           |        518.0 µs |  1,931 |
| 5. Preact         |        706.5 µs |  1,415 |
| 6. Liquid         |          1.1 ms |    937 |
| 7. Nunjucks       |          1.5 ms |    676 |
| 8. Pug            |          4.2 ms |    236 |

Vento delivers exceptional rendering performance. While Eta and EJS offer faster
compilation speeds, they struggle with delimiter handling. For example,
`<%= '%>' %>` throws an error in EJS, but Vento handles the equivalent,
`{{ '}}' }}`, perfectly fine.

## Update now

Vento 2 is available on NPM (for Node-like runtimes) and HTTP imports (for
browsers and Deno). See the
[CHANGELOG file](https://github.com/ventojs/vento/blob/v2.0.0/CHANGELOG.md) for
the full list of changes.
