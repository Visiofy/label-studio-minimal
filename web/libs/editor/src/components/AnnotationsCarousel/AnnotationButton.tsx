import { useCallback, useEffect, useMemo, useState } from "react";
import { inject, observer } from "mobx-react";
import { isAlive } from "mobx-state-tree";
import { useCopyText } from "@humansignal/core/lib/hooks/useCopyText";
import { isDefined, userDisplayName } from "@humansignal/core/lib/utils/helpers";
import { Block, cn, Elem } from "../../utils/bem";
import {
  IconAnnotationGroundTruth,
  IconAnnotationSkipped2,
  IconDraftCreated2,
  IconDuplicate,
  IconLink,
  IconTrashRect,
  IconCommentResolved,
  IconCommentUnresolved,
  IconSparks,
  IconStar,
  IconStarOutline,
} from "@humansignal/icons";
import { Tooltip, Userpic, ToastType, useToast } from "@humansignal/ui";
import { TimeAgo } from "../../common/TimeAgo/TimeAgo";
import { useDropdown } from "../../common/Dropdown/DropdownTrigger";
import { confirm } from "../../common/Modal/Modal";
import { type ContextMenuAction, ContextMenu, ContextMenuTrigger, type MenuActionOnClick } from "../ContextMenu";
import "./AnnotationButton.scss";

interface AnnotationButtonInterface {
  entity?: any;
  capabilities?: any;
  annotationStore?: any;
  store: any;
  onAnnotationChange?: () => void;
}

const safe = (fn: () => any, fallback = null) => {
  try {
    return fn();
  } catch (err) {
    if (err?.message?.includes("no longer part of a state tree")) {
      console.warn("[AnnotationButton] Accesso a nodo MST distrutto bloccato.");
      return fallback;
    }
    throw err;
  }
};

const renderCommentIcon = (ent: any) => {
  if (!isAlive(ent)) return null;
  if (ent.unresolved_comment_count > 0) {
    return IconCommentUnresolved;
  }
  if (ent.comment_count > 0) {
    return IconCommentResolved;
  }
  return null;
};

const renderCommentTooltip = (ent: any) => {
  if (!isAlive(ent)) return "";
  if (ent.unresolved_comment_count > 0) {
    return "Unresolved Comments";
  }
  if (ent.comment_count > 0) {
    return "All Comments Resolved";
  }
  return "";
};

const injector = inject(({ store }) => {
  return {
    store,
  };
});

