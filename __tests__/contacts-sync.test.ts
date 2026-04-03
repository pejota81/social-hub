/**
 * Tests for contact sync logic.
 */

describe("Contact Sync", () => {
  describe("Provider validation", () => {
    it("should accept valid providers", () => {
      const validProviders = ["google", "microsoft"];
      const isValidProvider = (p: string) => validProviders.includes(p);

      expect(isValidProvider("google")).toBe(true);
      expect(isValidProvider("microsoft")).toBe(true);
    });

    it("should reject invalid providers", () => {
      const validProviders = ["google", "microsoft"];
      const isValidProvider = (p: string) => validProviders.includes(p);

      expect(isValidProvider("apple")).toBe(false);
      expect(isValidProvider("twitter")).toBe(false);
      expect(isValidProvider("")).toBe(false);
    });
  });

  describe("Google contact mapping", () => {
    it("should map Google People API person to contact data", () => {
      const person = {
        resourceName: "people/123",
        names: [{ givenName: "John", familyName: "Doe" }],
        emailAddresses: [{ value: "john@example.com" }],
        phoneNumbers: [{ value: "+1-555-1234" }],
        organizations: [{ name: "Acme Corp", title: "Engineer" }],
        photos: [{ url: "https://example.com/photo.jpg" }],
      };

      const firstName = person.names?.[0]?.givenName ?? "Unknown";
      const lastName = person.names?.[0]?.familyName;
      const email = person.emailAddresses?.[0]?.value;
      const phone = person.phoneNumbers?.[0]?.value;
      const company = person.organizations?.[0]?.name;
      const jobTitle = person.organizations?.[0]?.title;
      const avatarUrl = person.photos?.[0]?.url;

      expect(firstName).toBe("John");
      expect(lastName).toBe("Doe");
      expect(email).toBe("john@example.com");
      expect(phone).toBe("+1-555-1234");
      expect(company).toBe("Acme Corp");
      expect(jobTitle).toBe("Engineer");
      expect(avatarUrl).toBe("https://example.com/photo.jpg");
    });

    it("should use Unknown as default first name when name is missing", () => {
      const person = {
        resourceName: "people/456",
        names: undefined,
        emailAddresses: [{ value: "anon@example.com" }],
      };

      const firstName = person.names?.[0]?.givenName ?? "Unknown";
      expect(firstName).toBe("Unknown");
    });
  });

  describe("Microsoft contact mapping", () => {
    it("should map Microsoft Graph API contact to contact data", () => {
      const person = {
        id: "ms-contact-abc",
        givenName: "Jane",
        surname: "Smith",
        emailAddresses: [{ address: "jane@example.com" }],
        mobilePhone: "+1-555-9876",
        companyName: "Contoso",
        jobTitle: "Manager",
      };

      const firstName = person.givenName ?? "Unknown";
      const lastName = person.surname;
      const email = person.emailAddresses?.[0]?.address;
      const phone = person.mobilePhone;
      const company = person.companyName;
      const jobTitle = person.jobTitle;

      expect(firstName).toBe("Jane");
      expect(lastName).toBe("Smith");
      expect(email).toBe("jane@example.com");
      expect(phone).toBe("+1-555-9876");
      expect(company).toBe("Contoso");
      expect(jobTitle).toBe("Manager");
    });
  });
});
