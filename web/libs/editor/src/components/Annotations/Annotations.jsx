import { isAlive } from "mobx-state-tree";
import { observer } from "mobx-react";
import { Component } from "react";
import { Badge, Button, Card, List, Popconfirm } from "antd";
import { Tooltip } from "@humansignal/ui";
import {
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
  StarFilled,
  StarOutlined,
  StopOutlined,
  WindowsOutlined,
} from "@ant-design/icons";

import Utils from "../../utils";
import styles from "./Annotations.module.scss";

/** @deprecated this file is not used; DraftPanel is moved to separate component */
export const DraftPanel = observer(({ item }) => {
  if (!item || !isAlive(item)) return null;

  const saved = safe(
    () =>
      item.draft && item.draftSaved
        ? ` saved ${Utils.UDate.prettyDate(item.draftSaved)}`
        : "",
    ""
  );

  if (!safe(() => item.selected, false)) {
    if (!safe(() => item.draft, false)) return null;
    return <div>draft{saved}</div>;
  }

  if (!safe(() => item.versions.result?.length, false)) {
    return <div>{saved ? `draft${saved}` : "not submitted draft"}</div>;
  }

  return (
    <div>
      <Tooltip
        alignment="top-left"
        title={safe(
          () => (item.draftSelected ? "switch to submitted result" : "switch to current draft"),
          ""
        )}
      >
        <Button
          type="link"
          onClick={safe(() => item.toggleDraft, () => {})}
          className={styles.draftbtn}
        >
          {safe(() => (item.draftSelected ? "draft" : "submitted"), "submitted")}
        </Button>
      </Tooltip>
      {saved}
    </div>
  );
});

/* ----------  helper sicuro  ---------- */
const safe = (fn, fallback = null) => {
  try {
    return fn();
  } catch (err) {
    if (err?.message?.includes("no longer part of a state tree")) {
      console.warn("[Annotations] Accesso a nodo MST distrutto bloccato.");
      return fallback;
    }
    throw err;
  }
};

