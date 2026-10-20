import React, { createContext, useContext, useState } from 'react';

interface SessionReuseContextType {
  optInReuse: boolean;
  setOptInReuse: (optIn: boolean) => void;
  savedAnswers: Record<string, any>;
  saveAnswers: (answers: Record<string, any>) => void;
  clearAllData: () => void;
}

const SessionReuseContext = createContext<SessionReuseContextType>({
  optInReuse: false,
  setOptInReuse: () => {},
  savedAnswers: {},
  saveAnswers: () => {},
  clearAllData: () => {},
});

export const SessionReuseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [optInReuse, setOptInReuseState] = useState<boolean>(() => {
    return sessionStorage.getItem('jd_opt_in_reuse') === 'true';
  });

  const [savedAnswers, setSavedAnswers] = useState<Record<string, any>>(() => {
    try {
      const stored = sessionStorage.getItem('jd_session_answers');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const setOptInReuse = (optIn: boolean) => {
    setOptInReuseState(optIn);
    sessionStorage.setItem('jd_opt_in_reuse', String(optIn));
    if (!optIn) {
      sessionStorage.removeItem('jd_session_answers');
      setSavedAnswers({});
    }
  };

  const saveAnswers = (answers: Record<string, any>) => {
    if (optInReuse) {
      setSavedAnswers(answers);
      try {
        sessionStorage.setItem('jd_session_answers', JSON.stringify(answers));
      } catch (e) {
        console.warn('Unable to persist session answers', e);
      }
    }
  };

  const clearAllData = () => {
    sessionStorage.removeItem('jd_session_answers');
    sessionStorage.removeItem('jd_opt_in_reuse');
    setSavedAnswers({});
    setOptInReuseState(false);
  };

  return (
    <SessionReuseContext.Provider
      value={{
        optInReuse,
        setOptInReuse,
        savedAnswers,
        saveAnswers,
        clearAllData,
      }}
    >
      {children}
    </SessionReuseContext.Provider>
  );
};

export const useSessionReuse = () => useContext(SessionReuseContext);
