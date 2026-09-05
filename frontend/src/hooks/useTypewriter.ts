import { useEffect, useState } from 'react';

/** Types out a string character-by-character for the "AI is thinking" feel. */
export function useTypewriter(text: string, speed = 14, active = true) {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown('');
    setDone(false);
    if (!active || !text) {
      if (!active) setShown(text);
      setDone(!active);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, active]);

  return { shown, done };
}
