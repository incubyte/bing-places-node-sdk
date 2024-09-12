import { Constants } from "../core/constants";

describe("Constants Sanity Checks", () => {
  test("Contains sandbox endpoint.", () => {
    expect(Constants.Endpoints.Sandbox).toBeTruthy();
  });

  test("Contains production endpoint.", () => {
    expect(Constants.Endpoints.Production).toBeTruthy();
  });
});
