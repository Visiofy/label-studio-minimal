import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_STEP_KEY = 'onboarding-tour-current-step';

// Aspetta che un elemento esista nel DOM
const waitForElement = (selector: string, timeout = 5000): Promise<Element | null> => {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
};

export const startOnboardingTour = async () => {
  // Controlla se c'è un tour in corso e da quale step ripartire
  const savedStep = localStorage.getItem(TOUR_STEP_KEY);
  const startStep = savedStep ? parseInt(savedStep, 10) : 0;

  // Determina quale elemento aspettare in base allo step
  // IMPORTANTE: l'array deve avere lo stesso numero di elementi dell'array steps
  const stepSelectors = [
    '.lsf-button-ls',           // [0] STEP 1 - Bottone config
    '.lsf-configure__add-labels', // [1] STEP 4 - Form (click Add Labels)
    '.lsf-button-ls.lsf-button-ls_size_compact.lsf-button-ls_look_primary', // [2] STEP 5 - Bottone Save
    '.lsf-button-ls.lsf-button-ls_size_compact.lsf-button-ls_look_secondary', // [3] STEP 6 - Bottone Back
    '.lsf-table__row-wrapper',   // [4] STEP 7 - Tabella
    '.lsf-wrapper.lsf-wrapper_showingBottomBar', // [5] STEP 8 - Labeling
    '.container--_mzc9',      // [6] STEP 9 - Immagine
    '.lsf-custom-labeling-menu', // [7] STEP 10 - Pannello Labels/Tools
    '.lsf-sidepanels__wrapper:not(.lsf-sidepanels__wrapper_align_left)', // [8] STEP 11 - Sidepanel
    '.lsf-submit',  // [9] STEP 12 - Bottone Submit
    'button.lsf-button-ls', // [10] STEP 13 - Bottone Export
    'body'                     // [11] STEP 14 - Tour completato
  ];

  const targetSelector = stepSelectors[startStep] || stepSelectors[0];

  // Aspetta che l'elemento esista prima di avviare il tour
  // Per lo step 6 (tabella), aspetta più a lungo perché potrebbe essere virtualizzata
  const timeout = startStep === 6 ? 15000 : 5000;
  const element = await waitForElement(targetSelector, timeout);
  if (!element) {
    console.warn(`Tour element ${targetSelector} not found, aborting tour`);
    return;
  }

  // Per lo step 6, aspetta un po' di più per assicurarsi che la tabella sia completamente renderizzata
  if (startStep === 6) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const driverObj = driver({
    showProgress: true,
    allowClose: true,

    onDestroyed: () => {
      // Quando il tour viene chiuso/distrutto, pulisci lo step salvato
      // Il tour ripartirà dall'inizio solo se l'utente preme "Riavvia Tour"
      localStorage.removeItem(TOUR_STEP_KEY);
    },

    steps: [
      // STEP 1: Bottone Data Config - aspetta click dell'utente
      {
        element: '.lsf-button-ls',
        popover: {
          title: 'Configura i tuoi dati',
          description: 'Clicca questo bottone per aprire la configurazione delle etichette',
          side: 'bottom',
          showButtons: ['close'],
        },
        onHighlighted: (element) => {
          // Intercetta il click sul bottone
          const targetElement = (element as any)?.element || element;
          if (targetElement && targetElement instanceof HTMLElement) {
            const clickHandler = () => {
              // Salva immediatamente lo step successivo prima che cambi la route
              localStorage.setItem(TOUR_STEP_KEY, '1');
              targetElement.removeEventListener('click', clickHandler);
            };
            targetElement.addEventListener('click', clickHandler);
          }
        }
      },

      

      // STEP 2: Form intero (textarea + bottone insieme evidenziati)
      {
        element: '.lsf-configure__add-labels',
        popover: {
          title: 'Aggiungi una label',
          description: 'Ora inserisci le tue etichette nella casella e premi "Add Labels" per aggiungere una label',
          side: 'left',
          showButtons: ['close'],
        },
        onHighlighted: (element) => {
          // Intercetta il click sul bottone "Add Labels"
          const targetElement = (element as any)?.element || element;
          const addButton = targetElement?.querySelector?.('.lsf-button-ls_type_button');

          if (addButton && addButton instanceof HTMLElement) {
            const clickHandler = () => {
              addButton.removeEventListener('click', clickHandler);
              // Aspetta un po' prima di avanzare per dare tempo all'azione di completarsi
              setTimeout(() => driverObj.moveNext(), 500);
            };
            addButton.addEventListener('click', clickHandler);
          }
        }
      },
      // STEP 3: Back e inizia a laberare
      {
        element: '.lsf-button-ls.lsf-button-ls_size_compact.lsf-button-ls_look_primary',
        popover: {
          title: 'Salva il progetto',
          description: 'Ora premi il tasto Save per salvare le etichette!',
          side: 'left',
          showButtons: ['close'],
        },
        onHighlighted: (element) => {
          // Intercetta il click sul bottone "Save"
          const targetElement = (element as any)?.element || element;

          if (targetElement && targetElement instanceof HTMLElement) {
            const clickHandler = () => {
              targetElement.removeEventListener('click', clickHandler);
              // Avanza allo step successivo
              setTimeout(() => driverObj.moveNext(), 500);
            };
            targetElement.addEventListener('click', clickHandler);
          }
        }
      },
      // STEP 4: Torna indietro (ultimo step)
      {
        element: '.lsf-button-ls.lsf-button-ls_size_compact.lsf-button-ls_look_secondary',
        popover: {
          title: 'Torna alla lista progetti',
          description: 'Premi il tasto Back per tornare indietro e iniziare a etichettare i tuoi dati!',
          side: 'left',
          showButtons: ['close'],
        },
        onHighlighted: (element) => {
          // Intercetta il click sul bottone
          const targetElement = (element as any)?.element || element;
          if (targetElement && targetElement instanceof HTMLElement) {
            const clickHandler = () => {
              // Salva immediatamente lo step successivo prima che cambi la route
              localStorage.setItem(TOUR_STEP_KEY, '4'); // [4] = STEP 7 (tabella)
              targetElement.removeEventListener('click', clickHandler);
            };
            targetElement.addEventListener('click', clickHandler);
          }
        }
      },
      // STEP 5: Seleziona un task da etichettare (indice 6)
      {
        element: '.lsf-table__row-wrapper',
        popover: {
          title: 'Seleziona un task da etichettare',
          description: 'Clicca su una riga della tabella per aprire il task e iniziare a etichettare!',
          side: 'right',
          align: 'start',
          showButtons: ['close'],
        },
        onHighlighted: (element) => {
          const targetElement = (element as any)?.element || element;

          if (targetElement && targetElement instanceof HTMLElement) {
            const clickHandler = async () => {
              targetElement.removeEventListener('click', clickHandler);
              // Aspetta che il modal di labeling si carichi nel DOM
              await waitForElement('.lsf-wrapper.lsf-wrapper_showingBottomBar', 5000);
              await new Promise(resolve => setTimeout(resolve, 500));
              driverObj.moveNext();

              // Osserva se l'utente chiude il modal senza completare il tour
              // (navigando via app invece di cliccare il bottone close del driver).
              // In quel caso chiama driverObj.destroy() → onDestroyed → rimuove TOUR_STEP_KEY.
              const modalObserver = new MutationObserver(() => {
                if (!document.querySelector('.lsf-wrapper.lsf-wrapper_showingBottomBar')) {
                  modalObserver.disconnect();
                  try { driverObj.destroy(); } catch (_) {}
                }
              });
              modalObserver.observe(document.body, { childList: true, subtree: true });
            };
            targetElement.addEventListener('click', clickHandler);
          }
        }
      },
      // STEP 6: Tour delle modalità di etichettatura
      {
        element: '.lsf-wrapper.lsf-wrapper_showingBottomBar',
        popover: {
          title: 'Tour delle modalità di etichettatura',
          description: 'Questa è la schermata dove puoi etichettare i tuoi dati utilizzando le etichette che hai appena creato!',
          side: 'left',
          showButtons: ['close', 'next'],
        },
        //  onHighlighted: (element) => {
        //   // Intercetta il click sul bottone "Back"
        //   const targetElement = (element as any)?.element || element;

        //   if (targetElement && targetElement instanceof HTMLElement) {
        //     const clickHandler = () => {
        //       targetElement.removeEventListener('click', clickHandler);
        //       // Il tour finisce dopo il click su Back
        //       setTimeout(() => driverObj.moveNext(), 500);
        //     };
        //     targetElement.addEventListener('click', clickHandler);
        //   }
        // }
      },
      // STEP 7: Tour completo dell'interfaccia di etichettatura
      {
        element: '.container--_mzc9',
        popover: {
          title: 'Immagine',
          description: 'Questa è l\'area dove viene visualizzata l\'immagine da etichettare.',
          side: 'top',
          showButtons: ['close', 'previous', 'next'],
        }
      },
      // STEP 8: Pannello Labels e Tools
      {
        element: '.lsf-custom-labeling-menu',
        popover: {
          title: 'Pannello Labels e Tools',
          description: 'Qui trovi le etichette disponibili e gli strumenti per annotare. Seleziona una label e poi usa un tool (Rectangle, Brush, Keypoint) per creare annotazioni sull\'immagine.',
          side: 'left',
          showButtons: ['close', 'previous', 'next'],
        }
      },
      // STEP 9: Pannello Regions/History/Relations/Info
      {
        element: '.lsf-sidepanels__wrapper:not(.lsf-sidepanels__wrapper_align_left)',
        popover: {
          title: 'Pannello Annotazioni',
          description: 'Qui puoi vedere e gestire le tue annotazioni: Regions (aree annotate), History (cronologia modifiche), Relations (relazioni tra annotazioni) e Info (dettagli).',
          side: 'top',
          showButtons: ['close', 'previous', 'next'],
        }
      },
      
      // STEP 10: Salva e vai al task successivo
      {
        element: '.lsf-submit',
        popover: {
          title: 'Salva le tue annotazioni e procedi al task successivo',
          description: 'Dopo aver annotato, usa questo pulsante per salvare le tue annotazioni per il task corrente e per poi passare al task successivo',
          side: 'top',
          showButtons: ['close', 'previous', 'next'] ,
        }
      },
      // STEP 11: Esporta le annotazioni
      {
        element: () => Array.from(document.querySelectorAll('button.lsf-button-ls')).find(b => b.textContent?.trim() === 'Export'),
        popover: {
          title: 'Esportare le annotazioni',
          description: 'Quando hai finito le tue annotazioni, puoi premere questo bottone per esportare i tuoi task annotati e submittati',
          side: 'bottom',
          showButtons: ['close', 'previous', 'next'],
        }
      },
      // STEP 12: Tour completato
      {
        element: 'body',
        popover: {
          title: 'Complimenti!',
          description: 'Hai completato il tour di onboarding! Ora sei pronto per iniziare a etichettare i tuoi dati.',
          side: 'over',
          align: 'center',

        }
      }
    ]
  });

  // Avvia il tour dallo step salvato o dall'inizio
  driverObj.drive(startStep);
};
2