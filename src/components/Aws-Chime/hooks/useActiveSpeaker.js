import { useContext, useEffect, useState } from 'react';
import getChimeContext from '../context/getChimeContext';

export default function useActiveSpeaker() {
  const chime = useContext(getChimeContext());
  const [attendee, setAttendee] = useState();
  useEffect(() => {
    let previousActiveSpeaker = null;
    const callback = (roster) => {
      const activeSpeakerId = Object.keys(roster).find((attendeeId) => roster[attendeeId].active);
      const activeSpeaker = roster[activeSpeakerId];
      if (activeSpeaker) {
        if (
          !previousActiveSpeaker ||
          previousActiveSpeaker.attendeeId !== activeSpeakerId ||
          previousActiveSpeaker.tileId !== activeSpeaker.tileId
        ) {
          setAttendee(activeSpeaker);
        }
        if (previousActiveSpeaker?.attendeeId === activeSpeaker?.attendeeId) {
          setAttendee(activeSpeaker?.muted ? null : activeSpeaker);
        }
      }
      previousActiveSpeaker = activeSpeaker;
    };
    chime.subscribeToRosterUpdate(callback);
    return () => {
      chime.unsubscribeFromRosterUpdate(callback);
    };
  }, [chime.audioVideo]);
  return attendee;
}
