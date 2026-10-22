import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vite-plus/test";
import App from "./App";

describe("App", () => {
  it("shows the initial count", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: "Count is 0" }).textContent).toBe("Count is 0");
  });

  it("increments the count when clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Count is 0" }));

    expect(screen.getByRole("button", { name: "Count is 1" }).textContent).toBe("Count is 1");
  });
});