export const AnnotationButton = observer(
  ({ entity, capabilities, annotationStore, onAnnotationChange }: AnnotationButtonInterface) => {
    if (!isAlive(entity)) return null;

    const iconSize = 32;
    const isPrediction = safe(() => entity.type === "prediction", false);
    const username = userDisplayName(
      safe(() => entity.user) ?? {
        firstName: safe(() => entity.createdBy) || "Admin",
      },
    );
    const [isGroundTruth, setIsGroundTruth] = useState<boolean>();
    const infoIsHidden = safe(() => annotationStore.store?.hasInterface("annotations:hide-info"), false);
    let hiddenUser = null;

    if (infoIsHidden) {
      const currentUser = safe(() => annotationStore.store.user);
      const isCurrentUser = safe(() => entity.user?.id === currentUser?.id || entity.createdBy === currentUser?.email, false);
      hiddenUser = { email: isCurrentUser ? "Me" : "User" };
    }

    const CommentIcon = renderCommentIcon(entity);

    useEffect(() => {
      if (isAlive(entity)) {
        setIsGroundTruth(entity.ground_truth);
      }
    }, [entity]);

    const clickHandler = useCallback(() => {
      if (!isAlive(entity)) return;
      const { selected, id, type } = entity;

      if (!selected) {
        if (type === "prediction") {
          annotationStore.selectPrediction(id);
        } else {
          annotationStore.selectAnnotation(id);
        }
      }
    }, [entity, annotationStore]);

    const AnnotationButtonContextMenu = injector(
      observer(({ entity, capabilities, store }: AnnotationButtonInterface) => {
        if (!isAlive(entity)) return null;

        const annotationLink = useMemo(() => {
          const url = new URL(window.location.href);
          const pk = safe(() => entity.pk);
          if (pk) {
            url.searchParams.set("annotation", pk);
          }
          url.searchParams.delete("region");
          return url.toString();
        }, [entity]);

        const [copyLink] = useCopyText(annotationLink);
        const toast = useToast();
        const dropdown = useDropdown();

        const clickHandler = () => {
          onAnnotationChange?.();
          dropdown?.close();
        };

        const setGroundTruth = useCallback<MenuActionOnClick>(() => {
          safe(() => entity.setGroundTruth(!isGroundTruth));
          clickHandler();
        }, [entity, isGroundTruth]);

        const duplicateAnnotation = useCallback<MenuActionOnClick>(() => {
          const c = safe(() => annotationStore.addAnnotationFromPrediction(entity));
          if (c) {
            window.setTimeout(() => {
              safe(() => annotationStore.selectAnnotation(c.id));
              clickHandler();
            });
          }
        }, [entity, annotationStore]);

        const linkAnnotation = useCallback<MenuActionOnClick>(() => {
          copyLink();
          dropdown?.close();
          toast.show({
            message: "Annotation link copied to clipboard",
            type: ToastType.info,
          });
        }, [copyLink]);

        const deleteAnnotation = useCallback(() => {
          clickHandler();
          confirm({
            title: "Delete annotation?",
            body: (
              <>
                This will <strong>delete all existing regions</strong>. Are you sure you want to delete them?
                <br />
                This action cannot be undone.
              </>
            ),
            buttonLook: "destructive",
            okText: "Delete",
            onOk: () => {
              safe(() => entity.list.deleteAnnotation(entity));
            },
          });
        }, [entity]);

        const isPrediction = safe(() => entity.type === "prediction", false);
        const isDraft = !safe(() => entity.pk);
        const showGroundTruth = safe(() => capabilities.groundTruthEnabled && !isPrediction && !isDraft, false);
        const showDuplicateAnnotation = safe(() => capabilities.enableCreateAnnotation && !isDraft, false);

        const actions = useMemo<ContextMenuAction[]>(
          () => [
            {
              label: `${isGroundTruth ? "Unset " : "Set "} as Ground Truth`,
              onClick: setGroundTruth,
              icon: isGroundTruth ? (
                <IconStar color="#FFC53D" width={iconSize} height={iconSize} />
              ) : (
                <IconStarOutline width={iconSize} height={iconSize} />
              ),
              enabled: showGroundTruth,
            },
            {
              label: "Duplicate Annotation",
              onClick: duplicateAnnotation,
              icon: <IconDuplicate width={20} height={20} />,
              enabled: showDuplicateAnnotation,
            },
            {
              label: "Copy Annotation Link",
              onClick: linkAnnotation,
              icon: <IconLink />,
              enabled: !isDraft && safe(() => store.hasInterface("annotations:copy-link"), false),
            },
            {
              label: "Delete Annotation",
              onClick: deleteAnnotation,
              icon: <IconTrashRect />,
              separator: true,
              danger: true,
              enabled: safe(() => capabilities.enableAnnotationDelete && !isPrediction, false),
            },
          ],
          [
            entity,
            isGroundTruth,
            isPrediction,
            isDraft,
            capabilities.enableAnnotationDelete,
            capabilities.enableCreateAnnotation,
            capabilities.groundTruthEnabled,
          ],
        );

        return <ContextMenu actions={actions} />;
      }),
    );

    return (
      <Block name="annotation-button" mod={{ selected: safe(() => entity.selected, false) }}>
        <Elem name="mainSection" onClick={clickHandler}>
          <Elem name="picSection">
            <Elem
              name="userpic"
              tag={Userpic}
              showUsername
              username={isPrediction ? safe(() => entity.createdBy) : null}
              user={hiddenUser ?? safe(() => entity.user) ?? { email: safe(() => entity.createdBy) }}
              mod={{ prediction: isPrediction }}
              size={24}
            >
              {isPrediction && <IconSparks style={{ width: 18, height: 18 }} />}
            </Elem>
          </Elem>
          <Elem name="main">
            <Elem name="user">
              <Elem tag="span" name="name">
                {hiddenUser ? hiddenUser.email : username}
              </Elem>
              {!infoIsHidden && (
                <Elem tag="span" name="entity-id">
                  #{safe(() => entity.pk ?? entity.id)}
                </Elem>
              )}
            </Elem>
            {!infoIsHidden && (
              <Elem name="info">
                <Elem name="date" component={TimeAgo} date={safe(() => entity.createdDate)} />
                {isPrediction && isDefined(safe(() => entity.score)) && (
                  <span title={`Prediction score = ${safe(() => entity.score)}`}>
                    {" · "} {(safe(() => entity.score) * 100).toFixed(2)}%
                  </span>
                )}
              </Elem>
            )}
          </Elem>
          {!isPrediction && (
            <Elem name="icons">
              {safe(() => entity.draftId > 0) && (
                <Tooltip title="Draft">
                  <Elem name="icon" mod={{ draft: true }}>
                    <IconDraftCreated2 color="#617ADA" />
                  </Elem>
                </Tooltip>
              )}
              {safe(() => entity.skipped) && (
                <Tooltip title="Skipped">
                  <Elem name="icon" mod={{ skipped: true }}>
                    <IconAnnotationSkipped2 color="#DD0000" />
                  </Elem>
                </Tooltip>
              )}
              {isGroundTruth && (
                <Tooltip title="Ground-truth">
                  <Elem name="icon" mod={{ groundTruth: true }}>
                    <IconAnnotationGroundTruth />
                  </Elem>
                </Tooltip>
              )}
              {CommentIcon && (
                <Tooltip title={renderCommentTooltip(entity)}>
                  <Elem name="icon" mod={{ comments: true }}>
                    <CommentIcon />
                  </Elem>
                </Tooltip>
              )}
            </Elem>
          )}
        </Elem>
        <ContextMenuTrigger
          className={cn("annotation-button").elem("trigger").toClassName()}
          content={
            <AnnotationButtonContextMenu
              entity={entity}
              capabilities={capabilities}
              annotationStore={annotationStore}
            />
          }
        />
      </Block>
    );
  },
);