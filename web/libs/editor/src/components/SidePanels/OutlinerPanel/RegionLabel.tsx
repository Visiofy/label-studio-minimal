import { observer } from "mobx-react";
import { Block, Elem } from "../../../utils/bem";

export type RegionLabelProps = {
  item: any;
};
export const RegionLabel = observer(({ item }: RegionLabelProps) => {
  const { type } = item ?? {};
  if (!type) {
    return "No Label";
  }
  if (type.includes("label")) {
    return item.value;
  }
  if (type.includes("region") || type.includes("range")) {
    const labelsInResults = item.labelings.map((result: any) => result.selectedLabels || []);

    const allLabels: any[] = [].concat(...labelsInResults);

    // Rimuovi i duplicati basandosi sull'id della label
    const labels = allLabels.filter((label, index, self) =>
      index === self.findIndex((l) => l.id === label.id)
    );

    return (
      <Block name="labels-list">
        {labels.map((label, index) => {
          const color = label.background || "#000000";

          return [
            index ? ", " : null,
            <Elem key={label.id} style={{ color }}>
              {label.value || "No label"}
            </Elem>,
          ];
        })}
      </Block>
    );
  }
  if (type.includes("tool")) {
    return item.value;
  }
});
