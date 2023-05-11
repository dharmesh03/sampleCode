import { useContext, useEffect, useState } from 'react';
import size from 'lodash/size';
import { DefaultModality } from 'amazon-chime-sdk-js';
import getChimeContext from '../context/getChimeContext';

export default function useRosterCount() {
  const chime = useContext(getChimeContext());
  const [count, setCount] = useState(0);
  useEffect(() => {
    let previousCount = null;
    const callback = (newRoster) => {
      const roster = Object.keys(newRoster).filter((attendeeId) => {
        const modality = new DefaultModality(attendeeId);
        return (
          !modality.hasModality(DefaultModality.MODALITY_CONTENT) &&
          newRoster[attendeeId].attendeeId &&
          newRoster[attendeeId].name
        );
      });
      const currentRosterSize = size(roster);
      if (!previousCount || previousCount !== currentRosterSize) {
        setCount(currentRosterSize);
        previousCount = currentRosterSize;
      }
    };
    chime.subscribeToRosterUpdate(callback);
    return () => {
      chime.unsubscribeFromRosterUpdate(callback);
    };
  }, [chime.audioVideo]);
  return count;
}
