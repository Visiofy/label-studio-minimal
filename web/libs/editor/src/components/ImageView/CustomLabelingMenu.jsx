import React, { Component } from "react";
import { observer } from "mobx-react";
import { isAlive } from "mobx-state-tree";
import { Hotkey } from "../../core/Hotkey";
import { Range } from "../../common/Range/Range";

const hotkeys = Hotkey("CustomLabelingMenu");

const IconDot = ({ size }) => (
  <span
    style={{
      display: "block",
      width: size,
      height: size,
      background: "rgba(0, 0, 0, 0.25)",
      borderRadius: "100%",
    }}
  />
);

export default observer(
  class CustomLabelingMenu extends Component {
    constructor(props) {
      super(props);

      // Carica le preferenze salvate dal localStorage
      const savedPrefs = this.loadSavedPreferences();

      this.state = {
        pendingLabel: savedPrefs.lastLabel,
        pendingTool: savedPrefs.lastTool,
      };
      this._isMounted = false;
      this.lastMenuInteraction = null;
      this.allowingAutomaticChange = false;
    }

    componentDidMount() {
      this._isMounted = true;

      // COMPLETELY override Label Studio hotkeys to route through our menu
      this.setupCustomHotkeys();


      // Log current project configuration
      this.logProjectConfiguration();

      // Sync state with Label Studio
      this.syncWithLabelStudio();

      // Applica le preferenze salvate se esistono
      this.applyLoadedPreferences();

      // REMOVED: DOM-based region click detection - too invasive
    }

    // Carica le preferenze salvate dal localStorage
    loadSavedPreferences = () => {
      try {
        const saved = localStorage.getItem('customLabelingMenu_preferences');
        if (saved) {
          const prefs = JSON.parse(saved);

          return {
            lastTool: prefs.lastTool || null,
            lastLabel: prefs.lastLabel || null
          };
        }
      } catch (error) {

      }

      return {
        lastTool: null,
        lastLabel: null
      };
    };

    // Salva le preferenze nel localStorage
    savePreferences = (tool, label) => {
      try {
        const prefs = {
          lastTool: tool,
          lastLabel: label,
          timestamp: Date.now()
        };
        localStorage.setItem('customLabelingMenu_preferences', JSON.stringify(prefs));

      } catch (error) {

      }
    };

    // Applica le preferenze caricate al mount del componente
    applyLoadedPreferences = () => {
      const { pendingTool, pendingLabel } = this.state;

      // Se abbiamo sia tool che label salvati, applicali
      if (pendingTool && pendingLabel) {


        // Applica con un piccolo delay per dare tempo al sistema di inizializzarsi
        setTimeout(() => {
          if (this._isMounted) {
            this.applyToolLabelCombination(pendingTool, pendingLabel);
          }
        }, 500);
      } else if (pendingTool) {
        // Solo il tool è salvato

        setTimeout(() => {
          if (this._isMounted) {
            this.activateToolOnly(pendingTool);
          }
        }, 500);
      }
    };

    setupCustomHotkeys = () => {


      try {
        // STEP 1: Set up direct document-level event interception (most reliable)
        this.setupDirectEventInterception();

        // STEP 2: Still disable native systems as backup
        this.disableAllNativeHotkeys();

        // STEP 3: Set up our hotkey system as secondary layer
        this.setupOurHotkeySystem();



      } catch (e) {

      }
    };

    // Direct document-level event interception - highest priority
    setupDirectEventInterception = () => {


      this.directKeyHandler = (event) => {
        if (!this._isMounted) return;

        const key = event.key.toLowerCase();
        const isOurKey = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'b', 'r', 'k', 'e'].includes(key);

        if (isOurKey) {


          // STOP the event from reaching Label Studio
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          // Handle our custom logic
          this.handleDirectKeypress(key);

          return false;
        }
      };

      // Attach to document with highest priority (capture phase)
      document.addEventListener('keydown', this.directKeyHandler, { capture: true, passive: false });

    };

    // Handle our custom key logic
    handleDirectKeypress = (key) => {


      switch(key) {
        case 'b':
          this.handleBrushHotkey();
          break;
        case 'r':
          this.handleRectangleHotkey();
          break;
        case 'k':
          this.handleKeypointHotkey();
          break;
        case 'e':
          this.handleEraserHotkey();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          this.handleLabelNumberHotkey(parseInt(key));
          break;
      }
    };

    // Completely disable all native Label Studio hotkey systems
    disableAllNativeHotkeys = () => {


      // Remove from keymaster (global hotkey manager)
      const keymaster = window.key || window.hotkeys;
      if (keymaster) {
        // Clear ALL registered hotkeys, not just ours
        keymaster.unbind();

      }

      // Disable Label Studio's internal hotkey systems
      try {
        const { item } = this.props;
        if (item && isAlive(item)) {
          const annotation = item?.annotation;
          if (annotation && isAlive(annotation) && annotation?.root?.children) {
            annotation.root.children.forEach(control => {
              if (control && isAlive(control)) {
                // Disable ALL hotkey functionality on controls
                if (control.hotkeys) {
                  if (typeof control.hotkeys === 'object' && control.hotkeys.stop) {
                    control.hotkeys.stop();
                  }
                  control.hotkeys = null;
                }

                // Disable individual label hotkeys completely
                if (control.children && Array.isArray(control.children)) {
                  control.children.forEach(label => {
                    if (label && isAlive(label) && label.hotkey) {
                      label.hotkey = null;
                    }
                  });
                }
              }
            });
          }
        }
      } catch (e) {

      }

      // Clear our own hotkey system too
      try {
        const keysToRemove = ["b", "r", "k", "e", "Escape"];
        for (let i = 1; i <= 9; i++) {
          keysToRemove.push(i.toString());
        }
        keysToRemove.forEach(key => {
          try { hotkeys.removeKey(key); } catch (e) {}
        });
      } catch (e) {}
    };

    // Set up our own complete hotkey system
    setupOurHotkeySystem = () => {


      try {
        // Tool hotkeys
        hotkeys.addKey("b", this.handleBrushHotkey, "Custom Brush selection");
        hotkeys.addKey("r", this.handleRectangleHotkey, "Custom Rectangle selection");
        hotkeys.addKey("k", this.handleKeypointHotkey, "Custom Keypoint selection");
        hotkeys.addKey("e", this.handleEraserHotkey, "Custom Eraser selection");

        // Label number hotkeys
        for (let i = 1; i <= 9; i++) {
          hotkeys.addKey(i.toString(), () => this.handleLabelNumberHotkey(i), `Custom label ${i} selection`);
        }

        // ESC key
        hotkeys.addKey("Escape", this.handleEscapeKey, "Clear menu selections");


      } catch (e) {

      }
    };

    // Lightweight monitoring instead of aggressive override
    setupLightweightMonitoring = () => {
      // Only monitor and log, don't aggressively override
      this.monitoringCleanup = setInterval(() => {
        if (!this._isMounted) return;

        // Just log if native bindings are detected, but don't interfere

      }, 5000); // Check every 5 seconds, less frequently
    };

    // Disable native KeyPoint groups and other native hotkey systems
    disableNativeGroups = () => {
      try {
        const { item } = this.props;
        if (!item || !isAlive(item)) return;

        const annotation = item?.annotation;
        if (annotation?.root?.children) {
          annotation.root.children.forEach(control => {
            if (control?.type?.includes('keypointlabels') && control.hotkeys) {
              // Disable KeyPoint group hotkeys
              if (typeof control.hotkeys === 'object' && control.hotkeys.stop) {
                control.hotkeys.stop();
              }
            }
          });
        }
      } catch (e) {
        // Silently ignore errors in disabling native groups
      }
    };

    // Log project configuration to understand label setup
    logProjectConfiguration = () => {
      try {
        const { item } = this.props;
        if (!item || !isAlive(item)) return;

        const annotation = item?.annotation;
        if (!annotation || !isAlive(annotation) || !annotation?.root?.children) return;



        annotation.root.children.forEach(control => {
          if (control && isAlive(control)) {


            if (control.children && Array.isArray(control.children)) {
              control.children.forEach(label => {
                if (label && isAlive(label)) {

                }
              });
            }
          }
        });

        // Check tools configuration
        const toolsManager = item.getToolsManager();
        if (toolsManager) {
          const tools = toolsManager.allTools();

          tools.forEach(tool => {

          });
        }


      } catch (error) {

      }
    };

    // Frequent sync removed - problem was in ToolsManager cursor reset

    componentWillUnmount() {
      this._isMounted = false;


      // Remove direct document event handler
      if (this.directKeyHandler) {
        document.removeEventListener('keydown', this.directKeyHandler, { capture: true });
        this.directKeyHandler = null;

      }

      // Remove region click detection handler
      if (this.regionClickHandler) {
        document.removeEventListener('click', this.regionClickHandler, { capture: true });
        this.regionClickHandler = null;

      }

      // Stop monitoring
      if (this.monitoringCleanup) {
        clearInterval(this.monitoringCleanup);
        this.monitoringCleanup = null;
      }

      // No longer needed - frequent sync removed

      // Clean up our custom hotkeys
      try {
        const keysToRemove = ["b", "r", "k", "e", "Escape"];
        for (let i = 1; i <= 9; i++) {
          keysToRemove.push(i.toString());
        }

        keysToRemove.forEach(key => {
          try { hotkeys.removeKey(key); } catch (e) {}
        });


      } catch (e) {

      }
    }

    componentDidUpdate() {
      // Only sync when there are actual changes, no forcing
      this.syncWithLabelStudio();
    }

    // Set up direct DOM event detection for region clicks
    setupRegionClickDetection = () => {


      // Listen for click events on the document
      this.regionClickHandler = (event) => {
        if (!this._isMounted) return;

        // Check if click was on a region element
        const target = event.target;

        // Look for region-related elements in the DOM
        let regionElement = target;
        let regionType = null;

        // Traverse up the DOM to find region elements
        while (regionElement && regionElement !== document.body) {
          const classList = regionElement.classList || [];
          const className = regionElement.className || '';

          // Check for brush region indicators
          if (className.includes('brush') || className.includes('Brush')) {
            regionType = 'Brush';
            break;
          }

          // Check for rectangle region indicators
          if (className.includes('rect') || className.includes('Rectangle') ||
              regionElement.tagName === 'rect') {
            regionType = 'Rectangle';
            break;
          }

          // Check for keypoint region indicators
          if (className.includes('keypoint') || className.includes('KeyPoint') ||
              className.includes('point') || regionElement.tagName === 'circle') {
            regionType = 'Keypoint';
            break;
          }

          regionElement = regionElement.parentElement;
        }

        // If we detected a region click, force the appropriate tool
        if (regionType && regionType !== this.state.pendingTool) {


          // Don't set lastMenuInteraction - this is automatic
          setTimeout(() => {
            if (this._isMounted && regionType !== this.state.pendingTool) {

              this.setState({
                pendingTool: regionType
              }, () => {
                this.applyToolLabelCombination(regionType, this.state.pendingLabel || 'Unknown');
              });
            }
          }, 100); // Small delay to let other handlers process
        }
      };

      // Attach the event listener
      document.addEventListener('click', this.regionClickHandler, { capture: true });

    };

    // Check selected regions and force appropriate tools in our menu
    checkSelectedRegionsAndForceTools = () => {
      // Throttle calls to avoid excessive processing
      const now = Date.now();
      if (this.lastRegionCheckTime && (now - this.lastRegionCheckTime) < 100) {
        return; // Skip if called too frequently
      }
      this.lastRegionCheckTime = now;

      // Don't force tool changes if user recently interacted with our menu
      if (this.lastMenuInteraction && (now - this.lastMenuInteraction) < 1000) {

        return;
      }



      const { item } = this.props;

      if (!item || !isAlive(item)) {

        return;
      }

      try {
        const annotation = item?.annotation;
        if (!annotation || !isAlive(annotation) || !annotation.regionStore) {

          return;
        }

        const selectedRegions = annotation.regionStore.selectedRegions || [];


        // Try different approaches to find active region
        let region = null;

        // Approach 1: Selected regions
        if (selectedRegions.length > 0) {
          region = selectedRegions[0];

        }

        // Approach 2: Check if there's an active/highlighted region
        if (!region) {
          const allRegions = annotation.regionStore.regions || [];


          // ONLY look for actually selected regions, not just highlighted (hover)
          const selectedRegion = allRegions.find(r => r?.selected === true);
          if (selectedRegion) {
            region = selectedRegion;

          } else {
            // Fallback: look for highlighted but ONLY if it's been highlighted for a while
            // This prevents forcing on simple hover
            const highlightedRegion = allRegions.find(r => r?.highlighted === true);
            if (highlightedRegion) {

              // Don't use highlighted region for now
            }
          }
        }

        // Approach 3: Check the annotation's current region
        if (!region && annotation.currentRegion) {
          region = annotation.currentRegion;

        }

        if (!region || !isAlive(region)) {

          return;
        }

        // Determine tool based on region type
        let requiredTool = null;
        let requiredLabel = null;

        if (region.type === 'brushregion') {
          requiredTool = 'Brush';
        } else if (region.type === 'rectangleregion') {
          requiredTool = 'Rectangle';
        } else if (region.type === 'keypointregion') {
          requiredTool = 'Keypoint';
        }

        // Get region labels
        if (region.labelings && region.labelings.length > 0) {
          const labeling = region.labelings[0];
          if (labeling.selectedValues && labeling.selectedValues.length > 0) {
            requiredLabel = labeling.selectedValues[0];
          }
        }

        // Force tool/label change if different from current AND not already forced
        let needsUpdate = false;

        if (requiredTool &&
            requiredTool !== this.state.pendingTool &&
            requiredTool !== this.lastForcedTool) {

          needsUpdate = true;
        }

        if (requiredLabel &&
            requiredLabel !== this.state.pendingLabel &&
            requiredLabel !== this.lastForcedLabel) {

          needsUpdate = true;
        }

        if (needsUpdate) {
          // Remember what we forced to avoid loops
          this.lastForcedTool = requiredTool || this.state.pendingTool;
          this.lastForcedLabel = requiredLabel || this.state.pendingLabel;

          const newTool = requiredTool || this.state.pendingTool;
          const newLabel = requiredLabel || this.state.pendingLabel;
          const regionToDeselect = region; // Capture region for callback

          // Don't set lastMenuInteraction - this is not a user menu interaction
          this.setState({
            pendingTool: newTool,
            pendingLabel: newLabel
          }, () => {
            // IMPORTANT: Actually apply the tool/label combination to Label Studio

            this.applyToolLabelCombination(newTool, newLabel);

            // CRITICAL: Deselect the region to prevent continuous forcing
            try {
              if (regionToDeselect && isAlive(regionToDeselect) && regionToDeselect.setSelected) {
                regionToDeselect.setSelected(false);

              }
            } catch (error) {

            }
          });

          // Clear the forced values after a short delay to allow new changes
          setTimeout(() => {
            this.lastForcedTool = null;
            this.lastForcedLabel = null;
          }, 500); // Increased to 500ms to avoid conflicts
        }

      } catch (error) {

      }
    };

    // Sync state with current Label Studio selection - improved version
    syncWithLabelStudio = () => {
      // Early return if component is unmounted
      if (!this._isMounted) return;

      const { item } = this.props;

      // Check if objects are still alive in MST
      if (!item || !isAlive(item)) {

        return;
      }

      try {
        const toolsManager = item.getToolsManager();
        if (!toolsManager) {

          return;
        }

        const selectedTool = toolsManager.findSelectedTool();

        // Get current tool - be more precise in mapping
        let currentTool = null;
        if (selectedTool) {
          const toolName = selectedTool.fullName?.toLowerCase() || '';
          if (toolName.includes('eraser')) currentTool = 'Eraser';
          else if (toolName.includes('brush')) currentTool = 'Brush';
          else if (toolName.includes('rectangle')) currentTool = 'Rectangle';
          else if (toolName.includes('keypoint') || toolName.includes('point')) currentTool = 'Keypoint';
        }

        // DIRECT APPROACH: If Label Studio changed tool, trust that change
        // The issue is that selectedRegions isn't reliable, but tool changes are
        const effectiveTool = currentTool;

        // Check for currently selected labels across all label controls with better safety
        if (annotation && isAlive(annotation)) {
          try {
            // Additional check to make sure annotation is still valid
            if (annotation.root && isAlive(annotation.root) && Array.isArray(annotation.root.children)) {
              for (const control of annotation.root.children) {
                if (control && isAlive(control) && control?.type?.includes('labels')) {
                  // Double-check children array is still valid
                  if (Array.isArray(control.children)) {
                    const selectedLabels = control.children.filter(label =>
                      label && isAlive(label) && label.selected
                    );
                    if (selectedLabels.length > 0 && selectedLabels[0]?.value) {
                      effectiveLabel = selectedLabels[0].value;
                      break;
                    }
                  }
                }
              }
            }
          } catch (annotationError) {

          }
        }


        // Update state only if there's a real change
        const toolChanged = effectiveTool !== this.state.pendingTool;
        const labelChanged = effectiveLabel !== this.state.pendingLabel;

        if (this._isMounted && (toolChanged || labelChanged)) {
          try {
            this.setState({
              pendingTool: effectiveTool,
              pendingLabel: effectiveLabel,
            });
          } catch (setStateError) {

          }
        }
      } catch (error) {
        // Catch any TimeTraveller or MobX State Tree errors
        if (error.message && error.message.includes('TimeTraveller')) {

        } else {

        }

        // Don't propagate the error to avoid breaking the app
        return;
      }
    };

    // Find control by tool type
    findControlByToolType = (toolType) => {
      const { item } = this.props;

      if (!item || !isAlive(item)) return null;

      const annotation = item?.annotation;
      if (!annotation || !isAlive(annotation) || !annotation?.root?.children) return null;

      const typeMapping = {
        'Brush': 'brushlabels',
        'Rectangle': 'rectanglelabels',
        'Keypoint': 'keypointlabels',
        'Eraser': 'eraser'
      };

      const targetType = typeMapping[toolType];
      if (!targetType) return null;

      return annotation.root.children.find(control =>
        control && isAlive(control) && control?.type?.includes(targetType)
      );
    };

    // Find tool by control type
    findToolByControlType = (controlType) => {
      const { item } = this.props;

      if (!item || !isAlive(item)) return null;

      const toolsManager = item.getToolsManager();
      if (!toolsManager) return null;

      const tools = toolsManager.allTools();




      const typeMapping = {
        'brushlabels': 'brush',
        'rectanglelabels': 'Rectangle',
        'keypointlabels': 'KeyPoint',
        'eraser': 'eraser'
      };

      for (const [key, value] of Object.entries(typeMapping)) {
        if (controlType.includes(key)) {
          const foundTool = tools.find(tool =>
            tool.fullName?.toLowerCase().includes(value.toLowerCase())
          );

          return foundTool;
        }
      }

      return null;
    };

    // COMPLETE override - directly control Label Studio without conflicts
    applyToolLabelCombination = (toolName, labelValue) => {
      const { item } = this.props;

      // Check if component and objects are still alive
      if (!this._isMounted || !item || !isAlive(item)) {

        return;
      }



      try {
        // Set tool switching flag to prevent race conditions
        const imageObject = item.annotation?.names?.get(item.getToolsManager()?.name);
        if (imageObject) {
          imageObject._toolSwitchingInProgress = true;
          // Clear the flag after a short delay
          setTimeout(() => {
            if (imageObject) {
              imageObject._toolSwitchingInProgress = false;
            }
          }, 100);
        }

        // DIRECT approach: Set selections immediately without native system interference
        const success = this.setDirectSelection(toolName, labelValue);

        if (success) {

        } else {

          this.fallbackApproach(toolName, labelValue);
        }

      } catch (error) {

      }
    };

    // Set selections directly without going through native UI
    setDirectSelection = (toolName, labelValue) => {
      try {
        const { item } = this.props;

        // Safety check: Don't proceed if component is unmounted or item is not alive
        if (!this._isMounted || !item || !isAlive(item)) {

          return false;
        }

        // Special handling for Eraser tool - it doesn't need labels
        if (toolName === 'Eraser') {

          return this.activateEraserTool();
        }

        // Safety check: Don't proceed with invalid labels
        if (!labelValue) {

          return this.activateToolOnly(toolName);
        }

        // Step 1: Get current tool and explicitly call handleToolSwitch if it exists
        const toolsManager = item.getToolsManager();
        if (!toolsManager) {

          return false;
        }

        const currentTool = toolsManager.findSelectedTool();
        const newTool = this.findToolByControlType(this.mapToolNameToControlType(toolName));

        if (!newTool) {
          return false;
        }

        // CRITICAL: Manually trigger handleToolSwitch if current tool has it
        if (currentTool && currentTool !== newTool && currentTool.handleToolSwitch) {

          currentTool.handleToolSwitch(newTool);
        }

        // Step 2: Directly activate the new tool through the tools manager
        toolsManager.selectTool(newTool, true);


        // Step 3: Find the control that matches this tool
        const control = this.findControlByToolType(toolName);
        if (!control || !isAlive(control)) {

          return true; // Tool activation succeeded, label selection not possible
        }

        // Additional safety check for control children
        if (!control.children || !Array.isArray(control.children)) {

          return true; // Tool activation succeeded, label selection not possible
        }

        // Step 4: Find and validate the label
        const labelObj = control.children.find(label =>
          label && isAlive(label) && label.value === labelValue
        );

        if (!labelObj || !isAlive(labelObj)) {

          return true; // Tool activation succeeded, label selection not possible
        }

        // Step 5: Safely set label selection with additional checks
        try {
          // Double-check that control is still alive before proceeding
          if (!isAlive(control)) {

            return true;
          }

          // Clear all other selections in this control first
          control.children.forEach(label => {
            if (label && isAlive(label) && label !== labelObj && label.selected) {
              // Additional safety check before calling setSelected
              if (label.setSelected && typeof label.setSelected === 'function') {
                try {
                  label.setSelected(false);
                } catch (err) {

                }
              }
            }
          });

          // Set our label as selected with additional safety checks
          if (labelObj && isAlive(labelObj) && labelObj.setSelected && typeof labelObj.setSelected === 'function') {
            try {
              labelObj.setSelected(true);

              return true;
            } catch (err) {

              return true; // Tool activation still succeeded
            }
          }
        } catch (selectionError) {

          return true; // Tool activation still succeeded
        }

        return true;
      } catch (error) {

        return false;
      }
    };

    // Fallback approach if direct selection fails
    fallbackApproach = (toolName, labelValue) => {
      try {
        const { item } = this.props;
        const toolsManager = item.getToolsManager();
        if (!toolsManager) return;

        const currentTool = toolsManager.findSelectedTool();
        const newTool = this.findToolByControlType(this.mapToolNameToControlType(toolName));

        if (newTool) {
          // CRITICAL: Manually trigger handleToolSwitch if current tool has it
          if (currentTool && currentTool !== newTool && currentTool.handleToolSwitch) {

            currentTool.handleToolSwitch(newTool);
          }

          toolsManager.selectTool(newTool, true);
          setTimeout(() => {
            this.selectLabelAfterToolActivation(toolName, labelValue);
          }, 100);
        }
      } catch (error) {

      }
    };

    // Helper to map our tool names to control types
    mapToolNameToControlType = (toolName) => {
      const mapping = {
        'Brush': 'brushlabels',
        'Rectangle': 'rectanglelabels',
        'Keypoint': 'keypointlabels',
        'Eraser': 'eraser'
      };
      return mapping[toolName] || toolName.toLowerCase() + 'labels';
    };

    // Select label after tool is activated
    selectLabelAfterToolActivation = (toolName, labelValue) => {
      try {
        const { item } = this.props;
        if (!item || !isAlive(item)) return;

        // Find the control for this tool type
        const control = this.findControlByToolType(toolName);
        if (!control || !isAlive(control)) {

          return;
        }

        // Find and select the label WITHOUT deselecting others initially
        const labelObj = control.children.find(label =>
          label && isAlive(label) && label.value === labelValue
        );

        if (!labelObj || !isAlive(labelObj)) {

          return;
        }

        // Only select if not already selected to avoid deselection
        if (!labelObj.selected) {
          if (labelObj.setSelected && typeof labelObj.setSelected === 'function') {

            labelObj.setSelected(true);
          } else if (labelObj.onClickEv && typeof labelObj.onClickEv === 'function') {

            labelObj.onClickEv();
          } else {

          }
        } else {

        }



      } catch (error) {

      }
    };

    // Handle label selection
    handleLabelClick = (labelValue) => {

      this.lastMenuInteraction = Date.now();

      // If we already have a tool selected, apply immediately
      if (this.state.pendingTool) {
        this.setState({ pendingLabel: labelValue }, () => {
          this.applyToolLabelCombination(this.state.pendingTool, labelValue);
          // Salva le preferenze
          this.savePreferences(this.state.pendingTool, labelValue);

          // Auto-activate SAM if Keypoint tool is selected
          if (this.state.pendingTool === 'Keypoint') {
            setTimeout(async () => {
              if (this._isMounted && this.state.pendingTool === 'Keypoint') {

                await this.activateSamForKeypoints();
              }
            }, 200);
          }
        });
      } else {
        // Just set the pending label and wait for tool selection
        this.setState({ pendingLabel: labelValue }, () => {
          // Salva almeno la label
          this.savePreferences(this.state.pendingTool, labelValue);
        });
      }
    };

    // Handle tool selection - preserve existing label selection
    handleToolClick = (toolName) => {

      this.lastMenuInteraction = Date.now();

      // Keep the current label selection when switching tools
      const currentLabel = this.state.pendingLabel;

      this.setState({ pendingTool: toolName }, () => {
        // If we have a label selected, apply the combination
        if (currentLabel) {
          this.applyToolLabelCombination(toolName, currentLabel);
          // Salva le preferenze complete
          this.savePreferences(toolName, currentLabel);
        } else {
          // Just activate the tool without changing label selection
          this.activateToolOnly(toolName);
          // Salva almeno il tool
          this.savePreferences(toolName, this.state.pendingLabel);
        }

        // Auto-activate SAM for Keypoint tool
        if (toolName === 'Keypoint') {
          setTimeout(async () => {
            if (this._isMounted && this.state.pendingTool === 'Keypoint') {

              await this.activateSamForKeypoints();
            }
          }, 200);
        }
      });
    };

    // Activate tool only without affecting label selection
    activateToolOnly = (toolName) => {
      const { item } = this.props;
      if (!item || !isAlive(item)) return;

      try {
        // Special handling for Eraser tool
        if (toolName === 'Eraser') {
          return this.activateEraserTool();
        }

        const toolsManager = item.getToolsManager();
        if (!toolsManager) return;

        const currentTool = toolsManager.findSelectedTool();
        const newTool = this.findToolByControlType(this.mapToolNameToControlType(toolName));

        if (!newTool) return;

        // CRITICAL: Manually trigger handleToolSwitch if current tool has it
        if (currentTool && currentTool !== newTool && currentTool.handleToolSwitch) {

          currentTool.handleToolSwitch(newTool);
        }


        toolsManager.selectTool(newTool, true);
      } catch (error) {

      }
    };

    // Special activation for Eraser tool
    activateEraserTool = () => {
      const { item } = this.props;
      if (!item || !isAlive(item)) return;

      try {
        const toolsManager = item.getToolsManager();
        if (!toolsManager) return;

        // Find the eraser tool directly
        const eraserTool = toolsManager.allTools().find(tool =>
          tool.fullName?.toLowerCase().includes('eraser')
        );

        if (!eraserTool) {

          return;
        }

        const currentTool = toolsManager.findSelectedTool();

        // CRITICAL: Manually trigger handleToolSwitch if current tool has it
        if (currentTool && currentTool !== eraserTool && currentTool.handleToolSwitch) {

          currentTool.handleToolSwitch(eraserTool);
        }


        toolsManager.selectTool(eraserTool, true);
      } catch (error) {

      }
    };

    // Custom hotkey handlers that route through our menu system
    handleBrushHotkey = () => {


      this.lastMenuInteraction = Date.now();
      this.handleToolClick('Brush');
    };

    handleRectangleHotkey = () => {


      this.lastMenuInteraction = Date.now();
      this.handleToolClick('Rectangle');
    };

    handleKeypointHotkey = async () => {


      this.lastMenuInteraction = Date.now();

      // First activate the keypoint tool
      this.handleToolClick('Keypoint');

      // Then attempt to activate SAM after a short delay
      setTimeout(async () => {
        if (this._isMounted && this.state.pendingTool === 'Keypoint') {

          await this.activateSamForKeypoints();
        }
      }, 200);
    };

    handleEraserHotkey = () => {


      this.lastMenuInteraction = Date.now();
      this.handleToolClick('Eraser');
    };

    handleLabelNumberHotkey = (number) => {

      this.lastMenuInteraction = Date.now();
      const availableLabels = this.getAvailableLabels();
      const labelIndex = number - 1;

      if (labelIndex < availableLabels.length) {
        const labelValue = availableLabels[labelIndex];

        this.handleLabelClick(labelValue);
        // Le preferenze vengono salvate già nel handleLabelClick
      } else {

      }
    };

    // Handle ESC key to clear menu selections
    handleEscapeKey = () => {

      this.setState({
        pendingLabel: null,
        pendingTool: null,
      }, () => {
        // Salva lo stato "pulito"
        this.savePreferences(null, null);
      });
    };

    // Get available labels from all label controls
    getAvailableLabels = () => {
      try {
        const { item } = this.props;

        if (!item || !isAlive(item)) {
          return ['Unknown'];
        }

        const annotation = item?.annotation;
        const availableLabels = new Set();

        if (annotation && isAlive(annotation) && annotation?.root?.children) {
          annotation.root.children.forEach(control => {
            try {
              if (control && isAlive(control) && control?.type?.includes('labels') && Array.isArray(control.children)) {
                control.children.forEach(label => {
                  if (label && isAlive(label) && label?.value) {
                    availableLabels.add(label.value);
                  }
                });
              }
            } catch (controlError) {

            }
          });
        }

        // Add labels from existing regions with safety checks
        if (annotation && isAlive(annotation) && annotation?.regionStore?.regions) {
          try {
            annotation.regionStore.regions.forEach(region => {
              if (region && isAlive(region) && region?.labelings) {
                region.labelings.forEach(labeling => {
                  if (labeling && labeling?.selectedValues) {
                    labeling.selectedValues.forEach(value => {
                      if (value) availableLabels.add(value);
                    });
                  }
                });
              }
            });
          } catch (regionError) {

          }
        }

        if (availableLabels.size === 0) availableLabels.add('Unknown');

        return Array.from(availableLabels);
      } catch (error) {

        return ['Unknown'];
      }
    };

    // Get label color
    getLabelColor = (labelValue) => {
      const { item } = this.props;
      const annotation = item?.annotation;

      if (annotation?.root?.children) {
        for (const control of annotation.root.children) {
          if (control?.type?.includes('labels') && Array.isArray(control.children)) {
            const labelObj = control.children.find(l => l?.value === labelValue);
            if (labelObj?.background) {
              return labelObj.background;
            }
          }
        }
      }

      return '#36B37E';
    };

    // Get currently selected tool name from native state
    getNativeSelectedToolName = (selectedTool) => {
      if (!selectedTool) return null;

      const toolName = selectedTool.fullName?.toLowerCase() || '';
      if (toolName.includes('eraser')) return 'Eraser';
      else if (toolName.includes('brush')) return 'Brush';
      else if (toolName.includes('rectangle')) return 'Rectangle';
      else if (toolName.includes('keypoint') || toolName.includes('point')) return 'Keypoint';
      return null;
    };

    // Get currently selected labels from native state
    getNativeSelectedLabels = () => {
      try {
        const { item } = this.props;
        const selectedLabels = [];

        if (!item || !isAlive(item)) return selectedLabels;

        const annotation = item?.annotation;
        if (annotation && isAlive(annotation) && annotation?.root?.children) {
          for (const control of annotation.root.children) {
            try {
              if (control && isAlive(control) && control?.type?.includes('labels') && Array.isArray(control.children)) {
                const selected = control.children.filter(label =>
                  label && isAlive(label) && label.selected
                );
                selectedLabels.push(...selected.map(l => l.value).filter(Boolean));
              }
            } catch (controlError) {

            }
          }
        }

        return selectedLabels;
      } catch (error) {

        return [];
      }
    };

    // Get current brush size from the brush tool
    getBrushSize = () => {
      try {
        const { item } = this.props;
        if (!item || !isAlive(item)) return 15; // default size

        const toolsManager = item.getToolsManager();
        if (!toolsManager) return 15;

        const brushTool = toolsManager.allTools().find(tool =>
          tool && tool.fullName?.toLowerCase().includes('brush')
        );

        return brushTool?.strokeWidth || 15;
      } catch (error) {

        return 15;
      }
    };

    // Set brush size on the brush tool
    setBrushSize = (size) => {
      try {
        const { item } = this.props;
        if (!item || !isAlive(item)) return;

        const toolsManager = item.getToolsManager();
        if (!toolsManager) return;

        const brushTool = toolsManager.allTools().find(tool =>
          tool && tool.fullName?.toLowerCase().includes('brush')
        );

        if (brushTool && brushTool.setStroke && typeof brushTool.setStroke === 'function') {
          brushTool.setStroke(size);
        }
      } catch (error) {

      }
    };

    // Get current eraser size from the eraser tool
    getEraserSize = () => {
      try {
        const { item } = this.props;
        if (!item || !isAlive(item)) return 10; // default size

        const toolsManager = item.getToolsManager();
        if (!toolsManager) return 10;

        const eraserTool = toolsManager.allTools().find(tool =>
          tool && tool.fullName?.toLowerCase().includes('eraser')
        );

        return eraserTool?.strokeWidth || 10;
      } catch (error) {

        return 10;
      }
    };

    // Set eraser size on the eraser tool
    setEraserSize = (size) => {
      try {
        const { item } = this.props;
        if (!item || !isAlive(item)) return;

        const toolsManager = item.getToolsManager();
        if (!toolsManager) return;

        const eraserTool = toolsManager.allTools().find(tool =>
          tool && tool.fullName?.toLowerCase().includes('eraser')
        );

        if (eraserTool && eraserTool.setStroke && typeof eraserTool.setStroke === 'function') {
          eraserTool.setStroke(size);
        }
      } catch (error) {

      }
    };

    // Check if SAM tool is available and active
    isSamToolAvailable = () => {
      try {
        const samSelectors = [
          'button[aria-label="key-point-tool"].lsf-tool_smart',
          'button.lsf-tool_smart[aria-label*="key-point"]',
          'button.lsf-tool_smart[aria-label*="keypoint"]',
          '.lsf-tool_smart:has([aria-label*="key-point"])',
          'button[data-tool*="keypoint"].lsf-tool_smart',
          '.lsf-tool.lsf-tool_smart[aria-label*="KeyPoint"]'
        ];

        for (const selector of samSelectors) {
          const samTool = document.querySelector(selector);
          if (samTool) {
            return {
              available: true,
              element: samTool,
              isActive: samTool.classList.contains('lsf-tool_active') ||
                       samTool.getAttribute('aria-pressed') === 'true'
            };
          }
        }

        return { available: false, element: null, isActive: false };
      } catch (error) {

        return { available: false, element: null, isActive: false };
      }
    };

    // Activate SAM tool for keypoints
    activateSamForKeypoints = () => {
      return new Promise((resolve) => {


        const samInfo = this.isSamToolAvailable();

        if (!samInfo.available) {

          resolve(false);
          return;
        }

        if (samInfo.isActive) {

          resolve(true);
          return;
        }

        try {

          samInfo.element.click();

          // Check activation after a short delay
          setTimeout(() => {
            const updatedSamInfo = this.isSamToolAvailable();
            const isNowActive = updatedSamInfo.available && updatedSamInfo.isActive;


            resolve(isNowActive);
          }, 150);

        } catch (error) {

          resolve(false);
        }
      });
    };

    render() {

      const { item } = this.props;

      // Safety checks for render method
      if (!item || !isAlive(item)) {
        return <div style={{ padding: '16px', color: '#666' }}>Loading...</div>;
      }

      let toolsManager, selectedTool, availableLabels, nativeToolName, nativeSelectedLabels;

      try {
        toolsManager = item.getToolsManager();
        selectedTool = toolsManager?.findSelectedTool();
        availableLabels = this.getAvailableLabels();

        // Get real-time native state for better accuracy
        nativeToolName = this.getNativeSelectedToolName(selectedTool);
        nativeSelectedLabels = this.getNativeSelectedLabels();
      } catch (renderError) {

        return <div style={{ padding: '16px', color: '#ff6b6b' }}>Menu temporarily unavailable</div>;
      }

      // Additional safety checks
      if (!Array.isArray(availableLabels)) {
        availableLabels = [];
      }
      if (!Array.isArray(nativeSelectedLabels)) {
        nativeSelectedLabels = [];
      }

      return (
        <div
          style={{
            width: "280px",
            backgroundColor: '#f8f9fa',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '16px',
            fontFamily: 'sans-serif',
            overflow: 'auto',
            height: 'fit-content',
            position: 'relative',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginTop: '8px',
            pointerEvents: 'auto',
            userSelect: 'none'
          }}
        >
          {/* Sezione Label Disponibili */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: '#666',
                textTransform: 'uppercase'
              }}
            >
              Label Disponibili
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '4px' }}>
              {availableLabels.map((labelValue, index) => {
                // Check both our internal state and native state for better accuracy
                const isSelectedByMenu = this.state.pendingLabel === labelValue;
                const isSelectedNatively = nativeSelectedLabels.includes(labelValue);
                const isSelected = isSelectedByMenu || isSelectedNatively;

                const labelHotkey = index < 9 ? `${index + 1}` : '';
                const labelColor = this.getLabelColor(labelValue);

                return (
                  <span
                    key={labelValue}
                    className={`lsf-label ${isSelected ? 'lsf-label_selected' : ''} lsf-label_clickable lsf-label_margins`}
                    style={{
                      '--color': isSelected ? labelColor : '#666',
                      '--background': isSelected ? `${labelColor}26` : '#f5f5f5',
                      cursor: 'pointer',
                      display: 'inline-block',
                      minWidth: 'auto',
                      padding: '4px 8px',
                      fontSize: '11px',
                      marginBottom: '0',
                      marginRight: '4px',
                      textAlign: 'center',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      borderLeft: isSelected ? `4px solid ${labelColor}` : '4px solid transparent'
                    }}
                    onClick={() => this.handleLabelClick(labelValue)}
                  >
                    <span className="lsf-label__text">{labelValue}</span>
                    {labelHotkey && <span className="lsf-label__hotkey">{labelHotkey}</span>}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Sezione Tool Disponibili */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: '#666',
                textTransform: 'uppercase'
              }}
            >
              Tool Disponibili
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* Prima riga: Brush e Eraser affiancati */}
              <div style={{ display: 'flex', flexDirection: 'row', gap: '4px' }}>
                {[
                  { name: 'Brush', type: 'brushlabels', icon: '🖌️' },
                  { name: 'Eraser', type: 'eraser', icon: '🧽' }
                ].map((tool, index) => {
                  // Check both our internal state and native state for better accuracy
                  const isSelectedByMenu = this.state.pendingTool === tool.name;
                  const isSelectedNatively = nativeToolName === tool.name;
                  const isSelected = isSelectedByMenu || isSelectedNatively;

                  const toolHotkey = ['B', 'E'][index];

                  return (
                    <span
                      key={tool.name}
                      className={`lsf-label ${isSelected ? 'lsf-label_selected' : ''} lsf-label_clickable lsf-label_margins`}
                      style={{
                        '--color': isSelected ? '#52c41a' : '#666',
                        '--background': isSelected ? '#52c41a26' : '#f5f5f5',
                        cursor: 'pointer',
                        display: 'block',
                        flex: '1', // Prendi lo spazio disponibile
                        textAlign: 'center',
                        marginBottom: '0'
                      }}
                      onClick={() => this.handleToolClick(tool.name)}
                    >
                      <span className="lsf-label__text">
                        {tool.icon} {tool.name}
                      </span>
                      <span className="lsf-label__hotkey">{toolHotkey}</span>
                    </span>
                  );
                })}
              </div>

              {/* Seconda riga: Rectangle e Keypoint */}
              {[
                { name: 'Rectangle', type: 'rectanglelabels', icon: '⬛' },
                { name: 'Keypoint', type: 'keypointlabels', icon: '🎯' }
              ].map((tool, index) => {
                // Check both our internal state and native state for better accuracy
                const isSelectedByMenu = this.state.pendingTool === tool.name;
                const isSelectedNatively = nativeToolName === tool.name;
                const isSelected = isSelectedByMenu || isSelectedNatively;

                const toolHotkey = ['R', 'K'][index];

                return (
                  <span
                    key={tool.name}
                    className={`lsf-label ${isSelected ? 'lsf-label_selected' : ''} lsf-label_clickable lsf-label_margins`}
                    style={{
                      '--color': isSelected ? '#52c41a' : '#666',
                      '--background': isSelected ? '#52c41a26' : '#f5f5f5',
                      cursor: 'pointer',
                      display: 'block',
                      marginBottom: '4px'
                    }}
                    onClick={() => this.handleToolClick(tool.name)}
                  >
                    <span className="lsf-label__text">
                      {tool.icon} {tool.name}
                      {tool.name === 'Keypoint' && isSelected && (
                        <span
                          style={{
                            backgroundColor: selectedTool?.fullName?.includes('-dynamic') ? '#52c41a' : '#ff8c00',
                            color: 'white',
                            padding: '2px 4px',
                            borderRadius: '2px',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            marginLeft: '4px'
                          }}
                        >
                          {selectedTool?.fullName?.includes('-dynamic') ? 'SAM ✓' : 'SAM'}
                        </span>
                      )}
                    </span>
                    <span className="lsf-label__hotkey">{toolHotkey}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Brush Size Control - visibile solo quando è selezionato il brush tool */}
          {(nativeToolName === 'Brush' || this.state.pendingTool === 'Brush') && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Brush Size</div>
              <Range
                value={this.getBrushSize()}
                min={1}
                max={50}
                align="horizontal"
                minIcon={<IconDot size={8} />}
                maxIcon={<IconDot size={16} />}
                onChange={(value) => this.setBrushSize(value)}
              />
            </div>
          )}

          {/* Eraser Size Control - visibile solo quando è selezionato l'eraser tool */}
          {(nativeToolName === 'Eraser' || this.state.pendingTool === 'Eraser') && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Eraser Size</div>
              <Range
                value={this.getEraserSize()}
                min={1}
                max={50}
                align="horizontal"
                minIcon={<IconDot size={8} />}
                maxIcon={<IconDot size={16} />}
                onChange={(value) => this.setEraserSize(value)}
              />
            </div>
          )}

        </div>
      );
    }
  }
);