import { helloWorld } from "../index";

test("example test", () => {
  expect(true).toBe(true);
});

test("hello world", () => {
  expect(helloWorld()).toBe("Hello, world!");
});
