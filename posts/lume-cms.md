---
title: Announcing LumeCMS
date: 2024-02-09
author: Óscar Otero
draft: true
tags:
  - LumeCMS
comments:
  src:
---

**LumeCMS** is a (yet another) CMS to manage static sites. Despite its name, it
can be used with any generator, not only Lume, thanks to it's agnostic design.
In this post I want to dig into it and explain how it works.

<!-- more -->

## Why another CMS?

There are plenty of CMS and site builders out there. But I didn't find any CMS
that really meets my needs. Some of them are propietary solutions, built for a
specific technology (mostly React components) or only work for popular
framewors. Others are great but too expensive, or limiting.

The feeling of creating a website with a local server with live-reload, where
any change made in your code editor is automatically updated in the browser
should be available also for non-developers. Some site builders allows to
"design" the website but at cost of high vendor-locking. LumeCMS try to find a
solution where the CMS is completely agnostic, but at the same time, can connect
with the generator in order to get reliable previews automatically.

## How it works

LumeCMS is divided into the following elements:

- **storage:** It's the abstraction used by LumeCMS to read and write data from
  different origins, like the file system, databases, APIs, etc.
- **documents:** A document represents a page or an entity of your site. For
  example, the home page.
- **collections:** It's a collection of documents with the same data structure.
  For example, the posts in a blog.
- **uploads:** Uploads are folders where you can upload files like images,
  videos, PDFs, etc.
- **fields:** A field represents a value type and the UI used to edit this
  value. For example, the "text" field represent a text value and display an
  `<input type="text">` in the interface.

### Configuration

LumeCMS is very similar to Lume in the way it's configured. Create a
configuration file, import LumeCMS main module, create an instance and configure
the storages, documents, collections and uploads. For example:

```js
import lumeCMS from "lume_cms/mod.ts";
import Kv from "lume_cms/src/storage/kv.ts";

const cms = lumeCMS({
  site: {
    name: "My awesome blog",
    url: "https://example.com",
  },
});

// Create a file system storage to the /src directory.
cms.storage("my_fs", "src");

// Create a Kv storage to use a Deno.Kv database
const kv = await Deno.openKv();
cms.storage("my_database", new Kv({ kv }));

// Create a document to edit the homepage (index.md file)
cms.document("homepage", "my_fs:index.md", [
  "title: text",
  "description: textarea",
  "content: markdown",
]);

// Create a collection to edit some posts
cms.collection("posts", "my_fs:posts/*.md", [
  "title: text",
  "tags: list",
  "content: markdown",
]);

// Create a collection of people and store the data in the Kv database
cms.collection("people", "my_database:people", [
  "name: text",
  "birthdate: date",
  "bio: markdown",
]);

// Configure a folder to upload files
cms.upload("my_uploads", "my_fs:uploads");

// Export the cms configuration
export default cms;
```

As you can see, the configuration is very simple. Instead of strings like
`title: text`, it's also possible to define the fields using objects, useful if
you want to configure other options like label, description or validation:

```js
{
  name: "title",
  type: "text",
  label: "Please, write a title here",
  description: "A catchy title works better. Be creative!!",
  attributes: {
    required: true,
    placeholder: "Example: 'The best blog in the world'",
  }
}
```

### Run the CMS

You can run the CMS directly in the configuration file but it's recommended to
use a different file, because it's a different responsibiliy. LumeCMS uses Hono
under the hood to manage all routes and serve static files:

```ts
import cms from "./cms_config.ts";

// Init the CMS and returns a Hono instance with the app
const app = cms.init();

// Run a local server with your CMS
Deno.serve(app.fetch);
```

Start the CMS with `deno run --unstable-kv -A run.ts` and open your browser the
URL `http://localhost:8000`. You will see the following page:

![screenshot of the cms home](../img/lumecms-home.png)

The `posts` and `people` collections, `homepage` document and `my_uploads`
upload folder are available for editing!

If you go into the Homepage, for example, you will see the fields to edit the
content:

![editing document screenshot](../img/lumecms-document.png)
