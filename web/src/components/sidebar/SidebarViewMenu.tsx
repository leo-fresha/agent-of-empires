import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Layers } from "lucide-react";
import type { PluginSortSpec } from "../../lib/pluginUi";
import { GROUP_BY_LABEL, SORT_LABEL, type SidebarGroupBy, type SidebarSort } from "../../lib/sidebarView";
import { Tooltip } from "../Tooltip";
import { useOutsideDismiss } from "../useOutsideDismiss";
import { TOOLBAR_BUTTON, TOOLBAR_TINT } from "./styles";

type PluginSortRef = { pluginId: string; entryId: string };

const GROUPINGS: readonly SidebarGroupBy[] = ["project", "group"];
const SORTS: readonly SidebarSort[] = ["custom", "newest", "name"];

const ITEM =
  "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left cursor-pointer hover:bg-surface-700/60 focus-visible:outline-none focus-visible:bg-surface-700/60 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pt-1.5 pb-1 text-[11px] font-mono uppercase tracking-widest text-text-dim" aria-hidden>
      {children}
    </div>
  );
}

const Separator = () => <div className="my-1 border-t border-surface-700/50" role="separator" />;

/**
 * The sidebar's one view control: the grouping and the sort every Client shares, and this browser's plugin
 * sorts. The trigger reads "<Grouping> · <Sort>".
 */
