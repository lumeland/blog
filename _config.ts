import lume from "lume/mod.ts";
import blog from "https://deno.land/x/lume_theme_simple_blog@v0.2.0/mod.ts";

const site = lume();

site.use(blog());

export default site;
