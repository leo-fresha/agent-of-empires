import { ListFilter } from "lucide-react";
import { toneTextClass, type PluginFacetSpec, type PluginSortSpec } from "../../lib/pluginUi";
import type { SidebarGroupBy, SidebarSort } from "../../lib/sidebarView";
import { OFFLINE_TITLE } from "../../lib/connectionState";
import { Tooltip } from "../Tooltip";
import { DISABLED_ICON_BUTTON, TOOLBAR_BUTTON, TOOLBAR_TINT } from "./styles";
import { StrokeIcon } from "../icons";
import { SidebarLegend } from "./SidebarLegend";
import { SidebarViewMenu } from "./SidebarViewMenu";

type PluginSortRef = { pluginId: string; entryId: string };

export function SidebarToolbar({
  compact,
  groupBy,
  sort,
  onGroupByChange,
  onSortChange,
  pluginSorts,
  pluginSortRef,
  onPluginSortChange,
  viewLocked,
  rightSide,
  hasFacets,
  facetsActive,
  facetOpen,
  onToggleFacets,
  filterOpen,
  filterActive,
  onToggleFilter,
  offline,
  onNew,
  onClose,
}: {
  compact: boolean;
  groupBy: SidebarGroupBy;
  sort: SidebarSort;
  onGroupByChange: (groupBy: SidebarGroupBy) => void;
  onSortChange: (sort: SidebarSort) => void;
  pluginSorts: PluginSortSpec[];
  pluginSortRef: PluginSortRef | null;
  onPluginSortChange: (ref: PluginSortRef) => void;
  viewLocked?: boolean;
  rightSide?: boolean;
  hasFacets: boolean;
  facetsActive: boolean;
  facetOpen: boolean;
  onToggleFacets: () => void;
  filterOpen: boolean;
  /** A filter applies while its panel is closed, such as Needs you. */
  filterActive: boolean;
  onToggleFilter: () => void;
  offline: boolean;
  onNew: () => void;
  onClose: () => void;
}) {
  const view = (
    <SidebarViewMenu
      compact={compact}
      groupBy={groupBy}
      sort={sort}
      onGroupByChange={onGroupByChange}
      onSortChange={onSortChange}
      pluginSorts={pluginSorts}
      pluginSortRef={pluginSortRef}
      onPluginSortChange={onPluginSortChange}
      locked={viewLocked}
      opensLeft={compact && rightSide}
    />
  );
  return (
    <div className={`${compact ? "px-1" : "px-3"} pt-3 pb-1 flex items-center`}>
      {view}
      {compact ? (
        <span className="flex-1" />
      ) : (
        <>
          {hasFacets && (
            <Tooltip text="Plugin facets">
              <button
                onClick={onToggleFacets}
                aria-haspopup="true"
                aria-expanded={facetOpen}
                aria-label="Plugin facet filters"
                data-testid="sidebar-facet-toggle"
                className={`relative ${TOOLBAR_BUTTON} ${TOOLBAR_TINT(facetsActive || facetOpen)}`}
              >
                <ListFilter className="h-3.5 w-3.5" />
                {facetsActive && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-500" aria-hidden />
                )}
              </button>
            </Tooltip>
          )}
          <Tooltip text="Filter">
            <button
              onClick={onToggleFilter}
              className={`relative ${TOOLBAR_BUTTON} ${TOOLBAR_TINT(filterOpen || filterActive, filterActive ? "text-brand-500" : "text-text-secondary")}`}
              aria-label="Filter sessions"
              aria-expanded={filterOpen}
              data-testid="sidebar-filter-toggle"
            >
              <StrokeIcon size={14} strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </StrokeIcon>
            </button>
          </Tooltip>
          <Tooltip text={offline ? OFFLINE_TITLE : "New project session"}>
            <button
              onClick={onNew}
              disabled={offline}
              className={`w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-surface-800 cursor-pointer rounded-md transition-colors ${DISABLED_ICON_BUTTON}`}
              aria-label="New project session"
            >
              <StrokeIcon size={16} strokeWidth="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </StrokeIcon>
            </button>
          </Tooltip>
        </>
      )}
      <SidebarLegend />
      <button
        onClick={onClose}
        aria-label="Close sidebar"
        className="md:hidden w-8 h-8 flex items-center justify-center text-text-dim hover:text-text-secondary cursor-pointer rounded-md hover:bg-surface-800 ml-1"
      >
        &times;
      </button>
    </div>
  );
}

export function FacetPanel({
  facetSpecs,
  selectedValues,
  onToggle,
}: {
  facetSpecs: PluginFacetSpec[];
  selectedValues: (pluginId: string, entryId: string) => Set<string> | undefined;
  onToggle: (pluginId: string, entryId: string, value: string) => void;
}) {
  return (
    <div className="px-3 pb-2 flex flex-col gap-2" data-testid="sidebar-facet-panel">
      {facetSpecs.map((facet) => {
        const selected = selectedValues(facet.pluginId, facet.entryId);
        return (
          <div key={`${facet.pluginId}:${facet.entryId}`} data-plugin-id={facet.pluginId}>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-text-dim mb-1">{facet.label}</div>
            <div className="flex flex-wrap gap-1">
              {facet.options.map((opt) => {
                const on = selected?.has(opt.value) ?? false;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={on}
                    data-testid={`sidebar-facet-option-${facet.entryId}-${opt.value}`}
                    onClick={() => onToggle(facet.pluginId, facet.entryId, opt.value)}
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-mono cursor-pointer transition-colors ${
                      on
                        ? "bg-brand-500/15 text-brand-500 ring-1 ring-brand-500/40"
                        : `bg-surface-700/40 hover:bg-surface-700/70 ${toneTextClass(opt.tone)}`
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
