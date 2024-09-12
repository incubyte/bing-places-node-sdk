import { helloWorld } from "../index";

describe("Example Tests", () => {
  test("example test", () => {
    expect(true).toBe(true);
  });

  test("hello world", () => {
    expect(helloWorld()).toBe("Hello, world!");
  });
});
