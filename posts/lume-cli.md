---
title: Lume CLI
date: 2023-01-06
author: Óscar Otero
tags:
  - Releases
---

Happy new year, Lumers!

2022 was a great year for Lume, it reached to 1K stars in GitHub and many of you
have collaborated in form of pull requests, promoting Lume in your blogs and
social networks or
[even sponsoring me](https://github.com/sponsors/oscarotero/). I want to thank
you and promise to keep working hard to make Lume even better.

🔥🔥🔥🔥🔥🔥🔥🔥🔥

<!-- more -->

## Introducing Lume CLI

The best way to run Lume is using the Deno tasks. It's the most portable way to
run Lume without installing anything else but Deno, and it ensures that the Lume
version is the same as specified in the `import_map.json` file. In fact,
[there's a plan to remove the CLI interface](https://github.com/lumeland/lume/issues/232)
completely.

The only drawback of using Deno tasks is they are more verbose to type. Instead
of simply running `lume -s` or `lume run my-script` you have to type
`deno task lume -s` and `deno task lume run my-script`.

In order to keep using tasks to run Lume and, at the same time, having a more
ergonomic way to run the commands, I have released the new
[Lume CLI](https://deno.land/x/lume_cli).

To install it, just run:

```
deno install --allow-run --name lume --force --reload https://deno.land/x/lume_cli/mod.ts
```

Lume CLI is just a small script to add the `deno task` words at the beginning of
your lume commands. For example, if you run `lume -s`, the CLI will run
`deno task lume -s`.

It's an independent module, separated from the Lume repository, so it's up to
you to use it or not.

It also includes two additional commands:

- `lume init`: To initialise Lume in the current directory. It's like running
  `deno run -Ar https://deno.land/x/lume/init.ts`.
- `lume ugrade-cli`: As you may guess, it will upgrade the Lume CLI to the
  latest version.

Lume CLI combines the best of the two worlds and opens the door to removing the
old CLI interface in the Lume repo sometime soon.
