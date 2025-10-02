import { isAlive, types } from "mobx-state-tree";
import { ImageEntity } from "./ImageEntity";

export const ImageEntityMixin = types
  .model({
    currentImageEntity: types.maybeNull(types.reference(ImageEntity)),
    imageEntities: types.optional(types.array(ImageEntity), []),
  })
  .actions((self) => ({
    beforeDestroy() {
      self.currentImageEntity = null;
    },
  }))
  .views((self) => ({
    get maxItemIndex() {
      return self.imageEntities.length - 1;
    },

    /* ----------  HELPERS SECURI  ---------- */
    get aliveEntity() {
      return isAlive(self) && isAlive(self.currentImageEntity)
        ? self.currentImageEntity
        : null;
    },

    /* ----------  STATI DI CARICAMENTO  ---------- */
    get imageIsLoaded() {
      const ent = this.aliveEntity;
      return ent
        ? !ent.downloading && !ent.error && ent.downloaded && ent.imageLoaded
        : false;
    },

    /* ----------  GEOMETRIA  ---------- */
    get rotation() {
      return this.aliveEntity?.rotation;
    },
    set rotation(value) {
      this.aliveEntity?.setRotation(value);
    },

    get naturalWidth() {
      return this.aliveEntity?.naturalWidth;
    },
    set naturalWidth(value) {
      this.aliveEntity?.setNaturalWidth(value);
    },

    get naturalHeight() {
      return this.aliveEntity?.naturalHeight;
    },
    set naturalHeight(value) {
      this.aliveEntity?.setNaturalHeight(value);
    },

    get stageWidth() {
      return this.aliveEntity?.stageWidth;
    },
    set stageWidth(value) {
      this.aliveEntity?.setStageWidth(value);
    },

    get stageHeight() {
      return this.aliveEntity?.stageHeight;
    },
    set stageHeight(value) {
      this.aliveEntity?.setStageHeight(value);
    },

    get stageRatio() {
      return this.aliveEntity?.stageRatio;
    },
    set stageRatio(value) {
      this.aliveEntity?.setStageRatio(value);
    },

    get containerWidth() {
      return this.aliveEntity?.containerWidth;
    },
    set containerWidth(value) {
      this.aliveEntity?.setContainerWidth(value);
    },

    get containerHeight() {
      return this.aliveEntity?.containerHeight;
    },
    set containerHeight(value) {
      this.aliveEntity?.setContainerHeight(value);
    },

    /* ----------  ZOOM  ---------- */
    get stageZoom() {
      return this.aliveEntity?.stageZoom;
    },
    set stageZoom(value) {
      this.aliveEntity?.setStageZoom(value);
    },

    get stageZoomX() {
      return this.aliveEntity?.stageZoomX;
    },
    set stageZoomX(value) {
      this.aliveEntity?.setStageZoomX(value);
    },

    get stageZoomY() {
      return this.aliveEntity?.stageZoomY;
    },
    set stageZoomY(value) {
      this.aliveEntity?.setStageZoomY(value);
    },

    get currentZoom() {
      return this.aliveEntity?.currentZoom;
    },
    set currentZoom(value) {
      this.aliveEntity?.setCurrentZoom(value);
    },

    get zoomScale() {
      return this.aliveEntity?.zoomScale;
    },
    set zoomScale(value) {
      this.aliveEntity?.setZoomScale(value);
    },

    get zoomingPositionX() {
      return this.aliveEntity?.zoomingPositionX;
    },
    set zoomingPositionX(value) {
      this.aliveEntity?.setZoomingPositionX(value);
    },

    get zoomingPositionY() {
      return this.aliveEntity?.zoomingPositionY;
    },
    set zoomingPositionY(value) {
      this.aliveEntity?.setZoomingPositionY(value);
    },

    /* ----------  FILTRI IMMAGINE  ---------- */
    get brightnessGrade() {
      return this.aliveEntity?.brightnessGrade;
    },
    set brightnessGrade(value) {
      this.aliveEntity?.setBrightnessGrade(value);
    },

    get contrastGrade() {
      return this.aliveEntity?.contrastGrade;
    },
    set contrastGrade(value) {
      this.aliveEntity?.setContrastGrade(value);
    },

    /* ----------  UTILS  ---------- */
    findImageEntity(index = 0) {
      return self.imageEntities.find((e) => e.index === index);
    },
  }));