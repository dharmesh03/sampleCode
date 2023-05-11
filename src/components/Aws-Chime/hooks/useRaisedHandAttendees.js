import { useContext, useEffect, useState } from 'react';
import getChimeContext from '../context/getChimeContext';
import { MessageTopic } from '../enums/MeetingConstant';

export default function useRaisedHandAttendees() {
  const chime = useContext(getChimeContext());
  const [raisedHandAttendees, setRaisedHandAttendees] = useState(new Set());
  useEffect(() => {
    const realTimeRaisedHandAttendees = new Set();
    const callback = (message) => {
      try {
        const attendeeId = message.text();
        if (attendeeId) {
          if (message.topic === MessageTopic.RaiseHand) {
            realTimeRaisedHandAttendees.add(attendeeId);
          } else if (message.topic === MessageTopic.DismissHand) {
            realTimeRaisedHandAttendees.delete(attendeeId);
          }
          setRaisedHandAttendees(new Set(realTimeRaisedHandAttendees));
        }
      } catch (err) {
        chime.setStreamLog(err.stack);
      }
    };
    const raiseHandMessageUpdateCallback = {
      topic: MessageTopic.RaiseHand,
      callback,
    };
    const dismissHandMessageUpdateCallback = {
      topic: MessageTopic.DismissHand,
      callback,
    };
    // remove attendee from raise hand set when attendee leaves
    const ateendeePrecenceCallback = (attendees) => {
      Object.keys(attendees).forEach((attendee) => {
        if (!realTimeRaisedHandAttendees.has(attendee)) {
          realTimeRaisedHandAttendees.delete(attendee);
        }
      });
      realTimeRaisedHandAttendees.forEach((attendee) => {
        if (!attendees[attendee]) {
          realTimeRaisedHandAttendees.delete(attendee);
        }
      });
      setRaisedHandAttendees(new Set(realTimeRaisedHandAttendees));
    };
    chime.subscribeToMessageUpdate(raiseHandMessageUpdateCallback);
    chime.subscribeToMessageUpdate(dismissHandMessageUpdateCallback);
    chime.subscribeToAttendeeUpdate(ateendeePrecenceCallback);
    return () => {
      if (chime) {
        chime.unsubscribeFromMessageUpdate(raiseHandMessageUpdateCallback);
        chime.unsubscribeFromMessageUpdate(dismissHandMessageUpdateCallback);
        chime.unsubscribeFromAttendeeUpdate(ateendeePrecenceCallback);
      }
    };
  }, [chime.audioVideo]);
  return raisedHandAttendees;
}
