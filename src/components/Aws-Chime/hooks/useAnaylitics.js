import { useContext, useEffect } from 'react';
import moment from 'moment';
import uuid from 'uuid';
import getChimeContext from '../context/getChimeContext';
import { addDataToKinesis, addDataToKinesisStream } from '../../../routes/exhibitorPortal/action';
import { getTimeInLocal } from '../../../routes/event/action/index';
import { AWS_KINESIS_MEETING_ANALYTICS_STREAM, AWS_KINESIS_VIDEO_ANALYTICS_STREAM } from '../../../clientConfig';
import { IsFrom } from '../enums/MeetingConstant';

let interval;
let videoSecondEnd = 0;
let lastTriggredEventTime = 0;
export default function useAnaylics(props) {
  const chime = useContext(getChimeContext());
  const { session, eventData, user, userTicketTypeIds, pushDataToKinesis, meetingId, isFrom } = props;
  const { sessionId } = session || {};
  const { eventId } = eventData || {};
  const { userId } = user || {};
  const streamProvider = 'WORKSHOP';
  const equivalentTimezone = (eventData && eventData.equivalentTimezone) || 'US/Eastern';
  const startTime = getTimeInLocal(session && session.startTime, equivalentTimezone);
  const endTime = getTimeInLocal(session && session.endTime, equivalentTimezone);
  const now = moment();
  const isSessionLive = now <= endTime;

  const handleVideoViewChallange = (videoDuration) => {
    if (pushDataToKinesis && videoDuration && sessionId && userId && eventId) {
      const data = {
        area: 'sessions',
        eventId,
        sessionId,
        userId,
        ticketTypeIds: userTicketTypeIds,
        date: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
      };
      if (isSessionLive) {
        data.videoDuration = videoDuration;
      } else {
        data.recordingVideoDuration = videoDuration;
      }
      addDataToKinesis(data, true);
    }
  };

  const addVideoProgressToKinesis = (videoProgressUUID) => {
    const now = moment();
    // If attendee joined the session before it get started do not send watch events.
    if (now < startTime) {
      return;
    }
    const watchTime = (moment().utc().valueOf() - lastTriggredEventTime) / 1000;

    videoSecondEnd += watchTime;
    const event = 'playing';
    const videoProgressKINVideoSecondEnd = {
      time: `${parseInt(moment().utc().valueOf() / 1000, 10)}`,
      timeunit: 'SECONDS',
      measurename: 'videoSecondEnd',
      measurevalue: videoSecondEnd,
      measurevaluetype: 'DOUBLE',
      eventId,
      sessionId,
      userId,
      event,
      streamProvider,
      isSessionLive,
      date: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
      uuid: videoProgressUUID,
    };
    const videoProgressKINWatchTime = {
      time: `${parseInt(moment().utc().valueOf() / 1000, 10)}`,
      timeunit: 'SECONDS',
      measurename: 'watchTime',
      measurevalue: watchTime,
      measurevaluetype: 'DOUBLE',
      eventId,
      sessionId,
      userId,
      event,
      streamProvider,
      isSessionLive,
      date: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
      uuid: videoProgressUUID,
    };
    if (sessionId && userId && eventId) {
      lastTriggredEventTime = moment().utc().valueOf();
      if (videoSecondEnd !== undefined) {
        addDataToKinesisStream(videoProgressKINVideoSecondEnd, AWS_KINESIS_VIDEO_ANALYTICS_STREAM);
      }
      if (watchTime !== undefined) {
        addDataToKinesisStream(videoProgressKINWatchTime, AWS_KINESIS_VIDEO_ANALYTICS_STREAM);
      }
      handleVideoViewChallange(watchTime);
    }
  };

  const addMeetingEventsToKinesis = () => {
    const meetingTime = (moment().utc().valueOf() - lastTriggredEventTime) / 1000;
    const meetingEvent = {
      time: moment.utc().valueOf(),
      timeunit: 'MILLISECONDS',
      measurename: 'meetingTime',
      measurevalue: meetingTime,
      measurevaluetype: 'DOUBLE',
      eventId,
      meetingId,
      userId,
      date: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
    };
    if (meetingId && userId && eventId) {
      lastTriggredEventTime = moment().utc().valueOf();
      if (meetingTime !== undefined) {
        addDataToKinesisStream(meetingEvent, AWS_KINESIS_MEETING_ANALYTICS_STREAM);
      }
    }
  };

  const startAnaylitics = () => {
    if (chime.audioVideo) {
      if (isFrom === IsFrom.ONE_TO_ONE_CALL) {
        lastTriggredEventTime = moment().utc().valueOf();
        interval = setInterval(() => {
          addMeetingEventsToKinesis();
        }, 5000);
      } else if (isFrom === IsFrom.WORKSHOP && session && user) {
        const videoProgressUUID = uuid();
        lastTriggredEventTime = moment().utc().valueOf();
        videoSecondEnd = moment().diff(startTime, 'seconds');
        interval = setInterval(() => {
          addVideoProgressToKinesis(videoProgressUUID);
        }, 5000);
      }
    }
  };

  useEffect(() => {
    startAnaylitics();
    return () => interval && clearInterval(interval);
  }, [chime.audioVideo]);
}
