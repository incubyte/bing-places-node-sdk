import { Utils } from "../core/utils";

describe("Utils", () => {
  describe("isEmailValid", () => {
    test("should return true if email is valid", () => {
      const validEmail = "test-user@gmail.com";
      expect(Utils.isEmailValid(validEmail)).toBe(true);
    });

    test("should return false if email is invalid", () => {
      const invalidEmail = "test-user@.com";
      expect(Utils.isEmailValid(invalidEmail)).toBe(false);
    });

    test("should return false if email is empty", () => {
      const emptyEmail = "";
      expect(Utils.isEmailValid(emptyEmail)).toBe(false);
    });
  });
});
