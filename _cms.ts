import cms from "blog/_cms.ts";

cms.auth({
  admin: "admin",
});

cms.git();

export default cms;
