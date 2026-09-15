import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HelpPage } from "./HelpPage";

describe("HelpPage", () => {
  it("explains that public ranking stays off and does not mention live location", async () => {
    const user = userEvent.setup();
    render(<HelpPage />);

    expect(screen.queryByText("Is my location on the map?")).toBeNull();

    await user.click(screen.getByText("Why is there no ranking?"));
    expect(
      screen.getByText(/Public ranking stays off on purpose/i),
    ).toBeInTheDocument();
  });
});
