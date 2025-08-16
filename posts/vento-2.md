---
title: Vento 2 is here!
author: Óscar Otero
draft: true
tags:
  - Releases
  - Vento
comments: {}
---

Vento was born two years ago as an experiment to create a modern, ergonomic, and
async-friendly template engine for JavaScript. Initially, it was a Deno-only
project, intended to become the default template engine for **Lume**. But as
soon as the NPM package was available, other projects started to use it.

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
  [Zed plugin](https://github.com/dz4k/zed-vento), and
  [Illyrius](https://github.com/illyrius666) brought
  [support for WebStorm](https://github.com/ventojs/webstorm-vento).

All these contributors and
[many other](https://github.com/ventojs/vento/graphs/contributors) played an
important role in converting Vento into the template engine that it already is.

## Why create a version 2?

Everything started with
[this post](https://vrugtehagel.nl/posts/my-doubts-about-vento/) where
Vrugtehagel exposed some issues detected in Vento. He was kind enough to send me
an email to let me know about this post, and that constructive feedback was very
helpful and I addressed some of the issues mentioned.

However, Vrugtehagel not only limited himself to providing feedback, but he also
started to get involved in the
[Sublime Text plugin](https://github.com/ventojs/sublime-vento) and created
several
[pull requests to the Vento repository](https://github.com/ventojs/vento/pulls?q=is%3Apr+is%3Aclosed+author%3Avrugtehagel),
leading to some interesting discussions about Vento's philosophy and its future
direction. The most demanding challenge, for which we made different proofs of
concept, was to find an alternative approach to analyze the JavaScript code
without using meriyah or any other dependency. This would speed up the
compilation and remove all Vento dependencies.

Thanks to this change, the local footprint was reduced from
[1.8MB](https://pkg-size.dev/ventojs@1) to
[less than 100Kb](https://pkg-size.dev/ventojs@2.0.0-canary.1). The next step
was to convert Vento in an isomorphic library, which makes it to work on
browsers and on Node-like runtimes (Node, Deno, Bun) without changes or the need
for a compilation step.

And finally, one of the pain points of Vento, error reporting, was also
addressed thanks to the
[initial work of Vrugtehagel](https://github.com/ventojs/vento/pull/131) and
some subsequent changes by me.

Now, Vento is a modern, lean, and powerful template engine that can be used on
any JavaScript runtime and embedded on any framework easily.

## Main changes

After upgrading to Vento 2, almost everything in your .vto templates should
continue working as usual without changes, although there might be some edge
cases that now have a different behavior.

### New variable resolution

In Vento 1, when you run `Hello {{ name }}`, the compiler converts it
automatically to `Hello {{ it.name }}`. This means that, **technically,** you
could define a variable directly in the `it` global variable. For example, this
would print _"Hello World"_:

```vto
{{> it.name = "World" }}
Hello {{ name }}
```

Vento 2 uses a different approach:

```vto
Hello {{ name }}
```

When Vento compiles this template, all variables used are initialized
preventively at the begining like this:

```js
var { name } = it;
```

The variable is not replaced with `it.name` automatically everywhere. If you
edit the value of `it.name` in your code directly, it won't affect `name`.
However, users never should edit the `it` variable directly, but use
`{{ set name = "other value" }}`. So this change is unlikely to affect most
users.

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

I hope to improve this in next versions.

### Removed sync mode

Vento is **async** by default, it's one of its main selling points. There was
also the function `runStringSync` to run arbitrary strings in a synchronous
context though. For example:
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
