import lume from "lume/mod.ts";
import basePath from "lume/plugins/base_path.ts";
import blog from "https://deno.land/x/lume_theme_simple_blog@v0.2.0/mod.ts";

export default lume({ location: new URL("https://lume.com/blog/") })
  .use(blog())
  .use(basePath());
