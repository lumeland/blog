---
title: Lume 1.16.0 release notes
date: 2023-03-21
author: Óscar Otero
tags:
  - Releases
---

Hi everyone! This is a brief summary of what the new version of Lume
(**1.16.0**) brings.

<!-- more -->

## BREAKING CHANGE: `multilanguage` plugin refactor

The `multilanguage` plugin was created to simplify the creation of sites in
multiple languages. But the way it worked so far was a bit confusing and not
very practical. Lume 1.16 introduce some changes that (sadly) breaks some
compatibility with the previous version. But I think the new behavior is much
more clear and easy to use and understand. Some of the most important changes:

### You need to specify the available languages in the _config file

In the old plugin, each page defined its own languages. There wasn't a place to
specify the available languages for the whole site. This makes the plugin to
work inconsistently for each page, because it depended on the number of
languages defined in every case. The new version requires to specify the
languages in the _config file, so it will work in the same way with all pages.

```ts
site.use(multilanguage({
  languages: ["en", "gl"],
}));
```

### The language prefix is automatically added to the urls.

The new plugin automatically prepend the `/${lang}/` prefix to all urls. If you
have the following page:

```md
---
lang: en
url: /hello-world/
---

# Hello world
```

The output file is `/en/hello-world/`. This ensure all pages in the same
language are in the same subdirectory.

It's possible to define a language as default, so all pages in this language
won't have this prefix. For example, let's say our site is in english and
galician but we want to set english as the main language:

```ts
site.use(multilanguage({
  languages: ["en", "gl"],
  defaultLanguage: "en",
}));
```

With this configuration, the english version of the page is `/hello-world/` but
the galician version is `/gl/hello-world/`.

### Use `id` to relate pages in different languages

In the old version, to setup multiple versions of the same page in individual
files, you had to follow some strict instructions:

- All files must be in the same folder.
- They must have the same name, suffixed with the language.

For example:

```
- /about-me_en.md
- /about-me_gl.md
```

The new plugin removes this behavior. You have to use the `id` variable to
relate different pages.

For example, the english version:

```md
---
lang: en
url: /about-me/
id: about
---

# About me
```

The galician version:

```md
---
lang: gl
url: /acerca-de-min/
id: about
---

# Acerca de min
```

The new plugin interprets these two pages as the same content but in different
languages, because they have the same id (`about`). You don't need to have all
files in the same folder with a specific name.

See the
[complete plugin documentation](https://lume.land/plugins/multilanguage/).

## New `nav` plugin

The `nav` plugin builds automatically a menu of your site using the URLs to
define the hierarchy. For example, let's say we have a site which exports the
following pages:

- `/`
- `/articles/`
- `/articles/first-article/`
- `/articles/second-article/chapter-1/`
- `/articles/second-article/chapter-2/`

This plugin register the `nav` variable in your templates, similar to
[`search`](https://lume.land/plugins/search/) but intended for navigation stuff.
The `nav` variable has some useful functions:

### Menu

The `nav.menu()` function returns an object with the site structure, so you can
build a tree menu:

```ts
const tree = nav.menu();

console.log(tree);

{
  slug: "",
  data: Data,
  children: [
    {
      slug: "articles",
      data: Data,
      children: [
        {
          slug: "first-article",
          data: Data,
        },
        {
          slug: "second-article",
          children: [
            {
              slug: "chapter-1",
              data: Data,
            },
            {
              slug: "chapter-2",
              data: Data,
            },
          ],
        },
      ],
    },
  ];
}
```

- The `data` property contains the page data object. So you can access to any
  page variable like `data.title` or `data.url`.
- The item with the slug `second-article` doesn't have the `data` value because
  there isn't any page with the url `/articles/second-article/`. Note that there
  are pages inside this url (`/articles/second-page/chapter-1/` and
  `/articles/second-page/chapter-2/`) that do have the `data` value.

### Breadcrumb

The `nav.breadcrumb()` function returns all parent pages of a specific page. For
example:

```ts
const breadcrumb = nav.breadcrumb("/articles/second-article/chapter-2/");

console.log(breadcrumb);

[
  {
    slug: "chapter-2",
    data: Data,
  },
  {
    slug: "second-article",
    children: ...
  },
  {
      slug: "articles",
      data: Data,
      children: ...
  },
  {
    slug: "",
    data: Data,
    children: ...
  },
]
```

You can see an example of the nav plugin in the
[Simple Wiki theme](https://lumeland.github.io/theme-simple-wiki/posts/firstpost/).

- The lateral menu is built with `nav.menu()`
  ([see the code](https://github.com/lumeland/theme-simple-wiki/blob/main/src/_includes/templates/menu.njk))
- The breadcrumb above the title is built with `nav.breadcrumb()`
  ([see the code](https://github.com/lumeland/theme-simple-wiki/blob/main/src/_includes/templates/breadcrumb.njk))

See the [plugin documentation](https://lume.land/plugins/nav/) for more details.

## New `copyRemainingFiles` function

Until now, the only way to copy static files was using the `site.copy()`
function, that allows to specify a file/folder or an array of extensions. This
works fine if you know in advance all files that must be copied, because they
are in a specific folder like `/static` or have a known extension (`.jpg`,
`.png`, etc).

But it's not practical when your static files are distributed in random folders
or can have any extension. For example, imagine you have a website with
articles, and every article is stored in it's folder that can contain static
files of any extension:

```
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

The `site.copy()` function it's not very helpful because if we copy the
`/articles/` folder, the `index.md` files won't be processed (they will be
treated as static files). We can select the files by extension with
`site.copy([".jpg", ".pdf", ".gif", ".mp4", ".zip"])` but every time a new
extension is uploaded, we have to remember to include it in the `_config` file.

The `copyRemainingFiles()` basically says: **when you find a file and don't know
what to do, just copy it.** You can include a function to filter which files
will be copied. For example:

```ts
site.copyRemainingFiles((path: string) => path.startsWith("/articles/"));
```

Now, only the remaining files inside the `/articles/` folder will be copied.

More info
[in the documentation site](https://lume.land/docs/configuration/copy-static-files/#copy-remaining-files).

## `page.data.children` property

Let's say you have a blog and want to list all posts with their content. It's
possible with this code:

```njk
{% for post in search.pages("type=post") %}
  <h1>{{ post.data.title }}</h1>
  {{ post.data.content | md | safe }}
{% endfor %}
```

If the post are written in Markdown, the variable `post.data.content` of the
page has the unrendered markdown code, so you have to use the `md` filter to
render it to HTML. This has the drawback of every post need to be rendered
twice, one to build the post page and other to build this list of posts.

If your posts are in `MDX` this is even worse, because there's no filter to
convert `mdx` code to HTML. It's possible to get the rendered content of the
page from `post.content` but it includes not only the HTML of the post but also
the layout used in this page.

As of version 1.16, Lume will save the rendered content into the `children`
property, so you can use it in other pages in this way:

```njk
{% for post in search.pages("type=post") %}
  <h1>{{ post.data.title }}</h1>
  {{ post.data.children | safe }}
{% endfor %}
```

The content will be rendered only once and no filter is needed.

There are more interesting things in Lume v1.16.0. See the
[CHANGELOG.md file](https://github.com/lumeland/lume/blob/v1.16.0/CHANGELOG.md)
for the full list of changes.
