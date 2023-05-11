import { useContext, useEffect, useState } from 'react';
import getChimeContext from '../context/getChimeContext';

export default function useRoster() {
  const chime = useContext(getChimeContext());
  const [roster, setRoster] = useState(chime.roster || {});
  useEffect(() => {
    const callback = (newRoster) => {
      setRoster({
        ...newRoster,
      });
    };
    chime.subscribeToRosterUpdate(callback);
    return () => {
      chime.unsubscribeFromRosterUpdate(callback);
    };
  }, [chime.audioVideo]);
  return roster;
}