export function SidebarViewMenu({
  compact,
  groupBy,
  sort,
  onGroupByChange,
  onSortChange,
  pluginSorts,
  pluginSortRef,
  onPluginSortChange,
  locked,
  opensLeft = false,
}: {
  compact: boolean;
  groupBy: SidebarGroupBy;
  sort: SidebarSort;
  onGroupByChange: (groupBy: SidebarGroupBy) => void;
  onSortChange: (sort: SidebarSort) => void;
  pluginSorts: PluginSortSpec[];
  pluginSortRef: PluginSortRef | null;
  onPluginSortChange: (ref: PluginSortRef) => void;
  /** The shared view is the Daemon's, which a read-only viewer or a CityHall client cannot change. */
  locked?: boolean;
  /** The rail on the right edge opens the menu toward the content. */
  opensLeft?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Restore focus only when it has not moved outside the menu.
  const restoreFocus = useRef(false);

  useOutsideDismiss(open, [ref], () => {
    restoreFocus.current = document.activeElement != null && !!menuRef.current?.contains(document.activeElement);
    setOpen(false);
  });

  const activePlugin = pluginSortRef
    ? pluginSorts.find((s) => s.pluginId === pluginSortRef.pluginId && s.entryId === pluginSortRef.entryId)
    : undefined;
  const groupLabel = GROUP_BY_LABEL[groupBy];
  const sortLabel = activePlugin?.label ?? SORT_LABEL[sort];
  const label = `${groupLabel} · ${sortLabel}`;

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);

  // Focus the checked grouping so the menu receives keyboard navigation.
  useLayoutEffect(() => {
    if (!open) return;
    const checked = menuRef.current?.querySelector<HTMLButtonElement>("[aria-checked='true']:not(:disabled)");
    (checked ?? items()[0])?.focus({ preventScroll: true });
  }, [open]);

  useLayoutEffect(() => {
    if (open || !restoreFocus.current) return;
    restoreFocus.current = false;
    triggerRef.current?.focus({ preventScroll: true });
  }, [open]);

  const close = () => {
    restoreFocus.current = true;
    setOpen(false);
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const list = items();
    const at = list.findIndex((el) => el === document.activeElement);
    const focus = (i: number) => list[((i % list.length) + list.length) % list.length]?.focus({ preventScroll: true });
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focus(at + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focus(at - 1);
        break;
      case "Home":
        e.preventDefault();
        focus(0);
        break;
      case "End":
        e.preventDefault();
        focus(list.length - 1);
        break;
    }
  };

  const trigger = (content: ReactNode) => (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label={`Sidebar view: ${label}`}
      title={compact ? undefined : label}
      data-testid="sidebar-view-toggle"
      data-group-by={groupBy}
      data-sort={activePlugin ? "plugin" : sort}
      className={
        compact
          ? `${TOOLBAR_BUTTON} ${TOOLBAR_TINT(open)}`
          : "max-w-full h-8 -ml-1.5 px-1.5 flex items-center gap-1 rounded-md cursor-pointer text-sm text-text-secondary hover:text-text-primary hover:bg-surface-700/40 transition-colors"
      }
    >
      {content}
    </button>
  );

  const radio = (
    testId: string,
    checked: boolean,
    text: ReactNode,
    onPick: () => void,
    { disabled = false, hint }: { disabled?: boolean; hint?: string } = {},
  ) => (
    <button
      key={testId}
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      // Roving focus: the menu owns the arrows, so items are not Tab stops.
      tabIndex={-1}
      disabled={disabled}
      data-testid={testId}
      onClick={() => {
        close();
        if (!checked) onPick();
      }}
      className={`${ITEM} ${checked ? "text-brand-500" : "text-text-secondary hover:text-text-primary"}`}
    >
      <span className="flex-1 min-w-0 truncate">{text}</span>
      {hint && <span className="shrink-0 text-[11px] text-text-dim">{hint}</span>}
      <Check className={`h-3.5 w-3.5 shrink-0 ${checked ? "" : "invisible"}`} aria-hidden />
    </button>
  );

  return (
    <div
      ref={ref}
      className={`relative ${compact ? "" : "flex-1 min-w-0"}`}
      // Tabbing out closes the menu; moving between its own children is not a dismiss.
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (next && !ref.current?.contains(next)) setOpen(false);
      }}
    >
      {compact ? (
        // The rail has no room for the label, so it moves to a tooltip.
        <Tooltip text={`View: ${label}`} open={open ? false : undefined}>
          {trigger(<Layers className="h-3.5 w-3.5" />)}
        </Tooltip>
      ) : (
        trigger(
          <>
            {/* The sort gives way first, so the grouping stays readable in a narrow sidebar. */}
            <span className="min-w-0 truncate">{groupLabel}</span>
            <span className="min-w-0 truncate shrink-[1000] text-text-dim">· {sortLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-dim" aria-hidden />
          </>,
        )
      )}

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Sidebar view"
          data-testid="sidebar-view-menu"
          onKeyDown={onMenuKeyDown}
          className={`absolute ${opensLeft ? "right-0" : "left-0"} top-full mt-1 w-[232px] max-w-[calc(100vw-2rem)] bg-surface-800 border border-surface-700/50 rounded-md shadow-xl py-1 z-50 animate-fade-in`}
        >
          <SectionLabel>Group by</SectionLabel>
          <div role="group" aria-label="Group by">
            {GROUPINGS.map((value) =>
              radio(
                `sidebar-view-group-${value}`,
                value === groupBy,
                GROUP_BY_LABEL[value],
                () => onGroupByChange(value),
                { disabled: locked },
              ),
            )}
          </div>
          <Separator />
          <SectionLabel>Sort</SectionLabel>
          <div role="group" aria-label="Sort">
            {SORTS.map((value) =>
              radio(
                `sidebar-view-sort-${value}`,
                !activePlugin && value === sort,
                SORT_LABEL[value],
                () => onSortChange(value),
                {
                  // Picking the shared sort back only drops this browser's plugin sort, which writes nothing.
                  disabled: locked && !(activePlugin && value === sort),
                  hint: value === "custom" ? "drag to reorder" : undefined,
                },
              ),
            )}
          </div>
          {pluginSorts.length > 0 && (
            <>
              <Separator />
              <SectionLabel>Plugin sorts · this browser only</SectionLabel>
              <div role="group" aria-label="Plugin sorts, this browser only">
                {pluginSorts.map((spec) =>
                  radio(
                    `sidebar-sort-option-plugin-${spec.entryId}`,
                    activePlugin?.pluginId === spec.pluginId && activePlugin.entryId === spec.entryId,
                    spec.label,
                    () => onPluginSortChange({ pluginId: spec.pluginId, entryId: spec.entryId }),
                  ),
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
