import { useContext, useEffect, useState } from 'react';
import getChimeContext from '../context/getChimeContext';

export default function useAttendee(attendeeId) {
  const chime = useContext(getChimeContext());
  const [attendee, setAttendee] = useState(chime.roster[attendeeId] || {});
  useEffect(() => {
    let previousRosterAttendee = null;
    const callback = (newRoster) => {
      const rosterAttendee = newRoster[attendeeId] ? { ...newRoster[attendeeId] } : null;

      // In the classroom demo, we don't subscribe to volume and signal strength changes.
      // The VideoNameplate component that uses this hook will re-render only when name and muted status change.
      if (rosterAttendee) {
        if (
          !previousRosterAttendee ||
          previousRosterAttendee.name !== rosterAttendee.name ||
          previousRosterAttendee.muted !== rosterAttendee.muted ||
          previousRosterAttendee.active !== rosterAttendee.active ||
          previousRosterAttendee.volume !== rosterAttendee.volume ||
          previousRosterAttendee.isPin !== rosterAttendee.isPin
        ) {
          setAttendee(rosterAttendee);
        }
      }
      previousRosterAttendee = rosterAttendee;
    };
    chime.subscribeToRosterUpdate(callback);
    return () => {
      chime.unsubscribeFromRosterUpdate(callback);
    };
  }, [chime.audioVideo]);
  return attendee;
}
