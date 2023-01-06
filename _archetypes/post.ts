export default function (title: string) {
  const slug = title.replace(/\s+/g, "-").toLowerCase();
  return {
    path: `posts/${slug}.md`,
    content: {
      title,
      date: new Date(),
      author: "Óscar Otero",
      draft: true,
      tags: ["Releases"],
    },
  };
}
