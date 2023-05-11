import { useContext, useEffect, useState } from 'react';
import getChimeContext from '../context/getChimeContext';

export default function useAttendees() {
  const chime = useContext(getChimeContext());
  const [attendees, setAttendees] = useState(chime.attendees || {});
  useEffect(() => {
    const callback = (newAttendees) => {
      setAttendees({
        ...newAttendees,
      });
    };
    chime.subscribeToAttendeeUpdate(callback);
    return () => {
      chime.unsubscribeFromAttendeeUpdate(callback);
    };
  }, [chime.audioVideo]);
  return attendees;
}
