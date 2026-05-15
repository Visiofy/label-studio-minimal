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

// SVG Icon Components - Native Label Studio Icons
const IconBrush = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <defs>
      <linearGradient id="paint0_linear_brush" x1="10.4999" y1="10" x2="28.9999" y2="27" gradientUnits="userSpaceOnUse">
        <stop stopOpacity="1" stopColor="var(--text-color-hover)" />
        <stop offset="1" stopOpacity="0.4" stopColor="var(--text-color-hover)" />
      </linearGradient>
    </defs>
    <g opacity="1">
      <path d="M22.9999 5.5C17.4999 -0.5 5.99989 15.5 3.99989 17.5C1.9999 19.5 4.9999 22.5 6.9999 20.5C8.99989 18.5 17.9444 6.97226 19.9999 8C22.9999 9.5 7.99989 20.5 12.9999 25C17.9999 29.5 24.2259 17.3173 25.9999 18.5C27.7739 19.6827 20.4999 24 23.9999 26.5C26.8821 28.5587 29.4999 24 28.9999 23.5C28.4999 23 26.2499 26.25 25.2499 25.25C23.7499 23.75 31.4999 19.5 27.4999 16.5C23.4999 13.5 16.9999 25 14.9999 23C12.9999 21 27.778 10.7125 22.9999 5.5Z" fill="url(#paint0_linear_brush)" />
    </g>
  </svg>
);

const IconEraser = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <rect x="20.1183" y="3.64455" width="13.354" height="23.2808" rx="2" transform="rotate(45 20.1183 3.64455)" fill="url(#paint0_linear_eraser)" />
    <rect x="11.0722" y="12.6907" width="13.354" height="1.94005" transform="rotate(45 11.0722 12.6907)" fill="white" />
    <defs>
      <linearGradient id="paint0_linear_eraser" x1="26.7953" y1="3.64455" x2="26.7953" y2="26.9253" gradientUnits="userSpaceOnUse">
        <stop stopColor="#617ADA" />
        <stop offset="0.572917" stopColor="#617ADA" />
        <stop offset="0.625" stopColor="#FF2A2A" />
        <stop offset="1" stopColor="#FF2A2A" />
      </linearGradient>
    </defs>
  </svg>
);

const IconRectangle = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path opacity="0.4" d="M5 7H21C23.8284 7 25.2426 7 26.1213 7.87868C27 8.75736 27 10.1716 27 13V25H11C8.17157 25 6.75736 25 5.87868 24.1213C5 23.2426 5 21.8284 5 19V7Z" fill="currentColor" />
    <g filter="url(#filter0_d_rectangle)">
      <path d="M28 23.5C28 22.1193 26.8807 21 25.5 21C24.1193 21 23 22.1193 23 23.5C23 24.8807 24.1193 26 25.5 26C26.8807 26 28 24.8807 28 23.5Z" fill="currentColor" />
      <path d="M9 8.5C9 7.11929 7.88071 6 6.5 6C5.11929 6 4 7.11929 4 8.5C4 9.88071 5.11929 11 6.5 11C7.88071 11 9 9.88071 9 8.5Z" fill="currentColor" />
    </g>
    <defs>
      <filter id="filter0_d_rectangle" x="1" y="4" width="30" height="26" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="1.5" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_rectangle" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_rectangle" result="shape" />
      </filter>
    </defs>
  </svg>
);

const IconKeypoint = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path opacity="0.4" fillRule="evenodd" clipRule="evenodd" d="M21 3.5C17.9624 3.5 15.5 5.96243 15.5 9C15.5 12.0376 17.9624 14.5 21 14.5C24.0376 14.5 26.5 12.0376 26.5 9C26.5 5.96243 24.0376 3.5 21 3.5ZM3.5 16C3.5 12.9624 5.96243 10.5 9 10.5C12.0376 10.5 14.5 12.9624 14.5 16C14.5 19.0376 12.0376 21.5 9 21.5C5.96243 21.5 3.5 19.0376 3.5 16ZM15.5 23C15.5 19.9624 17.9624 17.5 21 17.5C24.0376 17.5 26.5 19.9624 26.5 23C26.5 26.0376 24.0376 28.5 21 28.5C17.9624 28.5 15.5 26.0376 15.5 23Z" fill="currentColor" />
    <g filter="url(#filter0_d_keypoint)">
      <path fillRule="evenodd" clipRule="evenodd" d="M21 6.5C19.6193 6.5 18.5 7.61929 18.5 9C18.5 10.3807 19.6193 11.5 21 11.5C22.3807 11.5 23.5 10.3807 23.5 9C23.5 7.61929 22.3807 6.5 21 6.5ZM6.5 16C6.5 14.6193 7.61929 13.5 9 13.5C10.3807 13.5 11.5 14.6193 11.5 16C11.5 17.3807 10.3807 18.5 9 18.5C7.61929 18.5 6.5 17.3807 6.5 16ZM18.5 23C18.5 21.6193 19.6193 20.5 21 20.5C22.3807 20.5 23.5 21.6193 23.5 23C23.5 24.3807 22.3807 25.5 21 25.5C19.6193 25.5 18.5 24.3807 18.5 23Z" fill="currentColor" />
    </g>
    <defs>
      <filter id="filter0_d_keypoint" x="3.5" y="4.5" width="23" height="25" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="1.5" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_keypoint" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_keypoint" result="shape" />
      </filter>
    </defs>
  </svg>
);

