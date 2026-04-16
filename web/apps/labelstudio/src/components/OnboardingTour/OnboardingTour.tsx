import { useEffect, useState } from "react";
import { startOnboardingTour } from "../../utils/onboarding-tour";

const TOUR_SEEN_KEY = 'onboarding-tour-seen'; // Indica se l'utente ha già visto il tour
const TOUR_STEP_KEY = 'onboarding-tour-current-step';
const START_TOUR_ON_LOAD_KEY = 'start-tour-on-load'; // Flag per avviare il tour dopo redirect

export const OnboardingTour = () => {
  const [tourStarted, setTourStarted] = useState(false);

  useEffect(() => {
    // Previeni riavvii multipli nella stessa sessione del componente
    if (tourStarted) return;

    const tourSeen = localStorage.getItem(TOUR_SEEN_KEY);
    const savedStep = localStorage.getItem(TOUR_STEP_KEY);
    const shouldStartTour = localStorage.getItem(START_TOUR_ON_LOAD_KEY);

    console.log('[OnboardingTour] useEffect - Checking flags:', {
      tourSeen,
      savedStep,
      shouldStartTour,
      tourStarted
    });

    // Se c'è il flag per avviare il tour dopo redirect
    if (shouldStartTour === 'true') {
      console.log('[OnboardingTour] Flag detected! Starting tour after redirect...');
      localStorage.removeItem(START_TOUR_ON_LOAD_KEY);
      localStorage.setItem(TOUR_SEEN_KEY, 'true'); // garantisce che dopo il tour non riparta
      const timer = setTimeout(() => {
        startOnboardingTour();
        setTourStarted(true);
      }, 500);
      return () => clearTimeout(timer);
    }

    // Se c'è uno step salvato, il tour è in corso e deve riprendere (anche dopo navigazione pagina)
    if (savedStep) {
      localStorage.setItem(TOUR_SEEN_KEY, 'true'); // garantisce che dopo il tour non riparta
      const timer = setTimeout(() => {
        startOnboardingTour();
        setTourStarted(true);
      }, 1000);
      return () => clearTimeout(timer);
    }

    // Se l'utente ha già visto il tour (anche se lo ha chiuso subito), non riavviarlo automaticamente
    if (tourSeen === 'true') {
      return;
    }

    // Prima volta: avvia il tour automaticamente e segna come "visto"
    const timer = setTimeout(() => {
      localStorage.setItem(TOUR_SEEN_KEY, 'true');
      startOnboardingTour();
      setTourStarted(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [tourStarted]);

  // Bottone per avviare manualmente il tour
  return (
    <button
      onClick={() => {
        // Resetta tutti i flag del tour per forzare il riavvio
        localStorage.removeItem(TOUR_STEP_KEY);
        localStorage.removeItem(TOUR_SEEN_KEY);
        setTourStarted(false);

        // Costruisci l'URL target dinamicamente (solo porta dinamica)
        const targetPath = '/projects/1/data?tab=1';
        const targetUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}${targetPath}`;
        const currentUrl = window.location.href;

        // Se l'URL corrente è diverso dal target, salva il flag e reindirizza
        if (currentUrl !== targetUrl) {
          console.log('[OnboardingTour] Setting flag to start tour after redirect');
          localStorage.setItem(START_TOUR_ON_LOAD_KEY, 'true');
          window.location.href = targetUrl;
        } else {
          // Se siamo già sull'URL corretto, avvia il tour
          console.log('[OnboardingTour] Starting tour immediately');
          setTimeout(() => {
            startOnboardingTour();
            setTourStarted(true);
          }, 100);
        }
      }}
      className="lsf-button-ls lsf-button-ls_size_compact lsf-button-ls_look_"
      title="Help"
      aria-label="Help - Riavvia il tour guidato"
      style={{
        backgroundColor: 'white',
        color: '#333',
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        border: '1px solid #ddd',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        padding: '0',
      }}
    >
      ?
    </button>
  );
};
