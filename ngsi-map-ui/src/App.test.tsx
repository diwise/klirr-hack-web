import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders dashboard header", () => {
    render(<App />);
    expect(screen.getByText("NGSI-LD Geo Monitor")).toBeInTheDocument();
  });
});
