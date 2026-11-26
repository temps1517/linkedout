import { describe, expect, it } from "vitest";
import { clamp, commaList, initials, slugify } from "./utils";

describe("utils", () => {
  it("builds initials from the first two words", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
    expect(initials("  grace hopper  ")).toBe("GH");
  });

  it("slugifies titles safely", () => {
    expect(slugify("Professional Product Engineering!")).toBe("professional-product-engineering");
  });

  it("clamps numbers", () => {
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp(105, 0, 100)).toBe(100);
    expect(clamp(55, 0, 100)).toBe(55);
  });

  it("parses comma-separated tags", () => {
    expect(commaList("next, prisma, , testing")).toEqual(["next", "prisma", "testing"]);
    expect(commaList(null)).toEqual([]);
  });
});
