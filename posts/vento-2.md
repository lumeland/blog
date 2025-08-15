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
async-friendly template engine for JavaScript. Initially, it was a Deno-only project,
intended to become the default template engine for Lume. But as soon as the NPM package was available, other
projects started to use it.

<!-- more -->

During this period, a number of people got involved in the development.

- [wrap](https://github.com/wrapperup) made a wonderful work implementing and
  maintaining a JavaScript analyzer to automatically resolve the global
  variables (so you can type `{{ somevariable }}` instead of
  `{{ it.somevariable }}`. She's also responsible for the
  [tree-sitter](https://github.com/ventojs/tree-sitter-vento) parser to bring
  support for Neovim and similar editors.
- [Noel Forte](https://github.com/noelforte) created the
  [11ty plugin](https://github.com/noelforte/eleventy-plugin-vento) that made Vento popular in the 11ty ecosystem.
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
sparking some interesting discussions about Vento's philosophy and future
directions. The most demanding challenge, for which we made different POC, was
to find an alternative approach to analyze the JavaScript code without using
meriyah or any other dependency. This would speed up the compilation and remove all Vento dependencies.

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

In Vento 1, when you run `{{ somevariable }}`, the compiler converts it
automatically to `{{ it.somevariable }}`. This means that you can define a
variable directly in the `it` global variable. For example, this would print
"foo":

```vto
{{> it.somevariable = "foo" }}
{{ somevariable }}
```

Vento 2 uses a different approach. Now the compiler analyzes the keywords used
in order to define the variables preventively. For example, the following
template:

```vto
{{ somevariable }}
```

Is converted to this (code simplified for clarity):

```js
// At the beginning of the template
var { somevariable } = it;

// Anywhere in the template
__output.content += somevariable;
```

As you can see, the `it.` prefix is no longer added automatically. Instead,
variables are destructured from `it` at compile time, so assigning to
`it.somevariable` does not affect `somevariable` directly. This means the
previous example would not work as expected.

However, this is a rare edge case that is unlikely to affect most users.

### New error handler

Any error produced while compiling or running the templates is now converted to
a `VentoError` class. This class contains all the information required to report
the exact point where the error originates. In order to pretty-print errors, you
can use the `printError` helper:

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

Note that the error handler doesn't work consistently, due the differences between runtimes to provide useful data from the error stack. For example, it works pretty well on Deno, but Node and Bun cannot recover the exact location of some errors so it's not possible to provide detailed info. There may be also some differences between browsers.

### Removed sync mode

Vento is async by default, it's one of its main selling points. But it also had
a `runStringSync` function to run arbitrary strings in a synchronous context.
For example: `env.runStringSync("Hello {{ name }}", { name: "World"})`.

This mode was originally created because Lume needed it. However, the
synchronous mode doesn't fit well with how Vento works natively. Having both
sync and async modes makes everything more complicated, and the sync mode breaks
if your template has any async tag, like `{{ include }}`, or runs any async
function or filter.

Since Lume no longer needs this feature, the function was removed in Vento 2,
and now all templates are run consistently in an async context.
