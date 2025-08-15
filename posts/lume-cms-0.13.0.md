---
title: Lume CMS v0.13
url: /lume-cms-0.13/
draft: true
tags:
  - LumeCMS
  - Releases
comments: {}
author: Óscar Otero
date: '2025-08-07T00:00:00.000Z'
---
It's been a while (one year and a half!) since [LumeCMS was announced](/posts/lume-cms/) as an alternative to other existing CMS to edit the content of web sites.

<!-- more -->

During this time, the project was improved in many ways: more field formats, more customization options, light/dark mode, etc. At the same time, it's still a demonstrations that it's possible in 2025 to build a web apps using simple tools and standard practices. Technically, LumeCMS uses Web components, HTTP imports and very few dependencies. In fact, there isn't a "build" process for frontend. Except Codemirror (the dependency used to create the code and markdown editors), everything else is simple JavaScript and CSS code, served as is, without any compilation or bundler step. This makes the development a lot leaner and easier to extends and customize by anyone.

But, like many projects in their earlier phases, LumeCMS was a bit "tricky" to run. It was created as an framework-agnostic solution, but in practice it was difficult to setup for other frameworks than Lume. The version 0.13 has received a lot of changes in order to address this issue among others. Some of these changes are BREAKING CHANGES (hopefully they are only a few). And even it's still a development version (the version starts with `0` yet), I think it's an important step towards the future v1.0 version.

## New router

Until now, LumeCMS used Hono as router and middleware runner. Although Hono is a very powerful and popular package, I found it a bit complicated to work with. The way to pass data (or contexts) to routers and middlewares, the rendering system or the use of the custom class `HonoRequest` for the request instead of the standard `Request` (that is also available but more hidden) made me spend more time trying to figure out how to do something in "Hono way" than just doing it. In addition to that, it's becoming a full-featured framework with even a client-side JSX library.

That's why [Galo was created](https://github.com/oscarotero/galo). It's a fast and minimalist router, that embrace web standards and simplicity without sacrificing flexibility. The change from a framework approach to a library like this made LumeCMS much easier to embed in any application running Deno. In fact, LumeCMS can run now as a simple middleware of your application without any side effect or interfere with your existing code.

## Document types

LumeCMS was created assuming that all data can be stored in an object. Let's see this example:

```js
cms.collection({
  name: "notes",
  storage: "src:notes/*.json",
  fields: [
    "title: text",
    "text: textarea",
  ]
})
```

This works great if you want to store every note in a JSON file in the `notes/` directory. The stored notes have a structure like this:

```json
{
  "title": "Note title",
  "text": "This is the note"
}
```

If you want to store all notes in a single JSON file, you can use an `object-list` field to store an array of objects:

```js
cms.document({
  name: "notes",
  storage: "src:notes.json",
  fields: [
    {
      name: "notes",
      type: "object-list",
      fields: [
        "title: text",
        "text: textarea",
      ]
    }
  ]
})
```

This configuration produces the following data structure:

```json
{
  "notes": [
    {
      "title": "First note",
      "text": "Text of the first note"
    },
    {
      "title": "Second note",
      "text": "Text of the second note"
    }
  ]
}
```

As you can see, the root of the data is still an object with the `notes` property to hold the array of notes. But what we really want is to store the array of notes **as the root element**. Until now, the solution was to change the name of the root value from `notes` to `[]`:

```js
cms.document({
  name: "notes",
  storage: "src:notes.json",
  fields: [
    {
      name: "[]",
      type: "object-list",
      fields: [
        "title: text",
        "text: textarea",
      ]
    }
  ]
})
```

LumeCMS detected the special name "[]" as an instruction to ignore the element and store directly its content. This allows to store the data as an array:

```json
[
  {
    "title": "First note",
    "text": "Text of the first note"
  },
  {
    "title": "Second note",
    "text": "Text of the second note"
  }
]
```

The problem with this solution is it's bit hacky, verbose and not very flexible. That's why in the version 0.13 this feature was replaced with the new `type` option:

```js
cms.document({
  name: "notes",
  storage: "src:notes.json",
  type: "object-list",
  fields: [
    "title: text",
    "text: textarea",
  ]
})
```

As you may guess, this option configures the field type used to store the root data. If it's not defined, the default value is `object` but other available values are `object-list` (to store an array of objects) and `choose` (to allow to choose one structure among a list of options). More types can be added in next versions.

## New `previewUrl` and `sourcePath` options

One of the great features of LumeCMS is the ability to preview the changes while editing the data. To provide this, we need two things:

- A way to know the URL generated by a file. For example, if we know that the file `/posts/hello-world.md` produces the URL `/posts/hello-world/` we can display this URL in the preview panel when the file is being edited.
- A way to know the source file of a URL. If we know that the URL `/posts/hello-world/` is generated by `/posts/hello-world.md`, we can create a "Edit this page" link to go directly to the edit form.

Until now, the way to get this info was a bit obscure and undocumented. In version 0.13, this is fully configurable which makes the CMS easier to adapt for other static site generators:

```js
const cms = lumeCMS({
  previewUrl(path: string, content: Lume.CMS.Content, changed: boolean) {
    // Return the URL generated by this file
  },
  sourcePath(url: string, content: Lume.CMS.Content) {
    // Return the file path that generates this URL
  }
});
```

The `previewUrl` is also customizable at document or collection level, useful if you're editing a file that doesn't directly produce a URL but can affect to it (like a `_data` file):

```js
cms.document({
  name: "Common data",
  storage: "src:_data.yml",
  previewUrl: () => "/", // preview the homepage
  fields: [
    "title: text",
    "description: textarea",
  ]
})
```

## User-level permissions

In previous versions, you can configure the permissions to create, edit, rename or delete documents globally. For example, let's say we have a collection of countries that we don't want to remove or create new ones, just edit them:

```js
cms.collection({
  name: "countries",
  storage: "src:countries/*.json",
  fields: [
    "name: text",
    "description: textarea",
  ],
  create: false,
  delete: false,
  rename: false
})
```

With this configuration, all users can edit the countries, but cannot create, delete or rename files. In version 0.13.0, we can override this configuration for some users:

```js
cms.auth({
  user1: {
    password: "password1",
    name: "Admin",
    permissions: {
      "countries": {
        create: true,
        delete: true,
        rename: true,
      }
    }
  },
  user2: "password2"
})
```
Previously, we only was able to configure a name and a password per user. Now we can use an object to include more options. In this example, the "user1" has a password, the visible name (Admin) and some special permissions that override the global permissions assigned to documents and collections: this user can create, rename and delete files of the countries collection, unlike other users like "user2". For backward compatibility, it still possible to use a string the value to simply configure a password.
