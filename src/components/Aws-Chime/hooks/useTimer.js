import moment from 'moment';
import { useEffect, useState } from 'react';

export default function useTimer(startTime, endTime) {
  const [day, setday] = useState(0);
  const [hour, sethour] = useState(0);
  const [minute, setminute] = useState(0);
  const [second, setSeconds] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      const end = endTime;
      const start = startTime;
      const startDiff = moment(start).diff(moment(), 'seconds');
      if (startDiff > 0) {
        const days = moment(start).diff(moment(), 'days');
        const hours = moment(start).add(-days, 'days').diff(moment(), 'hours');
        const minute = moment(start).add(-days, 'days').add(-hours, 'hours').diff(moment(), 'minutes');
        const seconds = moment(start)
          .add(-days, 'days')
          .add(-hours, 'hours')
          .add(-minute, 'minutes')
          .diff(moment(), 'seconds');

        setday(days <= 0 ? '00' : days <= 9 ? `0${days}`.slice(-2) : days);
        sethour(hours <= 0 ? '00' : hours <= 9 ? `0${hours}`.slice(-2) : hours);
        setminute(minute <= 0 ? '00' : minute <= 9 ? `0${minute}`.slice(-2) : minute);
        setSeconds(seconds <= 0 ? '00' : seconds <= 9 ? `0${seconds}`.slice(-2) : seconds);
      } else {
        const days = moment(end).diff(moment(), 'days');
        const hours = moment(end).add(-days, 'days').diff(moment(), 'hours');
        const minute = moment(end).add(-days, 'days').add(-hours, 'hours').diff(moment(), 'minutes');
        const seconds = moment(end)
          .add(-days, 'days')
          .add(-hours, 'hours')
          .add(-minute, 'minutes')
          .diff(moment(), 'seconds');
        setday(days <= 0 ? '00' : days <= 9 ? `0${days}`.slice(-2) : days);
        sethour(hours <= 0 ? '00' : hours <= 9 ? `0${hours}`.slice(-2) : hours);
        setminute(minute <= 0 ? '00' : minute <= 9 ? `0${minute}`.slice(-2) : minute);
        setSeconds(seconds <= 0 ? '00' : seconds <= 9 ? `0${seconds}`.slice(-2) : seconds);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [second, minute, hour, day]);
  return { seconds: second, days: day, hours: hour, minutes: minute };
}
