import lumeCMS from "lume/deps/cms.ts";

const cms = lumeCMS({
  site: {
    name: "Lume blog",
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
