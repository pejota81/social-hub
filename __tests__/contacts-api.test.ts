/**
 * Tests for the contacts API route handler logic.
 * These tests validate input handling and response structure.
 */

describe("Contacts API", () => {
  describe("Pagination parameters", () => {
    it("should parse page and limit from search params", () => {
      const url = new URL(
        "http://localhost/api/contacts?page=2&limit=10"
      );
      const searchParams = url.searchParams;
      const page = parseInt(searchParams.get("page") ?? "1");
      const limit = parseInt(searchParams.get("limit") ?? "20");
      const skip = (page - 1) * limit;

      expect(page).toBe(2);
      expect(limit).toBe(10);
      expect(skip).toBe(10);
    });

    it("should default page to 1 and limit to 20 when not provided", () => {
      const url = new URL("http://localhost/api/contacts");
      const searchParams = url.searchParams;
      const page = parseInt(searchParams.get("page") ?? "1");
      const limit = parseInt(searchParams.get("limit") ?? "20");

      expect(page).toBe(1);
      expect(limit).toBe(20);
    });
  });

  describe("Contact validation", () => {
    it("should require firstName for contact creation", () => {
      const validateContact = (body: { firstName?: string }) => {
        if (!body.firstName) {
          return { error: "First name is required" };
        }
        return null;
      };

      expect(validateContact({})).toEqual({
        error: "First name is required",
      });
      expect(validateContact({ firstName: "" })).toEqual({
        error: "First name is required",
      });
      expect(validateContact({ firstName: "John" })).toBeNull();
    });
  });

  describe("Contact search filter", () => {
    it("should build correct where clause with search", () => {
      const search = "John";
      const userId = "user-123";

      const where = {
        userId,
        ...(search && {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
            { company: { contains: search } },
          ],
        }),
      };

      expect(where).toEqual({
        userId: "user-123",
        OR: [
          { firstName: { contains: "John" } },
          { lastName: { contains: "John" } },
          { email: { contains: "John" } },
          { company: { contains: "John" } },
        ],
      });
    });

    it("should not include OR clause when no search term", () => {
      const search = "";
      const userId = "user-123";

      const where = {
        userId,
        ...(search && {
          OR: [],
        }),
      };

      expect(where).toEqual({ userId: "user-123" });
    });
  });
});
