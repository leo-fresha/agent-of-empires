// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";

import { createRef } from "react";
import { ContextMenu } from "../ContextMenu";
import { SidebarViewMenu } from "../sidebar/SidebarViewMenu";
import { useSidebarSelection } from "../sidebar/useSidebarSelection";
import { makeSession, makeWorkspace } from "./fixtures";
import { useKeyboardShortcuts, type ShortcutActions } from "../../hooks/useKeyboardShortcuts";

function setup() {
  render(
    <SidebarViewMenu
      compact={false}
      groupBy="project"
      sort="custom"
      onGroupByChange={vi.fn()}
      onSortChange={vi.fn()}
      onResetCustomOrder={vi.fn()}
      pluginSorts={[]}
      pluginSortRef={null}
      onPluginSortChange={vi.fn()}
    />,
  );
}
const trigger = () => screen.getByTestId("sidebar-view-toggle");
const menu = () => screen.queryByTestId("sidebar-view-menu");

afterEach(cleanup);

describe("SidebarViewMenu", () => {
  it("closes on an outside mousedown or Escape, not an inside mousedown", () => {
    setup();
    fireEvent.click(trigger());
    fireEvent.mouseDown(menu()!);
    expect(menu()).not.toBeNull();
    fireEvent.mouseDown(document.body);
    expect(menu()).toBeNull();
    fireEvent.click(trigger());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(menu()).toBeNull();
  });

  // #5345: the window listener that clears the sidebar selection on Escape ran after the view menu's dismissal.
  it("Escape that closes a popup keeps the sidebar selection; the next Escape clears it", () => {
    let closedMenu = () => false;
    // (popup, open it and return the element Escape is pressed on, whether it closed)
    const cases: [string, () => HTMLElement, () => boolean][] = [
      [
        "View",
        () => {
          setup();
          fireEvent.click(trigger());
          return screen.getByTestId("sidebar-view-sort-name");
        },
        () => menu() === null,
      ],
      // The row context menu already marks its Escape handled (ContextMenu.tsx).
      [
        "row context menu",
        () => {
          const onClose = vi.fn();
          const Menu = () => (
            <ContextMenu
              menu={{ x: 0, y: 0 }}
              menuRef={createRef<HTMLDivElement>()}
              testId="row-menu"
              onClose={onClose}
            >
              <button type="button">Rename</button>
            </ContextMenu>
          );
          render(<Menu />);
          closedMenu = () => onClose.mock.calls.length === 1;
          return screen.getByRole("button", { name: "Rename" });
        },
        () => closedMenu(),
      ],
    ];
    for (const [popup, open, closed] of cases) {
      const rows = ["a", "b", "c"].map((id) => ({
        key: id,
        workspace: makeWorkspace(id, [makeSession({ id: `s-${id}` })]),
      }));
      const { result } = renderHook(() =>
        useSidebarSelection({
          rows,
          orderedIds: ["a", "b", "c"],
          triage: {} as Parameters<typeof useSidebarSelection>[0]["triage"],
          activeId: null,
          activeSessionId: null,
          onSelect: vi.fn(),
        }),
      );
      const ctrlClick = { metaKey: false, ctrlKey: true, shiftKey: false } as React.MouseEvent;
      act(() => result.current.handleRowActivate("a", ctrlClick, null));
      act(() => result.current.handleRowActivate("b", ctrlClick, null));
      const selected = () => ["a", "b", "c"].filter((id) => result.current.isSelected(id));
      expect(selected(), popup).toEqual(["a", "b"]);
      // The global Escape shortcut still sees both presses.
      const onEscape = vi.fn();
      renderHook(() => useKeyboardShortcuts(() => ({ onEscape }) as unknown as ShortcutActions));

      fireEvent.keyDown(open(), { key: "Escape" });
      expect(closed(), popup).toBe(true);
      expect(selected(), popup).toEqual(["a", "b"]);
      expect(onEscape, popup).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(document.body, { key: "Escape" });
      expect(selected(), popup).toEqual([]);
      expect(onEscape, popup).toHaveBeenCalledTimes(2);
      cleanup();
    }
  });
});
