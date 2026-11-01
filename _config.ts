import lume from "@lumeland/lume";
import theme from "@lumeland/theme-simple-blog";

import "prismjs/components/prism-markdown";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-liquid";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-jsx";

const site = lume({
  location: new URL("https://lume.land/blog/"),
});

site.use(theme());

export default site;