const IconPolygon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path opacity="0.4" fillRule="evenodd" clipRule="evenodd" d="M7 8C7 7.44772 7.44772 7 8 7H24C24.5523 7 25 7.44772 25 8C25 8.47669 24.6665 8.87548 24.22 8.97572C24.2831 9.22777 24.2486 9.50407 24.1017 9.74285L19.9523 16.4855C21.2075 17.5853 22 19.2001 22 21C22 24.3137 19.3137 27 16 27C12.6863 27 10 24.3137 10 21C10 17.6863 12.6863 15 16 15C16.7956 15 17.555 15.1548 18.2498 15.4361L22.2104 9H8C7.44772 9 7 8.55228 7 8Z" fill="currentColor"/>
    <circle cx="16" cy="21" r="3" fill="currentColor"/>
    <circle cx="8" cy="8" r="2.5" fill="currentColor"/>
    <circle cx="24" cy="8" r="2.5" fill="currentColor"/>
  </svg>
);

const IconWarning = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12 2L2 20H22L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
    <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="17" r="1" fill="currentColor"/>
  </svg>
);

const IconStats = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <rect x="3" y="12" width="4" height="9" rx="1" fill="currentColor" opacity="0.8"/>
    <rect x="10" y="8" width="4" height="13" rx="1" fill="currentColor" opacity="0.8"/>
    <rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor" opacity="0.8"/>
  </svg>
);

