import { isAlive } from "mobx-state-tree";
import { observer } from "mobx-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconChevron } from "@humansignal/ui";
import { Button } from "../../common/Button/Button";
import { Block, Elem } from "../../utils/bem";
import { clamp, sortAnnotations } from "../../utils/utilities";
import { AnnotationButton } from "./AnnotationButton";
import "./AnnotationsCarousel.scss";

interface AnnotationsCarouselInterface {
  store: any;
  annotationStore: any;
  commentStore?: any;
}

/* ----------  helper sicuro  ---------- */
const safe = (fn: () => any, fallback = null) => {
  try {
    return fn();
  } catch (err) {
    if (err?.message?.includes("no longer part of a state tree")) {
      console.warn("[AnnotationsCarousel] Accesso a nodo MST distrutto bloccato.");
      return fallback;
    }
    throw err;
  }
};

export const AnnotationsCarousel = observer(
  ({ store, annotationStore }: AnnotationsCarouselInterface) => {
    const [entities, setEntities] = useState<any[]>([]);
    const enableAnnotations = store.hasInterface("annotations:tabs");
    const enablePredictions = store.hasInterface("predictions:tabs");
    const enableCreateAnnotation = store.hasInterface("annotations:add-new");
    const groundTruthEnabled = store.hasInterface("ground-truth");
    const enableAnnotationDelete = store.hasInterface("annotations:delete");

    const carouselRef = useRef<HTMLElement>();
    const containerRef = useRef<HTMLElement>();
    const [currentPosition, setCurrentPosition] = useState(0);
    const [isLeftDisabled, setIsLeftDisabled] = useState(false);
    const [isRightDisabled, setIsRightDisabled] = useState(false);

    /* ----------  logica posizione  ---------- */
    const updatePosition = useCallback(
      (e: MouseEvent, goLeft = true) => {
        if (containerRef.current && carouselRef.current) {
          const step = containerRef.current.clientWidth;
          const carouselWidth = carouselRef.current.clientWidth;
          const newPos = clamp(
            goLeft ? currentPosition - step : currentPosition + step,
            0,
            carouselWidth - step,
          );
          setCurrentPosition(newPos);
        }
      },
      [currentPosition],
    );

    useEffect(() => {
      setIsLeftDisabled(currentPosition <= 0);
      setIsRightDisabled(
        currentPosition >=
          (carouselRef.current?.clientWidth ?? 0) - (containerRef.current?.clientWidth ?? 0),
      );
    }, [entities.length, currentPosition]);

    /* ----------  popola lista SOLO entità vive  ---------- */
    useEffect(() => {
      const raw = [];
      if (enablePredictions) raw.push(...annotationStore.predictions);
      if (enableAnnotations) raw.push(...annotationStore.annotations);

      const alive = raw.filter((e) => e && isAlive(e));
      setEntities(alive);
    }, [
      annotationStore,
      enableAnnotations,
      enablePredictions,
      annotationStore.predictions.length,
      annotationStore.annotations.length,
    ]);

    if (!(enableAnnotations || enablePredictions || enableCreateAnnotation)) return null;

    const sorted = sortAnnotations(entities);

    return (
      <Block name="annotations-carousel" style={{ "--carousel-left": `${currentPosition}px` }}>
        <Elem ref={containerRef} name="container">
          <Elem ref={carouselRef} name="carosel">
            {sorted.map((entity) => {
              if (!entity || !isAlive(entity)) return null; // ← mai undefined

              const key = safe(() => entity.id) ?? safe(() => entity.pk) ?? Math.random();

              return (
                <AnnotationButton
                  key={key}
                  entity={entity}
                  capabilities={{
                    enablePredictions,
                    enableCreateAnnotation,
                    groundTruthEnabled,
                    enableAnnotations,
                    enableAnnotationDelete,
                  }}
                  annotationStore={annotationStore}
                />
              );
            })}
          </Elem>
        </Elem>

        {(!isLeftDisabled || !isRightDisabled) && (
          <Elem name="carousel-controls">
            <Elem
              tag={Button}
              name="nav"
              disabled={isLeftDisabled}
              mod={{ left: true, disabled: isLeftDisabled }}
              aria-label="Carousel left"
              onClick={(e: MouseEvent) => !isLeftDisabled && updatePosition(e, true)}
            >
              <Elem name="arrow" mod={{ left: true }} tag={IconChevron} />
            </Elem>

            <Elem
              tag={Button}
              name="nav"
              disabled={isRightDisabled}
              mod={{ right: true, disabled: isRightDisabled }}
              aria-label="Carousel right"
              onClick={(e: MouseEvent) => !isRightDisabled && updatePosition(e, false)}
            >
              <Elem name="arrow" mod={{ right: true }} tag={IconChevron} />
            </Elem>
          </Elem>
        )}
      </Block>
    );
  },
);