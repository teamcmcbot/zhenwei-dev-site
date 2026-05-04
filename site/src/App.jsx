import { useEffect, useState } from "react";
import Header from "./components/Header";
import IntroTerminal from "./components/IntroTerminal";
import Skills from "./components/Skills";
import Certifications from "./components/Certifications";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import AwsStaticHosting from "./components/AwsStaticHosting";
import Footer from "./components/Footer";
import { useTheme } from "./hooks/useTheme";
import { loadHomeData } from "./lib/data";

export default function App() {
  const { theme, toggleTheme, easterEggUnlocked } = useTheme();
  const [state, setState] = useState({
    loading: true,
    error: "",
    data: null
  });

  useEffect(() => {
    let active = true;

    loadHomeData()
      .then((data) => {
        if (!active) {
          return;
        }

        setState({ loading: false, error: "", data });
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setState({ loading: false, error: error.message, data: null });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="app-shell" id="top">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Header theme={theme} toggleTheme={toggleTheme} />
      <main id="main-content" className="page-content">
        {state.loading && <p className="status">Loading content...</p>}
        {state.error && (
          <p className="status error" role="alert">
            Failed to load site data: {state.error}
          </p>
        )}
        {state.data && (
          <>
            <IntroTerminal
              intro={state.data.intro}
              theme={theme}
              easterEggUnlocked={easterEggUnlocked}
              skills={state.data.skills}
              certifications={state.data.certifications}
              experiences={state.data.experiences}
              projects={state.data.projects}
            />
            <Skills skills={state.data.skills} />
            <Certifications certifications={state.data.certifications} />
            <Experience experiences={state.data.experiences} />
            <Projects projects={state.data.projects} />
            <AwsStaticHosting data={state.data.awsStaticHosting} />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