const IconRotation = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M2 2H3V10H2V2Z" fill="currentColor" />
    <path d="M2 9H10V10H2V9Z" fill="currentColor" />
    <path fillRule="evenodd" clipRule="evenodd" d="M6.97254 10C6.99068 9.83583 7 9.669 7 9.5C7 7.01472 4.98528 5 2.5 5C2.331 5 2.16417 5.00932 2 5.02746V6.03544C2.1633 6.01209 2.33024 6 2.5 6C4.433 6 6 7.567 6 9.5C6 9.66976 5.98791 9.8367 5.96456 10H6.97254Z" fill="currentColor" />
  </svg>
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
        warningMessage: null,
        showWarning: false,
        isInitializing: true, // Flag per nascondere avvisi durante l'inizializzazione
      };
      this._isMounted = false;
      this.lastMenuInteraction = null;
      this.allowingAutomaticChange = false;
      this.manualLabelChange = false; // Flag to prevent sync override during manual label changes
      this.deselectedRegionIds = new Set(); // Track regions that have been deselected (no longer "new")
    }

    componentDidMount() {
      this._isMounted = true;

      // COMPLETELY override Label Studio hotkeys to route through our menu
      this.setupCustomHotkeys();

      // Expose global warning function for tools to use
      window.showLabelingWarning = this.showWarning;

      // Log current project configuration
      this.logProjectConfiguration();

      // Sync state with Label Studio
      this.syncWithLabelStudio();

      // Applica le preferenze salvate se esistono
      this.applyLoadedPreferences();

      // Check initial selection and show warning if needed
      setTimeout(() => {
        if (this._isMounted) {
          this.updateSelectionWarning();
        }
      }, 100); // After preferences are applied (50ms + margine)

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
            lastLabel: null  // Never restore label across projects
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
          // label is intentionally NOT saved — it changes per project
          timestamp: Date.now()
        };
        localStorage.setItem('customLabelingMenu_preferences', JSON.stringify(prefs));

      } catch (error) {

      }
    };

    // Mostra un avviso visuale sotto il menu
    // autohide: se true, l'avviso si nasconde automaticamente dopo 4 secondi
    showWarning = (message, autohide = true) => {
      if (!this._isMounted) return;

      this.setState({
        warningMessage: message,
        showWarning: true
      });

      // Nascondi automaticamente dopo 4 secondi solo se autohide è true
      if (autohide) {
        if (this.warningTimeout) {
          clearTimeout(this.warningTimeout);
        }
        this.warningTimeout = setTimeout(() => {
          this.hideWarning();
        }, 4000);
      }
    };

    // Nascondi l'avviso
    hideWarning = () => {
      if (!this._isMounted) return;

      this.setState({
        showWarning: false
      });

      // Pulisci il messaggio dopo l'animazione
      setTimeout(() => {
        if (this._isMounted) {
          this.setState({ warningMessage: null });
        }
      }, 300);
    };

    // Controlla lo stato della selezione e mostra/nascondi l'avviso appropriato
    updateSelectionWarning = () => {
      if (!this._isMounted) return;

      // Non mostrare avvisi durante l'inizializzazione
      if (this.state.isInitializing) {
        return;
      }

      // Non mostrare avvisi se c'è un'annotazione selezionata
      // (le statistiche gestiranno il caso di annotazione senza label)
      const stats = this.getSelectedRegionStats();
      if (stats) {
        if (this.state.showWarning) {
          this.hideWarning();
        }
        return;
      }

      const { pendingTool, pendingLabel } = this.state;
      const hasTool = Boolean(pendingTool);
      const hasLabel = Boolean(pendingLabel);

      // Determina il messaggio in base a cosa manca
      let message = null;

      if (!hasTool && !hasLabel) {
        message = 'Seleziona un tool e una label per iniziare. Usa i pulsanti del menu o le scorciatoie da tastiera (B/R/K/E per i tool, 1-9 per le label).';
      } else if (!hasTool && hasLabel) {
        message = 'Seleziona un tool per disegnare. Premi B (Brush), R (Rectangle), K (Keypoint), G (Polygon) o E (Eraser).';
      } else if (hasTool && !hasLabel && pendingTool !== 'Eraser') {
        // Eraser non ha bisogno di una label
        message = 'Seleziona una label prima di disegnare! Premi un tasto numerico (1-9) oppure clicca direttamente sul menu per selezionare una label.';
      }

      // Mostra o nascondi l'avviso
      if (message) {
        // Solo aggiorna se il messaggio è diverso per evitare loop di aggiornamento
        if (this.state.warningMessage !== message || !this.state.showWarning) {
          // Cancella il timeout automatico se presente, vogliamo che l'avviso rimanga
          if (this.warningTimeout) {
            clearTimeout(this.warningTimeout);
            this.warningTimeout = null;
          }

          this.setState({
            warningMessage: message,
            showWarning: true
          });
        }
      } else {
        // Tutto selezionato correttamente, nascondi l'avviso
        if (this.state.showWarning) {
          this.hideWarning();
        }
      }
    };

    // Applica le preferenze caricate al mount del componente
    applyLoadedPreferences = () => {
      const { pendingTool, pendingLabel } = this.state;

      // Se abbiamo sia tool che label salvati, applicali
      if (pendingTool && pendingLabel) {

        // Applica con un delay minimo per dare tempo al sistema di inizializzarsi
        setTimeout(() => {
          if (this._isMounted) {
            this.applyToolLabelCombination(pendingTool, pendingLabel);
            // Termina l'inizializzazione dopo aver applicato le preferenze
            this.setState({ isInitializing: false });
          }
        }, 50);
      } else if (pendingTool) {
        // Solo il tool è salvato

        setTimeout(() => {
          if (this._isMounted) {
            this.activateToolOnly(pendingTool);
            // Termina l'inizializzazione dopo aver applicato le preferenze
            this.setState({ isInitializing: false });
          }
        }, 50); // Ridotto da 500ms a 50ms
      } else {
        // Nessuna preferenza salvata, termina subito l'inizializzazione
        setTimeout(() => {
          if (this._isMounted) {
            this.setState({ isInitializing: false });
          }
        }, 50); // Ridotto da 500ms a 50ms
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

        // Don't intercept keys if user is typing in an input field
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable ||
          activeElement.classList.contains('editable')
        );

        if (isTyping) {
          return; // Let the key go through normally
        }

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
        try { hotkeys.removeKey("b"); } catch(e) {}
        try { hotkeys.removeKey("r"); } catch(e) {}
        try { hotkeys.removeKey("k"); } catch(e) {}
        try { hotkeys.removeKey("g"); } catch(e) {}
        try { hotkeys.removeKey("e"); } catch(e) {}
        hotkeys.addKey("b", this.handleBrushHotkey, "Custom Brush selection");
        hotkeys.addKey("r", this.handleRectangleHotkey, "Custom Rectangle selection");
        hotkeys.addKey("k", this.handleKeypointHotkey, "Custom Keypoint selection");
        hotkeys.addKey("g", this.handlePolygonHotkey, "Custom Polygon selection");
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

      // Clean up warning function
      if (window.showLabelingWarning === this.showWarning) {
        window.showLabelingWarning = null;
      }

      // Clean up warning timeouts
      if (this.warningTimeout) {
        clearTimeout(this.warningTimeout);
        this.warningTimeout = null;
      }
      if (this.warningUpdateTimeout) {
        clearTimeout(this.warningUpdateTimeout);
        this.warningUpdateTimeout = null;
      }
      if (this.syncTimeout) {
        clearTimeout(this.syncTimeout);
        this.syncTimeout = null;
      }

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
      // Debounce sync to prevent flicker when rapidly switching between regions
      if (this.syncTimeout) {
        clearTimeout(this.syncTimeout);
      }
      this.syncTimeout = setTimeout(() => {
        this.syncWithLabelStudio();
      }, 50); // Wait 50ms for selections to stabilize

      // Check and update warning based on current selection (with debounce)
      // Debounce per evitare che l'avviso appaia durante cicli rapidi di selezione/deselezione
      if (this.warningUpdateTimeout) {
        clearTimeout(this.warningUpdateTimeout);
      }
      this.warningUpdateTimeout = setTimeout(() => {
        this.updateSelectionWarning();
      }, 500); // Attendi 500ms prima di aggiornare l'avviso (aumentato per dare tempo ai labels)
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
                // ✅ Non usa più 'Unknown' come fallback
                if (this.state.pendingLabel) {
                  this.applyToolLabelCombination(regionType, this.state.pendingLabel);
                }
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

      // Skip sync if we're in the middle of a manual label change
      if (this.manualLabelChange) {
        return;
      }

      const { item } = this.props;

      // Track regions that have been deselected (no longer "new")
      try {
        if (item && isAlive(item)) {
          const annotation = item?.annotation;
          if (annotation && isAlive(annotation) && annotation.regionStore) {
            const currentlySelected = new Set((annotation.selectedRegions || []).map(r => r?.id).filter(Boolean));

            // Track all regions that were marked as new but are no longer selected
            annotation.regionStore.regions?.forEach(region => {
              if (region && isAlive(region) && region.isNewAnnotation && !currentlySelected.has(region.id)) {
                if (!this.deselectedRegionIds.has(region.id)) {
                  this.deselectedRegionIds.add(region.id);
                }
              }
            });
          }
        }
      } catch (trackError) {
        // Ignore errors in tracking
      }

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
        const annotation = item?.annotation;

        // Get current tool - be more precise in mapping
        let currentTool = null;
        if (selectedTool) {
          const toolName = selectedTool.fullName?.toLowerCase() || '';
          if (toolName.includes('eraser')) currentTool = 'Eraser';
          else if (toolName.includes('brush')) currentTool = 'Brush';
          else if (toolName.includes('polygon')) currentTool = 'Polygon';
          else if (toolName.includes('rectangle')) currentTool = 'Rectangle';
          else if (toolName.includes('keypoint') || toolName.includes('point')) currentTool = 'Keypoint';
        }

        // DIRECT APPROACH: If Label Studio changed tool, trust that change
        // The issue is that selectedRegions isn't reliable, but tool changes are
        const effectiveTool = currentTool;
        let effectiveLabel = null;

        // Check if there's a selected region and if it has labels
        if (annotation && isAlive(annotation)) {
          const selectedRegions = annotation.selectedRegions || [];

          if (selectedRegions.length > 0) {
            const region = selectedRegions[0];

            // Skip label sync ONLY for newly created regions that don't have labels yet
            // Once a new region has labels OR has been deselected, we should sync normally
            const hasAnyLabels = region.labelings?.[0]?.selectedLabels?.length > 0 ||
                                 region.labelings?.[0]?.mainValue ||
                                 region.labels?.length > 0;

            const isActuallyNew = region.isNewAnnotation && !this.deselectedRegionIds.has(region.id);

            if (isActuallyNew && !hasAnyLabels) {
              // Don't change effectiveLabel, keep current state
              effectiveLabel = this.state.pendingLabel;
            } else {
              // Check if the region has labels assigned
              // Try multiple possible locations where labels might be stored
              let regionLabels = null;

              // Approach 1: Check selectedValues (for some region types)
              if (region.labelings?.[0]?.selectedValues?.length > 0) {
                regionLabels = region.labelings[0].selectedValues;
              }
              // Approach 2: Check selectedLabels (returns LabelModel objects - extract value field)
              else if (region.labelings?.[0]?.selectedLabels?.length > 0) {
                const selectedLabels = region.labelings[0].selectedLabels;
                // Extract 'value' field from LabelModel objects
                regionLabels = selectedLabels.map(label => label?.value || label).filter(Boolean);
              }
              // Approach 3: Check direct labels property
              else if (region.labels?.length > 0) {
                regionLabels = region.labels;
              }
              // Approach 4: Check mainValue
              else if (region.labelings?.[0]?.mainValue) {
                const mainValue = region.labelings[0].mainValue;
                regionLabels = Array.isArray(mainValue) ? mainValue : [mainValue];
              }

              if (regionLabels && regionLabels.length > 0) {
                // Region has labels - get the first one
                effectiveLabel = regionLabels[0];
              } else {
                // Region has NO labels - deselect all
                // NOTE: We only reach here for OLD regions (isNewAnnotation is handled above)
                // So if an old region has no labels, we should deselect everything
                effectiveLabel = null;
              }
            }
          } else {
            // No region selected - check for currently selected labels in controls
            try {
              if (annotation.root && isAlive(annotation.root) && Array.isArray(annotation.root.children)) {
                for (const control of annotation.root.children) {
                  if (control && isAlive(control) && control?.type?.includes('labels')) {
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
        'Polygon': 'polygonlabels',
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
        'polygonlabels': 'Polygon',
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
        const controlType = this.mapToolNameToControlType(toolName);
        const newTool = this.findToolByControlType(controlType);

        if (!newTool) {
          console.error(`[CustomMenu] applyToolLabel: tool NOT FOUND for "${toolName}" (controlType="${controlType}"). allTools=`, toolsManager.allTools().map(t => t.fullName));
          return false;
        }

        // Only switch tool if it's actually different - re-selecting the same tool
        // calls unselectAll() internally which can interfere with label selection
        if (currentTool !== newTool) {
          if (currentTool?.handleToolSwitch) {
            currentTool.handleToolSwitch(newTool);
          }
          toolsManager.selectTool(newTool, true);
        }

        // Step 3: Find the control that has the label.
        // First try the "canonical" control for the tool type, then fall back to any control.
        const annotation = item.annotation;
        let control = this.findControlByToolType(toolName);
        let labelObj = (control && isAlive(control) && Array.isArray(control?.children))
          ? control.children.find(l => l && isAlive(l) && l.value === labelValue)
          : null;

        if (!labelObj && annotation?.root?.children) {
          // Fallback: search in ALL label controls
          for (const ctrl of annotation.root.children) {
            if (ctrl && isAlive(ctrl) && ctrl.type?.includes('labels') && Array.isArray(ctrl.children)) {
              const found = ctrl.children.find(l => l && isAlive(l) && l.value === labelValue);
              if (found) {
                control = ctrl;
                labelObj = found;
                console.warn(`[CustomMenu] setDirectSelection: label "${labelValue}" not in ${toolName} control, using fallback control type="${ctrl.type}"`);
                break;
              }
            }
          }
        }

        if (!control || !isAlive(control)) {
          return true; // Tool activation succeeded, label selection not possible
        }
        if (!control.children || !Array.isArray(control.children)) {
          return true;
        }
        if (!labelObj || !isAlive(labelObj)) {
          console.warn(`[CustomMenu] setDirectSelection: label "${labelValue}" not found in any control`);
          return true;
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

              // If we used a fallback control (not the canonical one for this tool),
              // also try to select the same label value in the canonical control (tag4 for Polygon).
              // This ensures the polygon region is stored with the correct from_name.
              const canonicalControl = this.findControlByToolType(toolName);
              if (canonicalControl && isAlive(canonicalControl) && canonicalControl !== control &&
                  Array.isArray(canonicalControl.children)) {
                const canonicalLabel = canonicalControl.children.find(l => l && isAlive(l) && l.value === labelValue);
                if (canonicalLabel && isAlive(canonicalLabel) && canonicalLabel.setSelected) {
                  // Clear other selections in canonical control first
                  canonicalControl.children.forEach(l => {
                    if (l && isAlive(l) && l !== canonicalLabel && l.selected && l.setSelected) {
                      try { l.setSelected(false); } catch(e) {}
                    }
                  });
                  try { canonicalLabel.setSelected(true); } catch(e) {}
                }
              }

              return true;
            } catch (err) {
              console.error(`[CustomMenu] setDirectSelection: error calling setSelected:`, err);
              return true; // Tool activation still succeeded
            }
          }
        } catch (selectionError) {
          console.error(`[CustomMenu] setDirectSelection: selectionError:`, selectionError);
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
        'Polygon': 'polygonlabels',
        'Eraser': 'eraser'
      };
      return mapping[toolName] || toolName.toLowerCase() + 'labels';
    };

    // Helper to map region type to tool name
    mapRegionTypeToToolName = (regionType) => {
      const mapping = {
        'brushregion': 'Brush',
        'rectangleregion': 'Rectangle',
        'keypointregion': 'Keypoint',
        'polygonregion': 'Polygon'
      };
      return mapping[regionType] || 'Rectangle';
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

      // FIRST: Check if there are selected regions and apply label to them
      const { item } = this.props;
      if (item && isAlive(item)) {
        const annotation = item?.annotation;
        if (annotation && isAlive(annotation)) {
          const selectedRegions = annotation.selectedRegions || [];

          if (selectedRegions.length > 0) {

            // Apply label change to each selected region (respecting isNewAnnotation flag)
            let labelChanged = false;
            selectedRegions.forEach(region => {
              if (region && isAlive(region) && !region.isReadOnly()) {
                // Skip if this is a newly created annotation that hasn't been deselected yet
                // (once deselected, it's no longer "new" and can be edited)
                const isActuallyNew = region.isNewAnnotation && !this.deselectedRegionIds.has(region.id);
                if (isActuallyNew) {
                  return;
                }

                // Find the appropriate control for this region type
                const toolName = this.mapRegionTypeToToolName(region.type);
                const control = this.findControlByToolType(toolName);
                if (control && isAlive(control) && Array.isArray(control.children)) {
                  // Find the label object with the specified value
                  const labelObj = control.children.find(label =>
                    label && isAlive(label) && label.value === labelValue
                  );

                  if (labelObj && isAlive(labelObj)) {

                    // First, unselect all labels in this control
                    control.children.forEach(label => {
                      if (label && isAlive(label) && label.selected && label.setSelected) {
                        label.setSelected(false);
                      }
                    });

                    // Then select the new label
                    if (labelObj.setSelected) {
                      labelObj.setSelected(true);
                    }

                    // Apply the label change to the region
                    region.setValue(control);
                    region.notifyDrawingFinished();
                    region.updateSpans?.();
                    labelChanged = true;
                  }
                }
              }
            });

            // Always update the UI state when there are selected regions
            // This ensures the menu shows the correct label even if we skipped changing new regions
            // Set flag to prevent syncWithLabelStudio from overriding our change
            this.manualLabelChange = true;

            this.setState({ pendingLabel: labelValue });
            this.savePreferences(this.state.pendingTool, labelValue);

            // Clear the flag after a short delay to allow sync to resume
            setTimeout(() => {
              this.manualLabelChange = false;
            }, 300);

            // IMPORTANT: If we skipped all regions (labelChanged = false), we still need to
            // apply the label to Label Studio so new annotations use the correct label
            if (!labelChanged && this.state.pendingTool) {
              this.applyToolLabelCombination(this.state.pendingTool, labelValue);
            }

            return; // Don't proceed to tool/label combination logic
          }
        }
      }

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
        const controlType = this.mapToolNameToControlType(toolName);
        const newTool = this.findToolByControlType(controlType);

        if (!newTool) {
          console.error(`[CustomMenu] activateToolOnly: tool NOT FOUND for "${toolName}" (controlType="${controlType}"). allTools=`, toolsManager.allTools().map(t => t.fullName));
          return;
        }

        console.log(`[CustomMenu] activateToolOnly: switching to "${toolName}" (${newTool.fullName})`);

        // Only switch if actually different
        if (currentTool !== newTool) {
          if (currentTool?.handleToolSwitch) {
            currentTool.handleToolSwitch(newTool);
          }
          toolsManager.selectTool(newTool, true);
        }
      } catch (error) {
        console.error(`[CustomMenu] activateToolOnly error for "${toolName}":`, error);
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

    handlePolygonHotkey = () => {
      this.lastMenuInteraction = Date.now();
      this.handleToolClick('Polygon');
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

      try {
        const { item } = this.props;
        if (item && isAlive(item)) {
          const annotation = item?.annotation;
          if (annotation && isAlive(annotation)) {
            // First, deselect any selected regions (annotations)
            // Use annotation's unselectAll method instead of calling setSelected on each region
            try {
              if (annotation.unselectAll && typeof annotation.unselectAll === 'function') {
                annotation.unselectAll();
              } else if (annotation.regionStore?.unselectAll && typeof annotation.regionStore.unselectAll === 'function') {
                annotation.regionStore.unselectAll();
              } else {
                // Fallback: try to deselect directly if methods not available
                const selectedRegions = [...(annotation.selectedRegions || [])];
                selectedRegions.forEach(region => {
                  try {
                    if (region && isAlive(region)) {
                      // Try different deselection methods
                      if (region.unselectRegion) region.unselectRegion();
                      else if (region.setSelected) region.setSelected(false);
                    }
                  } catch (e) {
                    // Ignore individual region errors
                  }
                });
              }
            } catch (deselectError) {
              console.warn('[CustomLabelingMenu] Could not deselect regions:', deselectError);
            }

            // Then, deselect all labels in controls
            if (annotation.root?.children) {
              annotation.root.children.forEach(control => {
                if (control && isAlive(control) && typeof control.unselectAll === 'function') {
                  control.unselectAll();
                }
              });
            }
          }
        }
      } catch (e) {
        console.error('[CustomLabelingMenu] Error clearing selections:', e);
      }

      this.setState({
        pendingLabel: null,
        pendingTool: null,
      }, () => {
        // Salva lo stato "pulito"
        this.savePreferences(null, null);
      });
    };

    // Get statistics for the currently selected region
    getSelectedRegionStats = () => {
      try {
        const { item } = this.props;
        if (!item || !isAlive(item)) return null;

        const annotation = item?.annotation;
        if (!annotation || !isAlive(annotation)) return null;

        const selectedRegions = annotation.selectedRegions || [];
        if (selectedRegions.length === 0) return null;

        const region = selectedRegions[0];
        if (!region || !isAlive(region)) return null;

        // Collect statistics
        const stats = {
          id: region.id,
          type: region.type,
          labels: [],
        };

        // Get labels
        if (region.labelings && region.labelings.length > 0) {
          const labeling = region.labelings[0];
          if (labeling.selectedLabels && labeling.selectedLabels.length > 0) {
            stats.labels = labeling.selectedLabels.map(l => l.value || l);
          } else if (labeling.mainValue) {
            stats.labels = Array.isArray(labeling.mainValue) ? labeling.mainValue : [labeling.mainValue];
          }
        }

        // IMPORTANT: Filter out deleted labels
        // Check if the labels still exist in the available labels list
        const availableLabels = this.getAvailableLabels();
        stats.labels = stats.labels.filter(label => availableLabels.includes(label));

        // Get type-specific info (with decimals like Label Studio)
        if (region.type === 'rectangleregion') {
          stats.typeName = 'Rectangle';
          if (region.x !== undefined) stats.x = region.x;
          if (region.y !== undefined) stats.y = region.y;
          if (region.width !== undefined) stats.width = region.width;
          if (region.height !== undefined) stats.height = region.height;
          if (region.rotation !== undefined) stats.rotation = region.rotation;
        } else if (region.type === 'brushregion') {
          stats.typeName = 'Brush';
          if (region.x !== undefined) stats.x = region.x;
          if (region.y !== undefined) stats.y = region.y;
          if (region.width !== undefined) stats.width = region.width;
          if (region.height !== undefined) stats.height = region.height;
        } else if (region.type === 'keypointregion') {
          stats.typeName = 'Keypoint';
          if (region.x !== undefined) stats.x = region.x;
          if (region.y !== undefined) stats.y = region.y;
        }

        return stats;
      } catch (error) {
        console.error('[CustomLabelingMenu] Error getting region stats:', error);
        return null;
      }
    };

    // Get available labels from all label controls
    getAvailableLabels = () => {
      try {
        const { item } = this.props;

        if (!item || !isAlive(item)) {
          return [];  // ✅ Ritorna array vuoto invece di ['Unknown']
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

        // ✅ Rimosso: if (availableLabels.size === 0) availableLabels.add('Unknown');

        return Array.from(availableLabels);
      } catch (error) {

        return [];  // ✅ Ritorna array vuoto invece di ['Unknown']
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
      else if (toolName.includes('polygon')) return 'Polygon';
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
          className="lsf-custom-labeling-menu"
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
                // Check our internal state first - if we have a pendingLabel, use ONLY that
                // This prevents showing multiple labels as selected when switching between regions
                const isSelectedByMenu = this.state.pendingLabel === labelValue;
                const isSelectedNatively = nativeSelectedLabels.includes(labelValue);

                // Give priority to our state: if we have a pendingLabel, ignore native selection
                const isSelected = this.state.pendingLabel
                  ? isSelectedByMenu  // Only use our state
                  : isSelectedNatively;  // Fall back to native state if we have no pendingLabel

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
                  { name: 'Brush', type: 'brushlabels', icon: <IconBrush /> },
                  { name: 'Eraser', type: 'eraser', icon: <IconEraser /> }
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

              {/* Seconda riga: Rectangle, Keypoint e Polygon */}
              {[
                { name: 'Rectangle', type: 'rectanglelabels', icon: <IconRectangle /> },
                { name: 'Keypoint', type: 'keypointlabels', icon: <IconKeypoint /> },
                { name: 'Polygon', type: 'polygonlabels', icon: <IconPolygon /> }
              ].map((tool, index) => {
                // Check both our internal state and native state for better accuracy
                const isSelectedByMenu = this.state.pendingTool === tool.name;
                const isSelectedNatively = nativeToolName === tool.name;
                const isSelected = isSelectedByMenu || isSelectedNatively;

                const toolHotkey = ['R', 'K', 'G'][index];

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

          {/* Warning Message - mostra avvisi sotto il menu */}
          {this.state.showWarning && this.state.warningMessage && (
            <div
              style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '6px',
                padding: '12px',
                marginTop: '12px',
                fontSize: '12px',
                color: '#856404',
                lineHeight: '1.5',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                animation: 'slideDown 0.3s ease-out',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <span style={{ flexShrink: 0 }}><IconWarning size={16} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Attenzione</div>
                <div>{this.state.warningMessage}</div>
              </div>
              <button
                onClick={this.hideWarning}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#856404',
                  padding: '0',
                  lineHeight: '1',
                  flexShrink: 0
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Region Statistics - mostra statistiche annotazione selezionata */}
          {(() => {
            const stats = this.getSelectedRegionStats();
            return stats ? (
              <div
                style={{
                  backgroundColor: '#e6f7ff',
                  border: '1px solid #91d5ff',
                  borderRadius: '6px',
                  padding: '12px',
                  marginTop: '12px',
                  fontSize: '11px',
                  color: '#0050b3',
                  lineHeight: '1.6',
                  animation: 'slideDown 0.3s ease-out',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IconStats /> {stats.typeName || stats.type}</span>
                  {stats.labels.length > 0 ? (
                    <span style={{
                      backgroundColor: this.getLabelColor(stats.labels[0]) + '40',
                      color: this.getLabelColor(stats.labels[0]),
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontWeight: 'normal'
                    }}>
                      {stats.labels.join(', ')}
                    </span>
                  ) : (
                    <span style={{
                      backgroundColor: '#e8e8e8',
                      color: '#666666',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontWeight: 'normal',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <IconWarning size={12} /> Nessuna label
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                  {stats.x !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <strong style={{ minWidth: '16px' }}>X:</strong>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>
                        {stats.x.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {stats.y !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <strong style={{ minWidth: '16px' }}>Y:</strong>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>
                        {stats.y.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {stats.width !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <strong style={{ minWidth: '16px' }}>W:</strong>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>
                        {stats.width.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {stats.height !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <strong style={{ minWidth: '16px' }}>H:</strong>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>
                        {stats.height.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {stats.rotation !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', gridColumn: '1 / -1' }}>
                      <strong style={{ minWidth: '16px', display: 'flex', alignItems: 'center', gap: '2px' }}><IconRotation />:</strong>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>
                        {stats.rotation.toFixed(2)}°
                      </span>
                    </div>
                  )}
                </div>
                {/* Messaggio quando non c'è label */}
                {stats.labels.length === 0 && (
                  <div style={{
                    marginTop: '10px',
                    padding: '8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    border: '1px dashed #999999',
                    fontSize: '10px',
                    color: '#666666',
                    lineHeight: '1.4',
                    textAlign: 'center'
                  }}>
                    * Premi un tasto numerico (1-9) per assegnare una label a questa annotazione
                  </div>
                )}
              </div>
            ) : null;
          })()}

        </div>
      );
    }
  }
);