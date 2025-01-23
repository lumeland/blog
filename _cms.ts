import cms from "blog/_cms.ts";

cms.git();

cms.auth({
  admin: "admin",
})

export default cms;
