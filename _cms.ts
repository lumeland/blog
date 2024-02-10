import lumeCMS from "lume/deps/cms.ts";

const cms = lumeCMS({
  root: Deno.cwd() + "/probas/demo",
  site: {
    name: "My awesome blog",
    url: "https://example.com",
  },
});

cms.collection("posts", "src:posts/*.md", [
  "title: text",
  "date: date",
  "author: text",
  "draft: checkbox",
  "tags: list",
  {
    name: "comments",
    type: "object",
    label: "Comments",
    fields: [
      "src: url",
    ],
  },
  "content: markdown",
]);

cms.upload("uploads", "src:img");

export default cms;
