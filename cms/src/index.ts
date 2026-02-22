export default {
  register(/* { strapi } */) {},
  async bootstrap({ strapi }) {
    // Create a full-access API token if one doesn't exist
    const tokenService = strapi.service("admin::api-token");

    const existing = await tokenService.getBy({ name: "seed-script" });
    if (!existing) {
      const token = await tokenService.create({
        name: "seed-script",
        description: "Full access token for seed script",
        type: "full-access",
        lifespan: null,
      });
      strapi.log.warn("============================================================");
      strapi.log.warn("SEED API TOKEN CREATED (save this, shown only once):");
      strapi.log.warn(`  ${token.accessKey}`);
      strapi.log.warn("============================================================");
    } else {
      strapi.log.info("seed-script API token already exists.");
    }
  },
};
