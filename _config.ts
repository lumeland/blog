import lume from "lume/mod.ts";
import basePath from "lume/plugins/base_path.ts";
import blog from "https://deno.land/x/lume_theme_simple_blog@v0.7.2/mod.ts";

import "npm:prismjs@1.29.0/components/prism-markdown.js";
import "npm:prismjs@1.29.0/components/prism-yaml.js";
import "npm:prismjs@1.29.0/components/prism-markup-templating.js";
import "npm:prismjs@1.29.0/components/prism-liquid.js";
import "npm:prismjs@1.29.0/components/prism-typescript.js";
import "npm:prismjs@1.29.0/components/prism-json.js";

export default lume({ location: new URL("https://lume.land/blog/") })
  .use(blog())
  .use(basePath());