const Annotation = observer(({ item, store }) => {
  if (!item || !isAlive(item)) return null;

  const removeHoney = () => (
    <Tooltip alignment="top-left" title="Unset this result as a ground truth">
      <Button
        size="small"
        type="primary"
        onClick={(ev) => {
          ev.preventDefault();
          safe(() => item.setGroundTruth(false));
        }}
      >
        <StarOutlined />
      </Button>
    </Tooltip>
  );

  const setHoney = () => {
    const title = safe(
      () => (item.ground_truth ? "Unset this result as a ground truth" : "Set this result as a ground truth"),
      ""
    );

    return (
      <Tooltip alignment="top-left" title={title}>
        <Button
          size="small"
          look="link"
          onClick={(ev) => {
            ev.preventDefault();
            safe(() => item.setGroundTruth(!item.ground_truth));
          }}
        >
          {safe(() => (item.ground_truth ? <StarFilled /> : <StarOutlined />), <StarOutlined />)}
        </Button>
      </Tooltip>
    );
  };

  const toggleVisibility = (e) => {
    e.preventDefault();
    e.stopPropagation();
    safe(() => item.toggleVisibility());
    const c = document.getElementById(`c-${safe(() => item.id)}`);
    if (c) c.style.display = safe(() => item.hidden, false) ? "none" : "unset";
  };

  const highlight = () => {
    const c = document.getElementById(`c-${safe(() => item.id)}`);
    if (c) c.classList.add("hover");
  };

  const unhighlight = () => {
    const c = document.getElementById(`c-${safe(() => item.id)}`);
    if (c) c.classList.remove("hover");
  };

  let badge = <Badge status="default" />;
  let annotationID;

  if (safe(() => item.userGenerate && !item.sentUserGenerate, false)) {
    annotationID = <span className={styles.title}>Unsaved Annotation</span>;
  } else {
    if (safe(() => item.pk, false)) {
      annotationID = <span className={styles.title}>ID {safe(() => item.pk, "-")}</span>;
    } else if (safe(() => item.id, false)) {
      annotationID = <span className={styles.title}>ID {safe(() => item.id, "-")}</span>;
    }
  }

  if (safe(() => item.userGenerate, false)) {
    badge = <Badge status="processing" />;
  }

  if (safe(() => item.userGenerate && item.sentUserGenerate, false)) {
    badge = <Badge status="success" />;
  }

  const btnsView = () => {
    const confirm = () => safe(() => item.list.deleteAnnotation(item));

    return (
      <div className={styles.buttons}>
        {safe(() => store.hasInterface("ground-truth"), false) &&
          (safe(() => item.ground_truth, false) ? removeHoney() : setHoney())}
        &nbsp;
        {safe(() => store.hasInterface("annotations:delete"), false) && (
          <Tooltip placement="topLeft" title="Delete selected annotation">
            <Popconfirm
              placement="bottomLeft"
              title={"Please confirm you want to delete this annotation"}
              onConfirm={confirm}
              okText="Delete"
              okType="danger"
              cancelText="Cancel"
            >
              <Button size="small" danger style={{ background: "transparent" }}>
                <DeleteOutlined />
              </Button>
            </Popconfirm>
          </Tooltip>
        )}
      </div>
    );
  };

  return (
    <List.Item
      key={safe(() => item.id, Math.random())}
      className={
        safe(() => item.selected, false)
          ? `${styles.annotation} ${styles.annotation_selected}`
          : styles.annotation
      }
      onClick={() => {
        if (!safe(() => item.selected, false)) safe(() => store.annotationStore.selectAnnotation(item.id));
      }}
      onMouseEnter={highlight}
      onMouseLeave={unhighlight}
    >
      <div className={styles.annotationcard}>
        <div>
          <div className={styles.title}>
            {badge}
            {annotationID}
          </div>
          {safe(() => item.pk, false) ? "Created" : "Started"}
          <i>
            {safe(() => item.createdAgo)
              ? ` ${safe(() => item.createdAgo)} ago`
              : ` ${Utils.UDate.prettyDate(safe(() => item.createdDate))}`}
          </i>
          {safe(() => item.createdBy && item.pk) ? ` by ${safe(() => item.createdBy)}` : null}
          <DraftPanel item={item} />
        </div>

        {safe(() => store.hasInterface("skip"), false) &&
          (safe(() => item.skipped || item.was_cancelled, false)) && (
            <Tooltip alignment="top-left" title="Skipped annotation">
              <StopOutlined className={styles.skipped} />
            </Tooltip>
          )}

        {safe(() => store.annotationStore.viewingAll, false) && (
          <Button size="small" type="primary" ghost onClick={toggleVisibility}>
            {safe(() => item.hidden, false) ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          </Button>
        )}

        {safe(() => item.selected, false) && btnsView()}
      </div>
    </List.Item>
  );
});

class Annotations extends Component {
  render() {
    const { store } = this.props;

    const title = (
      <div className={`${styles.title} ${styles.titlespace}`}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <h3>Annotations</h3>
        </div>

        <div style={{ marginRight: "1px" }}>
          {safe(() => store.hasInterface("annotations:add-new"), false) && (
            <Tooltip alignment="top-left" title="Create a new annotation">
              <Button
                size="small"
                onClick={(ev) => {
                  ev.preventDefault();
                  const c = safe(() => store.annotationStore.createAnnotation());
                  if (c) safe(() => store.annotationStore.selectAnnotation(c.id));
                }}
              >
                <PlusOutlined />
              </Button>
            </Tooltip>
          )}
          &nbsp;
          <Tooltip alignment="top-left" title="View all annotations">
            <Button
              size="small"
              type={safe(() => store.annotationStore.viewingAll, false) ? "primary" : ""}
              onClick={(ev) => {
                ev.preventDefault();
                safe(() => store.annotationStore.toggleViewingAllAnnotations());
              }}
            >
              <WindowsOutlined />
            </Button>
          </Tooltip>
        </div>
      </div>
    );

    const content = safe(() => store.annotationStore.annotations, [])
      .filter((c) => c && isAlive(c))
      .map((c) => <Annotation key={safe(() => c.id, Math.random())} item={c} store={store} />);

    return (
      <Card title={title} size="small" bodyStyle={{ padding: "0", paddingTop: "1px" }}>
        <List>{content.length ? content : <p>No annotations submitted yet</p>}</List>
      </Card>
    );
  }
}

export default observer(Annotations);
