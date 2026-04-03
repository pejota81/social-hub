/**
 * Tests for profile API route handler logic.
 */

describe("Profile API", () => {
  describe("Profile update filtering", () => {
    it("should only include defined fields in update data", () => {
      const buildUpdateData = (body: {
        name?: string;
        bio?: string;
        phone?: string;
        location?: string;
      }) => ({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.location !== undefined && { location: body.location }),
      });

      expect(buildUpdateData({ name: "Alice" })).toEqual({ name: "Alice" });
      expect(buildUpdateData({ bio: "Dev" })).toEqual({ bio: "Dev" });
      expect(
        buildUpdateData({ name: "Alice", location: "NYC" })
      ).toEqual({ name: "Alice", location: "NYC" });
      expect(buildUpdateData({})).toEqual({});
    });

    it("should allow clearing fields with empty string", () => {
      const buildUpdateData = (body: { bio?: string }) => ({
        ...(body.bio !== undefined && { bio: body.bio }),
      });

      expect(buildUpdateData({ bio: "" })).toEqual({ bio: "" });
    });
  });
});
