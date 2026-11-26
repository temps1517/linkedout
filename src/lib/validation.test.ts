import { describe, expect, it } from "vitest";
import { postSchema, profileSchema, registerSchema } from "./validation";

describe("validation", () => {
  it("validates registration", () => {
    expect(
      registerSchema.safeParse({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "Password123!",
        role: "STUDENT",
      }).success,
    ).toBe(true);

    expect(
      registerSchema.safeParse({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "short",
      }).success,
    ).toBe(false);
  });

  it("applies profile defaults", () => {
    const profile = profileSchema.parse({ name: "Ada Lovelace" });
    expect(profile.visibility).toBe("PUBLIC");
    expect(profile.openToOpportunities).toBe(false);
  });

  it("accepts multiple media ids for posts", () => {
    const post = postSchema.parse({
      body: "A useful update",
      mediaIds: ["asset1", "asset2"],
    });
    expect(post.mediaIds).toEqual(["asset1", "asset2"]);
    expect(post.type).toBe("UPDATE");
  });
});
