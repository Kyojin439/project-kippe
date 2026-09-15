import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RateSheet } from "../components/RateSheet";

describe("RateSheet", () => {
  it("does not submit a downvote without a reason", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => ({ ok: true as const }));
    render(
      <RateSheet
        machineName="Test kiosk"
        onCancel={() => undefined}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Downvote" }));
    expect(screen.getByRole("button", { name: "Submit rating" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Submit rating" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a downvote with reason and optional note", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => ({ ok: true as const }));
    render(
      <RateSheet
        machineName="Test kiosk"
        onCancel={() => undefined}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Downvote" }));
    await user.selectOptions(screen.getByRole("combobox"), "wrong_location");
    await user.type(
      screen.getByPlaceholderText("Independent remark for moderators"),
      "No machine here",
    );
    await user.click(screen.getByRole("button", { name: "Submit rating" }));
    expect(onSubmit).toHaveBeenCalledWith({
      polarity: "down",
      reason: "wrong_location",
      note: "No machine here",
    });
  });
});
