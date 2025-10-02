import { observer } from "mobx-react";
import { isAlive } from "mobx-state-tree";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";

const safeMobxAccess = (fn: () => any, fallback: any = null) => {
  try {
    return fn();
  } catch (error: any) {
    if (error.message && error.message.includes('no longer part of a state tree')) {
      console.warn('[SafeMobX OutlinerPanel] Attempted access to destroyed MobX object:', error.message.substring(0, 100));
      return fallback;
    }
    throw error;
  }
};

const isSafeToUse = (item: any) => {
  if (!item) return false;
  try {
    return isAlive(item);
  } catch (error) {
    return false;
  }
};
import { Block, Elem } from "../../../utils/bem";
import { PanelBase, type PanelProps } from "../PanelBase";
import { OutlinerTree } from "./OutlinerTree";
import { ViewControls } from "./ViewControls";
import "./OutlinerPanel.scss";
import { IconInfo } from "@humansignal/icons";

interface OutlinerPanelProps extends PanelProps {
  regions: any;
}

interface OutlinerTreeComponentProps {
  regions: any;
}

const OutlinerFFClasses: string[] = [];

OutlinerFFClasses.push("ff_hide_all_regions");

const OutlinerPanelComponent: FC<OutlinerPanelProps> = ({ regions, ...props }) => {
  const [group, setGroup] = useState();

  if (!regions || !isSafeToUse(regions)) {
    return (
      <Block name="outliner-panel">
        <div>Regions not available</div>
      </Block>
    );
  }

  const onOrderingChange = useCallback(
    (value) => {
      safeMobxAccess(() => regions.setSort(value));
    },
    [regions],
  );

  const onGroupingChange = useCallback(
    (value) => {
      safeMobxAccess(() => regions.setGrouping(value));
      setGroup(value);
    },
    [regions],
  );

  const onFilterChange = useCallback(
    (value) => {
      safeMobxAccess(() => regions.setFilteredRegions(value));
    },
    [regions],
  );

  useEffect(() => {
    const currentGroup = safeMobxAccess(() => regions.group);
    setGroup(currentGroup);
  }, []);

  safeMobxAccess(() => regions.setGrouping(group));

  return (
    <PanelBase {...props} name="outliner" mix={OutlinerFFClasses} title="Outliner">
      <ViewControls
        ordering={regions.sort}
        regions={regions}
        orderingDirection={regions.sortOrder}
        onOrderingChange={onOrderingChange}
        onGroupingChange={onGroupingChange}
        onFilterChange={onFilterChange}
      />
      <OutlinerTreeComponent regions={regions} />
    </PanelBase>
  );
};

const OutlinerStandAlone: FC<OutlinerPanelProps> = ({ regions }) => {
  const onOrderingChange = useCallback(
    (value) => {
      regions.setSort(value);
    },
    [regions],
  );

  const onGroupingChange = useCallback(
    (value) => {
      regions.setGrouping(value);
    },
    [regions],
  );

  const onFilterChange = useCallback(
    (value) => {
      regions.setFilteredRegions(value);
    },
    [regions],
  );

  return (
    <Block name="outliner" mix={OutlinerFFClasses}>
      <ViewControls
        ordering={regions.sort}
        regions={regions}
        orderingDirection={regions.sortOrder}
        onOrderingChange={onOrderingChange}
        onGroupingChange={onGroupingChange}
        onFilterChange={onFilterChange}
      />
      <OutlinerTreeComponent regions={regions} />
    </Block>
  );
};

const OutlinerTreeComponent: FC<OutlinerTreeComponentProps> = observer(({ regions }) => {
  const allRegionsHidden = regions?.regions?.length > 0 && regions?.filter?.length === 0;

  const hiddenRegions = useMemo(() => {
    if (!regions?.regions?.length || !regions.filter?.length) return 0;

    return regions?.regions?.length - regions?.filter?.length;
  }, [regions?.regions?.length, regions?.filter?.length]);

  return (
    <>
      {allRegionsHidden ? (
        <Block name="filters-info">
          <IconInfo width={21} height={20} />
          <Elem name="filters-title">All regions hidden</Elem>
          <Elem name="filters-description">Adjust or remove the filters to view</Elem>
        </Block>
      ) : regions?.regions?.length > 0 ? (
        <>
          <OutlinerTree
            regions={regions}
            footer={
              hiddenRegions > 0 && (
                <Block name="filters-info">
                  <IconInfo width={21} height={20} />
                  <Elem name="filters-title">
                    There {hiddenRegions === 1 ? "is" : "are"} {hiddenRegions} hidden region{hiddenRegions > 1 && "s"}
                  </Elem>
                  <Elem name="filters-description">Adjust or remove filters to view</Elem>
                </Block>
              )
            }
          />
        </>
      ) : (
        <Elem name="empty">Regions not added</Elem>
      )}
    </>
  );
});

export const OutlinerComponent = observer(OutlinerStandAlone);

export const OutlinerPanel = observer(OutlinerPanelComponent);
