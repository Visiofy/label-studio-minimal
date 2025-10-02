import { types, getParent, isAlive } from "mobx-state-tree";
import { FileLoader } from "../../../utils/FileLoader";
import { clamp } from "../../../utils/utilities";
import { FF_IMAGE_MEMORY_USAGE, isFF } from "../../../utils/feature-flags";

const safeMobxAccess = (fn, fallback = null) => {
  try {
    return fn();
  } catch (error) {
    if (error.message && error.message.includes('no longer part of a state tree')) {
      console.warn('[SafeMobX ImageEntity] Attempted access to destroyed MobX object:', error.message.substring(0, 100));
      return fallback;
    }
    throw error;
  }
};

const isSafeToUse = (item) => {
  if (!item) return false;
  try {
    return isAlive(item);
  } catch (error) {
    return false;
  }
};

const fileLoader = new FileLoader();

export const ImageEntity = types
  .model({
    id: types.identifier,
    src: types.string,
    index: types.number,

    rotation: types.optional(types.number, 0),

    /**
     * Natural sizes of Image
     * Constants
     */
    naturalWidth: types.optional(types.integer, 1),
    naturalHeight: types.optional(types.integer, 1),

    stageWidth: types.optional(types.number, 1),
    stageHeight: types.optional(types.number, 1),

    /**
     * Zoom Scale
     */
    zoomScale: types.optional(types.number, 1),

    /**
     * Coordinates of left top corner
     * Default: { x: 0, y: 0 }
     */
    zoomingPositionX: types.optional(types.number, 0),
    zoomingPositionY: types.optional(types.number, 0),

    /**
     * Brightness of Canvas
     */
    brightnessGrade: types.optional(types.number, 100),

    contrastGrade: types.optional(types.number, 100),
  })
  .volatile(() => ({
    stageRatio: 1,
    // Container's sizes causing limits to calculate a scale factor
    containerWidth: 1,
    containerHeight: 1,

    stageZoom: 1,
    stageZoomX: 1,
    stageZoomY: 1,
    currentZoom: 1,

    /** Is image downloaded to local cache */
    downloaded: false,
    /** Is image being downloaded */
    downloading: false,
    /** If error happened during download */
    error: false,
    /** Download progress 0..1 */
    progress: 0,
    /** Local image src created with URL.createURLObject */
    currentSrc: undefined,
    /** Is image loaded using `<img/>` tag and cached by the browser */
    imageLoaded: false,
  }))
  .views((self) => ({
    get parent() {
      // Get the ImageEntityMixin
      return getParent(self, 2);
    },
    get imageCrossOrigin() {
      return self.parent?.imageCrossOrigin ?? "anonymous";
    },
  }))
  .actions((self) => ({
    preload() {
      if (self.ensurePreloaded() || !self.src) return;

      if (isFF(FF_IMAGE_MEMORY_USAGE)) {
        self.setDownloading(true);
        new Promise((resolve) => {
          const img = new Image();
          // Get from the image tag
          const crossOrigin = self.imageCrossOrigin;
          if (crossOrigin) img.crossOrigin = crossOrigin;
          img.onload = () => {
            if (isSafeToUse(self)) {
              safeMobxAccess(() => self.setCurrentSrc(self.src));
              safeMobxAccess(() => self.setDownloaded(true));
              safeMobxAccess(() => self.setProgress(1));
              safeMobxAccess(() => self.setDownloading(false));
              safeMobxAccess(() => self.setImageLoaded(true));
            }
            resolve();
          };
          img.onerror = () => {
            if (isSafeToUse(self)) {
              safeMobxAccess(() => self.setError(true));
              safeMobxAccess(() => self.setDownloading(false));
            }
            resolve();
          };
          img.src = self.src;
        });
        return;
      }

      safeMobxAccess(() => self.setDownloading(true));
      fileLoader
        .download(self.src, (_t, _l, progress) => {
          if (isSafeToUse(self)) {
            safeMobxAccess(() => self.setProgress(progress));
          }
        })
        .then((url) => {
          if (isSafeToUse(self)) {
            safeMobxAccess(() => self.setDownloaded(true));
            safeMobxAccess(() => self.setDownloading(false));
            safeMobxAccess(() => self.setCurrentSrc(url));
          }
        })
        .catch(() => {
          if (isSafeToUse(self)) {
            safeMobxAccess(() => self.setDownloading(false));
            safeMobxAccess(() => self.setError(true));
          }
        });
    },

    ensurePreloaded() {
      if (isFF(FF_IMAGE_MEMORY_USAGE)) return safeMobxAccess(() => self.currentSrc !== undefined, false);

      if (fileLoader.isError(self.src)) {
        if (isSafeToUse(self)) {
          safeMobxAccess(() => self.setDownloading(false));
          safeMobxAccess(() => self.setError(true));
        }
        return true;
      }
      if (fileLoader.isPreloaded(self.src)) {
        if (isSafeToUse(self)) {
          safeMobxAccess(() => self.setDownloading(false));
          safeMobxAccess(() => self.setDownloaded(true));
          safeMobxAccess(() => self.setProgress(1));
        }
        if (isSafeToUse(self)) {
          safeMobxAccess(() => self.setCurrentSrc(fileLoader.getPreloadedURL(self.src)));
        }
        return true;
      }
      return false;
    },

    setImageLoaded(value) {
      if (isSafeToUse(self)) {
        self.imageLoaded = value;
      }
    },

    setProgress(progress) {
      if (isSafeToUse(self)) {
        self.progress = clamp(progress, 0, 100);
      }
    },

    setDownloading(downloading) {
      if (isSafeToUse(self)) {
        self.downloading = downloading;
      }
    },

    setDownloaded(downloaded) {
      if (isSafeToUse(self)) {
        self.downloaded = downloaded;
      }
    },

    setCurrentSrc(src) {
      if (isSafeToUse(self)) {
        self.currentSrc = src;
      }
    },

    setError() {
      if (isSafeToUse(self)) {
        self.error = true;
      }
    },
  }))
  .actions((self) => ({
    setRotation(angle) {
      self.rotation = angle;
    },

    setNaturalWidth(width) {
      self.naturalWidth = width;
    },

    setNaturalHeight(height) {
      self.naturalHeight = height;
    },

    setStageWidth(width) {
      self.stageWidth = width;
    },

    setStageHeight(height) {
      self.stageHeight = height;
    },

    setStageRatio(ratio) {
      self.stageRatio = ratio;
    },

    setContainerWidth(width) {
      self.containerWidth = width;
    },

    setContainerHeight(height) {
      self.containerHeight = height;
    },

    setStageZoom(zoom) {
      self.stageZoom = zoom;
    },

    setStageZoomX(zoom) {
      self.stageZoomX = zoom;
    },

    setStageZoomY(zoom) {
      self.stageZoomY = zoom;
    },

    setCurrentZoom(zoom) {
      self.currentZoom = zoom;
    },

    setZoomScale(zoomScale) {
      self.zoomScale = zoomScale;
    },

    setZoomingPositionX(x) {
      self.zoomingPositionX = x;
    },

    setZoomingPositionY(y) {
      self.zoomingPositionY = y;
    },

    setBrightnessGrade(grade) {
      self.brightnessGrade = grade;
    },

    setContrastGrade(grade) {
      self.contrastGrade = grade;
    },
  }));
