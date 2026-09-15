import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HelpPage } from "./HelpPage";

describe("HelpPage", () => {
  it("explains that your own location is shown and ranking stays off", async () => {
    const user = userEvent.setup();
    render(<HelpPage />);

    await user.click(screen.getByText("Is my location on the map?"));
    expect(
      screen.getByText(/Only you can see it/i),
    ).toBeInTheDocument();

    await user.click(screen.getByText("Why is there no ranking?"));
    expect(
      screen.getByText(/Public ranking stays off on purpose/i),
    ).toBeInTheDocument();
  });
});
