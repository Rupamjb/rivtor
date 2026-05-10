import { render, screen } from "@testing-library/react";

import Workspace from "@/pages/Workspace";


describe("Workspace shell", () => {
  it("shows three-panel founder workspace navigation", () => {
    render(<Workspace />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Company Brain")).toBeInTheDocument();
    expect(screen.getByText("retrieving memory...", { exact: false })).toBeInTheDocument();
  });
});
