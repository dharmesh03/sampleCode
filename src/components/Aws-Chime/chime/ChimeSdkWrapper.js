import {
  AsyncScheduler,
  ConsoleLogger,
  DefaultDeviceController,
  DataMessage,
  DefaultMeetingSession,
  DefaultModality,
  LogLevel,
  MeetingSessionConfiguration,
  MeetingSessionStatusCode,
  DefaultActiveSpeakerPolicy,
  VoiceFocusDeviceTransformer,
  DefaultMeetingReadinessChecker,
  DefaultBrowserBehavior,
  VideoPreferences,
  VideoPreference,
  VideoPriorityBasedPolicy,
  TargetDisplaySize,
  DefaultVideoTransformDevice,
  SimulcastLayers,
  ModelSpecBuilder,
  BackgroundBlurVideoFrameProcessor,
} from 'amazon-chime-sdk-js';
import NoOpBackgroundBlurProcessor from 'amazon-chime-sdk-js/build/videoframeprocessor/NoOpVideoFrameProcessor';
import BackgroundBlurProcessorBuiltIn from 'amazon-chime-sdk-js/build/backgroundblurprocessor/BackgroundBlurProcessorBuiltIn';
import BackgroundBlurProcessorProvided from 'amazon-chime-sdk-js/build/backgroundblurprocessor/BackgroundBlurProcessorProvided';
import find from 'lodash/find';
import get from 'lodash/get';
import uniqBy from 'lodash/uniqBy';
import throttle from 'lodash/throttle';
import { size } from 'lodash';
import CloudWatchLogger from 'cloudwatch-logger';
import {
  apiUrl as API_URL,
  AWS_CLOUDWATCH_ACCESS_KEY as accessKeyId,
  AWS_CLOUDWATCH_ACCESS_ID as secretAccessKey,
  AWS_CLOUDWATCH_REGION,
  APP_ENV,
} from '../../../clientConfig';
import { IsFrom, VideoPriority } from '../enums/MeetingConstant';
import { getLocalStorage, setLocalStorage, removeLocalStorageItem } from '../../Widget/Utility/Utility';

const ENABLE_DOWNLINKPOLICY = true;
const ENABLE_SIMULCAST = false;
const SHOW_PRIORITY_LOGS = APP_ENV === 'local' || APP_ENV === 'development';

BackgroundBlurVideoFrameProcessor.create = async (spec, options, image = null, backColor = null) => {
  spec = BackgroundBlurVideoFrameProcessor.resolveSpec(spec);
  options = BackgroundBlurVideoFrameProcessor.resolveOptions(options);
  const { logger } = options;

  const supported = await BackgroundBlurVideoFrameProcessor.isSupported(spec, options);
  // if blur is not supported do not initialize. The processor will become a no op if not supported.
  logger.info(`processor is ${supported ? '' : 'not'} supported`);
  if (!supported) {
    logger.warn('Using no-op processor because background blur is not supported');
    return new NoOpBackgroundBlurProcessor();
  }

  let processor;
  if (await BackgroundBlurProcessorProvided.isSupported()) {
    logger.info('Using browser-provided background blur');
    processor = new BackgroundBlurProcessorProvided(spec, options);

    processor.drawImageWithMask = function (inputCanvas, mask) {
      // Mask will not be set until the worker has completed handling the predict event. Until the first frame is processed,
      // the whole frame will be blurred.
      if (!mask) {
        mask = new ImageData(this.spec.model.input.width, this.spec.model.input.height);
      }

      const scaledCtx = this.scaledCanvas.getContext('2d');

      scaledCtx.putImageData(mask, 0, 0);

      const { canvasCtx, targetCanvas } = this;
      const { width, height } = targetCanvas;

      // draw the mask
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, width, height);
      canvasCtx.drawImage(this.scaledCanvas, 0, 0, width, height);

      // Only overwrite existing pixels.
      canvasCtx.globalCompositeOperation = 'source-in';

      // draw image over mask...
      canvasCtx.drawImage(inputCanvas, 0, 0, width, height);

      // draw under person
      canvasCtx.globalCompositeOperation = 'destination-over';
      if (image) {
        canvasCtx.drawImage(image, 0, 0, targetCanvas.width, targetCanvas.height);
      } else if (backColor) {
        canvasCtx.fillStyle = backColor;
        canvasCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
        canvasCtx.drawImage(inputCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
      } else {
        canvasCtx.filter = `blur(${this.blurAmount}px)`;
        canvasCtx.drawImage(inputCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
      }
      canvasCtx.restore();
    }.bind(processor);
  } else {
    logger.info('Using built-in background blur');
    processor = new BackgroundBlurProcessorBuiltIn(spec, options);
    if (image) {
      processor.drawImageWithMask = function (inputCanvas, mask) {
        // Mask will not be set until the worker has completed handling the predict event. Until the first frame is processed,
        // the whole frame will be blurred.
        const blurredImage = this.blurredImage;
        const { canvasCtx, targetCanvas } = this;
        const { width, height } = targetCanvas;
        if (!mask || !blurredImage) {
          canvasCtx.clearRect(0, 0, width, height);
          return;
        }
        const scaledCtx = this.scaledCanvas.getContext('2d');
        scaledCtx.putImageData(mask, 0, 0);
        this.blurCanvasCtx.putImageData(this.blurredImage, 0, 0);
        // draw the mask
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, width, height);
        canvasCtx.drawImage(this.scaledCanvas, 0, 0, width, height);
        // Only overwrite existing pixels.
        canvasCtx.globalCompositeOperation = 'source-in';
        // draw image over mask...
        canvasCtx.drawImage(inputCanvas, 0, 0, width, height);
        // draw under person
        canvasCtx.globalCompositeOperation = 'destination-over';
        if (image) {
          canvasCtx.drawImage(image, 0, 0, width, height);
        } else {
          canvasCtx.drawImage(inputCanvas, 0, 0, width, height);
        }
        canvasCtx.restore();
      }.bind(processor);
    }
  }

  await processor.loadAssets();
  return processor;
};

const search = new URLSearchParams(document.location.search);
const BACKGROUND_BLUR_CDN = search.get('blurCDN') || undefined;
const BACKGROUND_BLUR_ASSET_GROUP = search.get('blurAssetGroup') || undefined;
const BACKGROUND_BLUR_REVISION_ID = search.get('blurRevisionID') || undefined;
const BACKGROUND_BLUR_PATHS = BACKGROUND_BLUR_CDN && {
  worker: `${BACKGROUND_BLUR_CDN}/bgblur/workers/worker.js`,
  wasm: `${BACKGROUND_BLUR_CDN}/bgblur/wasm/_cwt-wasm.wasm`,
  simd: `${BACKGROUND_BLUR_CDN}/bgblur/wasm/_cwt-wasm-simd.wasm`,
};
const BACKGROUND_BLUR_MODEL =
  BACKGROUND_BLUR_CDN &&
  ModelSpecBuilder.builder()
    .withSelfieSegmentationDefaults()
    .withPath(`${BACKGROUND_BLUR_CDN}/bgblur/models/selfie_segmentation_landscape.tflite`)
    .build();
const BACKGROUND_BLUR_ASSET_SPEC = (BACKGROUND_BLUR_ASSET_GROUP || BACKGROUND_BLUR_REVISION_ID) && {
  assetGroup: BACKGROUND_BLUR_ASSET_GROUP,
  revisionID: BACKGROUND_BLUR_REVISION_ID,
};

export default class ChimeSdkWrapper {
  static DATA_MESSAGE_LIFETIME_MS = 10000;

  static ROSTER_THROTTLE_MS = 400;

  meetingSession = null;

  meetingReadinessChecker = null;

  audioVideo = null;

  title = null;

  name = null;

  region = null;

  cloudWatchLogger = null;

  logStreamName = null;

  maxVideoTilesCount = 25;

  supportedChimeRegions = [
    { label: 'United States (N. Virginia)', value: 'us-east-1' },
    { label: 'Japan (Tokyo)', value: 'ap-northeast-1' },
    { label: 'Singapore', value: 'ap-southeast-1' },
    { label: 'Australia (Sydney)', value: 'ap-southeast-2' },
    { label: 'Canada', value: 'ca-central-1' },
    { label: 'Germany (Frankfurt)', value: 'eu-central-1' },
    { label: 'Sweden (Stockholm)', value: 'eu-north-1' },
    { label: 'Ireland', value: 'eu-west-1' },
    { label: 'United Kingdom (London)', value: 'eu-west-2' },
    { label: 'France (Paris)', value: 'eu-west-3' },
    { label: 'Brazil (São Paulo)', value: 'sa-east-1' },
    { label: 'United States (Ohio)', value: 'us-east-2' },
    { label: 'United States (N. California)', value: 'us-west-1' },
    { label: 'United States (Oregon)', value: 'us-west-2' },
    { label: 'Africa (Cape Town)', value: 'af-south-1' },
    { label: 'Asia Pacific (Mumbai)', value: 'ap-south-1' },
    { label: 'Asia Pacific (Seoul)', value: 'ap-northeast-2' },
    { label: 'Europe (Milan)', value: 'eu-south-1' },
  ];

  currentAudioInputDevice = null;

  currentAudioOutputDevice = null;

  currentVideoInputDevice = null;

  audioInputDevices = [];

  audioOutputDevices = [];

  videoInputDevices = [];

  devicesUpdatedCallbacks = [];

  roster = {};

  rosterUpdateCallbacks = [];

  configuration = null;

  messagingSocket = null;

  messageUpdateCallbacks = [];

  attendeeId = null;

  rosterName = null;

  meetingId = null;

  isVoiceFocusEnabled = false;

  meetingEntryExitNotificationOn = false;

  loggerId = null;

  isCameraAccessible = true;

  isMicrophoneAccessible = true;

  eventAdmins = [];

  isModerator = false;

  isFrom = null;

  speakersOrModeratorsUserIds = [];

  availableVideoQualities = [
    { value: '180p', label: '180p (nHD) @ 15 fps (250 Kbps max)' },
    { value: '360p', label: '360p (nHD) @ 15 fps (600 Kbps max)' },
    { value: '480p', label: '480p (nHD) @ 15 fps (1.4 Mbps max)' },
    { value: '540p', label: '540p (qHD) @ 15 fps (1.4 Mbps max)' },
    { value: '720p', label: '720p (HD) @ 15 fps (1.4 Mbps max)' },
  ];

  currentVideoQuality = '540p';

  preferedVideoQuality = '540p';

  priorityBasedDownlinkPolicy = null;

  attendees = {};

  attendeeUpdateCallbacks = [];

  isCamEnabled = true;

  isMicEnabled = true;

  defaultBrowserBehaviour = new DefaultBrowserBehavior();

  audioVideoCallbacks = [];

  activeSpeakers = new Set();

  tileOrder = [];

  initializeSdkWrapper = async () => {
    this.meetingSession = null;
    this.meetingReadinessChecker = null;
    this.audioVideo = null;
    this.title = null;
    this.name = null;
    this.region = null;
    this.currentAudioInputDevice = null;
    this.currentAudioOutputDevice = null;
    this.currentVideoInputDevice = null;
    this.audioInputDevices = [];
    this.audioOutputDevices = [];
    this.videoInputDevices = [];
    this.roster = {};
    this.rosterUpdateCallbacks = [];
    this.configuration = null;
    this.messagingSocket = null;
    this.messageUpdateCallbacks = [];
    this.attendeeId = null;
    this.rosterName = null;
    this.meetingId = null;
    this.isVoiceFocusEnabled = false;
    this.meetingEntryExitNotificationOn = false;
    this.loggerId = null;
    this.isCameraAccessible = true;
    this.isMicrophoneAccessible = true;
    this.cloudWatchLogger = null;
    this.logStreamName = null;
    this.eventAdmins = [];
    this.isModerator = false;
    this.isFrom = null;
    this.speakersOrModeratorsUserIds = [];
    this.currentVideoQuality = '540p';
    this.attendees = {};
    this.attendeesUpdateCallbacks = [];
    this.maxVideoTilesCount = 25;
    this.audioVideoCallbacks = [];
    this.activeSpeakers = new Set();
    this.tileOrder = [];
  };

  /*
   * ====================================================================
   * regions
   * ====================================================================
   */

  updateRosterPin = (pinAttendee, topic) => {
    Object.keys(this.attendees).forEach((attendeeId) => {
      if (attendeeId === pinAttendee) {
        this.attendees[attendeeId].isPin = topic.type === 'ISPIN';
      } else {
        this.attendees[attendeeId].isPin = false;
      }
    });
    Object.keys(this.roster).forEach((attendeeId) => {
      if (attendeeId === pinAttendee) {
        this.roster[attendeeId].isPin = topic.type === 'ISPIN';
      } else {
        this.roster[attendeeId].isPin = false;
      }
    });
    this.publishAttendeeUpdate();
    this.publishRosterUpdate();
    this.updateDownlinkPreference();
  };

  lookupClosestChimeRegion = async () => {
    let region;
    try {
      const response = await fetch(`https://nearest-media-region.l.chime.aws`, {
        method: 'GET',
      });
      const json = await response.json();
      if (json.error) {
        return this.supportedChimeRegions[0];
      }
      region = json.region;
    } catch (error) {
      this.logError(error);
    }
    return this.supportedChimeRegions.find(({ value }) => value === region) || this.supportedChimeRegions[0];
  };

  createWorkshopRoom = async (sessionId, eventUrl, isFrom, isModerator) => {
    await this.initializeSdkWrapper();
    if (!sessionId) {
      throw new Error('Session not exist');
    }
    const settings = {
      method: 'PUT',
      headers: { Authorization: getLocalStorage('token') },
    };

    const response = await fetch(`${API_URL}events/${eventUrl}/session/${sessionId}`, settings);
    if (response && response.status !== 200) {
      throw new Error('Meeting not exist');
    } else {
      this.roster = {};
      this.isFrom = isFrom;
      this.isModerator = isModerator;
      const json = await response.json();
      const { attendee, meeting, eventAdmins, speakersOrModeratorsUserIds, attendeeProfileDtos } = json;
      this.loggerId = sessionId;
      this.eventAdmins = eventAdmins || [];
      this.speakersOrModeratorsUserIds = speakersOrModeratorsUserIds || [];
      await this.initializeMeetingSession(attendee, meeting, true, attendeeProfileDtos);
    }
  };

  createWorkshopBreakoutRoom = async (sessionId, roomId, eventUrl, isFrom, isModerator) => {
    await this.initializeSdkWrapper();
    if (!sessionId) {
      throw new Error('Session not exist');
    }
    const settings = {
      method: 'PUT',
      headers: { Authorization: getLocalStorage('token') },
    };

    const response = await fetch(
      `${API_URL}events/${eventUrl}/session/${sessionId}/breakoutRoom/join/${roomId}`,
      settings,
    );
    if (response && response.status !== 200) {
      throw new Error('Breakout room does not exist or deleted by moderators');
    } else {
      this.roster = {};
      this.isFrom = isFrom;
      this.isModerator = isModerator;
      const json = await response.json();
      const { attendee, meeting, eventAdmins, speakersOrModeratorsUserIds, title, attendeeProfileDtos } = json;
      this.title = title;
      this.loggerId = sessionId;
      this.eventAdmins = eventAdmins || [];
      this.speakersOrModeratorsUserIds = speakersOrModeratorsUserIds || [];
      await this.initializeMeetingSession(attendee, meeting, true, attendeeProfileDtos);
    }
  };

  createExhibitorRoom = async (exhibitorId, eventUrl, meetingEntryExitNotificationOn, isModerator) => {
    await this.initializeSdkWrapper();
    this.meetingEntryExitNotificationOn = meetingEntryExitNotificationOn;
    if (!exhibitorId) {
      throw new Error('Exhibitor not exist');
    }
    const settings = {
      method: 'PUT',
      headers: { Authorization: getLocalStorage('token') },
    };
    const region = await this.lookupClosestChimeRegion();
    const response = await fetch(
      `${API_URL}exhibitor/event/${eventUrl}/exhibitor/${exhibitorId}/join?region=${(region && region.value) || ''}`,
      settings,
    );
    if (response && response.status !== 200) {
      throw new Error('Meeting not exist');
    } else {
      const json = await response.json();
      const { attendee, meeting, eventAdmins, speakersOrModeratorsUserIds, attendeeProfileDtos } = json;
      this.loggerId = exhibitorId;
      this.isModerator = isModerator;
      this.isFrom = IsFrom.EXHIBITOR_STUDIO;
      this.eventAdmins = eventAdmins || [];
      this.speakersOrModeratorsUserIds = speakersOrModeratorsUserIds || [];
      await this.initializeMeetingSession(attendee, meeting, true, attendeeProfileDtos);
    }
  };

  createMeetingRoom = async (meetingId, eventUrl, isFrom, loggerId) => {
    await this.initializeSdkWrapper();
    if (!meetingId) {
      throw new Error('Meeting id not valid');
    }
    const settings = {
      method: 'PUT',
      headers: { Authorization: getLocalStorage('token') },
    };

    const response = await fetch(`${API_URL}events/${eventUrl}/chime/meeting/${meetingId}`, settings);
    if (response && response.status !== 200) {
      throw new Error('Meeting not exist');
    } else {
      const json = await response.json();
      const { attendee, meeting, attendeeProfileDtos } = json;
      this.loggerId = loggerId;
      this.isFrom = isFrom;
      await this.initializeMeetingSession(attendee, meeting, true, attendeeProfileDtos);
    }
  };

  createDeviceSelectionRoom = async (eventUrl) => {
    await this.initializeSdkWrapper();

    const settings = {
      method: 'POST',
      headers: { Authorization: getLocalStorage('token') },
    };

    const response = await fetch(`${API_URL}events/${eventUrl}/chime/meeting`, settings);
    if (response && response.status !== 200) {
      throw new Error('Meeting not exist');
    } else {
      const json = await response.json();
      const { attendee, meeting } = json;

      await this.initializeMeetingSession(attendee, meeting, true);
    }
  };

  createNetworkingMeetingRoom = async (attendee, meeting, isFrom, loggerId, attendeeDetails) => {
    await this.initializeSdkWrapper();
    if (!meeting) {
      throw new Error('Meeting id not valid');
    }
    const attendeeProfileDtos = [{ ...attendeeDetails, photo: attendeeDetails?.userProfilePhoto }];
    this.loggerId = loggerId;
    this.isFrom = isFrom;
    await this.initializeMeetingSession(attendee, meeting, true, attendeeProfileDtos);
  };

  createNetworkingLoungeRoom = async (loungeId, eventUrl, isFrom, isModerator) => {
    await this.initializeSdkWrapper();
    if (!loungeId) {
      throw new Error('lounge id not exist');
    }
    const settings = {
      method: 'PUT',
      headers: { Authorization: getLocalStorage('token') },
    };

    const response = await fetch(`${API_URL}virtual/event/${eventUrl}/networking-lounge/${loungeId}/meeting`, settings);
    if (response && response.status !== 200) {
      throw new Error('Meeting not exist');
    } else {
      const json = await response.json();
      const { attendee, meeting, eventAdmins, attendeeProfileDtos } = json;
      this.loggerId = loungeId;
      this.eventAdmins = eventAdmins || [];
      this.isFrom = isFrom;
      this.isModerator = isModerator;
      await this.initializeMeetingSession(attendee, meeting, true, attendeeProfileDtos);
    }
  };

  createViewerRoom = async (meetingId, eventUrl, isDynamicUser = false) => {
    await this.initializeSdkWrapper();
    if (!meetingId) {
      throw new Error('Meeting id not exist');
    }
    const settings = {
      method: 'PUT',
    };

    const response = await fetch(
      `${API_URL}events/${eventUrl}/chime/viewer/meeting/${meetingId}?isDynamicUser=${isDynamicUser}`,
      settings,
    );
    if (response && response.status !== 200) {
      throw new Error('Meeting not exist');
    } else {
      const json = await response.json();
      const { attendee, meeting } = json;
      this.loggerId = '';
      this.isFrom = IsFrom.BACKSTAGEROOM;
      await this.initializeMeetingSession(attendee, meeting, false);
    }
  };

  initializeMeetingSession = async (attendee, meeting, isEnableWebAudio, attendeeProfileDtos = []) => {
    this.isCamEnabled = this.checkisDeviceEnabled('isCamEnabled');
    this.isMicEnabled = this.checkisDeviceEnabled('isMicEnabled');
    const attendeeInfo = JSON.parse(attendee);
    const meetingInfo = JSON.parse(meeting);
    if (attendeeInfo) {
      this.attendeeId = attendeeInfo.AttendeeId;
      this.rosterName =
        (attendeeInfo.ExternalUserId &&
          attendeeInfo.ExternalUserId.substring(0, attendeeInfo.ExternalUserId.indexOf('_'))) ||
        '';
    }
    if (meetingInfo) {
      this.meetingId = meetingInfo.MeetingId;
    }

    const configuration = new MeetingSessionConfiguration(meetingInfo, attendeeInfo);
    configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers =
      ENABLE_SIMULCAST && this.defaultBrowserBehaviour.hasChromiumWebRTC();
    const userId = localStorage && getLocalStorage('userId'); // We have enabled logger for super admin only to track connection iusse
    const logLevel =
      APP_ENV !== 'production' || (APP_ENV === 'production' && userId === '1') ? LogLevel.INFO : LogLevel.ERROR;
    const logger = new ConsoleLogger('SDK', logLevel);
    if (APP_ENV === 'production' || APP_ENV === 'stage') {
      const startTime = new Date();
      await this.createLogStreamName(this.meetingId, startTime.getTime());
      await this.createNewLogStream(configuration, 'Chime-log');
    }

    // intialize video downlink policy
    if (this.defaultBrowserBehaviour.supportDownlinkBandwidthEstimation() && ENABLE_DOWNLINKPOLICY) {
      this.priorityBasedDownlinkPolicy = new VideoPriorityBasedPolicy(logger);
      configuration.videoDownlinkBandwidthPolicy = this.priorityBasedDownlinkPolicy;
    }

    const deviceController = new DefaultDeviceController(logger, {
      enableWebAudio: isEnableWebAudio && this.isVoiceFocusSupported(),
    });
    this.meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);
    this.meetingReadinessChecker = new DefaultMeetingReadinessChecker(logger, this.meetingSession);
    this.audioVideo = this?.meetingSession?.audioVideo;
    this.audioVideo?.start({ signalingOnly: true });
    this.publishAudioVideoUpdated(this.audioVideo);

    this.audioInputDevices = [];
    (await this.audioVideo?.listAudioInputDevices()).forEach((mediaDeviceInfo) => {
      this.audioInputDevices.push({
        label: mediaDeviceInfo.label,
        value: mediaDeviceInfo.deviceId,
      });
    });
    this.audioOutputDevices = [];
    (await this.audioVideo?.listAudioOutputDevices()).forEach((mediaDeviceInfo) => {
      this.audioOutputDevices.push({
        label: mediaDeviceInfo.label,
        value: mediaDeviceInfo.deviceId,
      });
    });
    this.videoInputDevices = [];
    (await this.audioVideo?.listVideoInputDevices()).forEach((mediaDeviceInfo) => {
      this.videoInputDevices.push({
        label: mediaDeviceInfo.label,
        value: mediaDeviceInfo.deviceId,
      });
    });
    this.videoInputDevices = uniqBy(this.videoInputDevices, 'value');
    this.audioInputDevices = uniqBy(this.audioInputDevices, 'value');
    this.audioOutputDevices = uniqBy(this.audioOutputDevices, 'value');
    this.publishDevicesUpdated();
    this.audioVideo?.addDeviceChangeObserver(this);
    this.audioVideo?.realtimeSubscribeToAttendeeIdPresence((presentAttendeeId, present, externalUserId) => {
      if (!presentAttendeeId) {
        return;
      }
      try {
        if (this.meetingEntryExitNotificationOn) {
          this.playMeetingEntryExitNotificationOn(present);
        }
        if (present) {
          this.addToAttendee(presentAttendeeId, externalUserId, attendeeProfileDtos);
          this.addToRoster(presentAttendeeId, externalUserId, attendeeProfileDtos);
        } else {
          this.removeFromAttendee(presentAttendeeId);
          this.removeFromRoster(presentAttendeeId);
        }
        const presentAttendeesCount = Object.keys(this.attendees).length;
        if (presentAttendeesCount > 15) {
          this.changeVideoQuality('180p', false);
        } else if (presentAttendeesCount > 10) {
          this.changeVideoQuality('360p', false);
        } else if (presentAttendeesCount > 5) {
          this.changeVideoQuality('480p', false);
        } else if (presentAttendeesCount < 5) {
          this.changeVideoQuality(this.preferedVideoQuality);
        }
        if (!present) {
          return;
        }
      } catch (err) {
        this.setStreamLog(err.stack);
      }

      this.audioVideo?.realtimeSubscribeToVolumeIndicator(
        presentAttendeeId,
        async (attendeeId, volume, muted, signalStrength) => {
          try {
            const baseAttendeeId = new DefaultModality(attendeeId).base();
            if (baseAttendeeId !== attendeeId) {
              // Don't include the content attendee in the roster.
              //
              // When you or other attendees share content (a screen capture, a video file,
              // or any other MediaStream object), the content attendee (attendee-id#content) joins the session and
              // shares content as if a regular attendee shares a video.
              //
              // For example, your attendee ID is "my-id". When you call meetingSession.audioVideo.startContentShare,
              // the content attendee "my-id#content" will join the session and share your content.
              return;
            }
            const shouldPublishImmediately = false;
            this.addToRoster(attendeeId, externalUserId, attendeeProfileDtos);
            if (volume !== null) {
              this.roster[attendeeId].volume = Math.round(volume * 100);
            }
            if (muted !== null) {
              this.roster[attendeeId].muted = muted;
            }
            if (signalStrength !== null) {
              this.roster[attendeeId].signalStrength = Math.round(signalStrength * 100);
            }
            if (this.title && attendeeId && !this.roster[attendeeId].name) {
              // const response = await fetch(
              //   `${getBaseUrl()}attendeetitle=${encodeURIComponent(
              //     this.title
              //   )}&attendee=${encodeURIComponent(attendeeId)}`
              // );
              // const json = await response.json();
              // this.roster[attendeeId].name = json.AttendeeInfo.Name || '';
              // shouldPublishImmediately = true;
            }
            if (shouldPublishImmediately) {
              this.publishRosterUpdate.cancel();
            }
            this.publishRosterUpdate();
            this.updateRosterOrder();
          } catch (err) {
            this.setStreamLog(err.stack);
          }
        },
      );
    });

    this.audioVideo?.subscribeToActiveSpeakerDetector(new DefaultActiveSpeakerPolicy(), (attendeeIds) => {
      attendeeIds.forEach((id) => this.activeSpeakers.add(id));
      Object.keys(this.roster).forEach((attendeeId) => {
        this.roster[attendeeId].active = false;
      });

      attendeeIds.some((attendeeId) => {
        if (this.roster[attendeeId]) {
          this.roster[attendeeId].active = true;
          return true; // only show the most active speaker
        }
        return false;
      });
    });

    const SimulcastLayersMapping = {
      [SimulcastLayers.Low]: 'Low',
      [SimulcastLayers.LowAndMedium]: 'Low and Medium',
      [SimulcastLayers.LowAndHigh]: 'Low and High',
      [SimulcastLayers.Medium]: 'Medium',
      [SimulcastLayers.MediumAndHigh]: 'Medium and High',
      [SimulcastLayers.High]: 'High',
    };

    const observer = {
      encodingSimulcastLayersDidChange: (simulcastLayers) => {
        console.log(`current active simulcast layers changed to: ${SimulcastLayersMapping[simulcastLayers]}`);
      },
      eventDidReceive: (name, attributes) => {
        switch (name) {
          case 'meetingStartRequested':
          case 'meetingStartSucceeded':
          case 'meetingEnded': {
            // Exclude the "meetingHistory" attribute for successful events.
            this.setStreamLog({
              name,
              attributes,
            });
            break;
          }
          case 'audioInputFailed':
          case 'videoInputFailed':
          case 'meetingStartFailed':
          case 'meetingFailed': {
            // Send the last 5 minutes of events.
            this.setStreamLog({
              name,
              attributes,
            });
            break;
          }
          default:
        }
      },
      metricsDidReceive: (clientMetricReport) => {
        if (APP_ENV === 'production') return;
        const metricReport = clientMetricReport.getObservableMetrics();
        this.videoMetricReport = clientMetricReport.getObservableVideoMetrics();

        this.displayEstimatedUplinkBandwidth(
          metricReport.availableSendBandwidth
            ? metricReport.availableSendBandwidth
            : metricReport.availableOutgoingBitrate,
        );
        this.displayEstimatedDownlinkBandwidth(
          metricReport.availableReceiveBandwidth
            ? metricReport.availableReceiveBandwidth
            : metricReport.availableIncomingBitrate,
        );
      },
    };
    this.audioVideo?.addObserver(observer);
    this.audioVideo?.addObserver(this);
  };

  displayEstimatedUplinkBandwidth = (bitrate) => {
    console.log(
      'BANDWIDTH UPLINK: ',
      `Available Uplink Bandwidth: ${bitrate ? bitrate / 1000 / 1000 : 'Unknown'} Mbps`,
    );
  };

  displayEstimatedDownlinkBandwidth = (bitrate) => {
    console.log(
      'BANDWIDTH DOWNLINK: ',
      `Available Downlink Bandwidth: ${bitrate ? bitrate / 1000 / 1000 : 'Unknown'} Mbps`,
    );
  };

  updateRosterOrder = throttle(() => {
    const mutedAttndee = {};
    const unmutedAttndee = {};
    const ownObj = {};
    const eventAdmins = {};
    const speakersOrModeratorsUserIds = {};
    const activeAttndee = {};
    let contentShareAttendee = null;
    Object.entries(this.roster).map(([key, value]) => {
      if (key === this.attendeeId) {
        Object.assign(ownObj, {
          [key]: value,
        });
      } else if (value.userId && this.eventAdmins.indexOf(value.userId) > -1) {
        Object.assign(eventAdmins, {
          [key]: { ...value, isAdmin: true },
        });
      } else if (value.userId && this.speakersOrModeratorsUserIds.indexOf(value.userId) > -1) {
        Object.assign(speakersOrModeratorsUserIds, {
          [key]: { ...value, isSpeaker: true },
        });
      } else if (value.muted) {
        Object.assign(mutedAttndee, {
          [key]: value,
        });
      } else if (!value.muted) {
        Object.assign(unmutedAttndee, {
          [key]: value,
        });
      } else if (value.active) {
        Object.assign(activeAttndee, {
          [key]: value,
        });
      }
      const modality = new DefaultModality(key);
      if (modality.hasModality(DefaultModality.MODALITY_CONTENT)) {
        contentShareAttendee = key;
        value.isContentShare = true;
      }
    });
    this.roster = {
      ...ownObj,
      ...this.sortAttendee(eventAdmins),
      ...this.sortAttendee(speakersOrModeratorsUserIds),
      ...this.sortAttendee(unmutedAttndee),
      ...this.sortAttendee(mutedAttndee),
    };
    const priority = {
      ...activeAttndee,
      ...speakersOrModeratorsUserIds,
      ...eventAdmins,
      ...this.sortAttendee(unmutedAttndee),
      ...this.sortAttendee(mutedAttndee),
    };

    Object.entries(priority).map(([key, value]) => {
      let videoPriority;
      if (key === contentShareAttendee) {
        videoPriority = VideoPriority.HIGHEST;
      } else if (value.isPin) {
        videoPriority = VideoPriority.HIGHER;
      } else if (value.active) {
        videoPriority = VideoPriority.HIGH;
      } else if (value.isSpeaker && !value.active) {
        videoPriority = VideoPriority.MEDIUM;
      } else if (value.isAdmin && !value.active) {
        videoPriority = VideoPriority.LOW;
      } else {
        videoPriority = VideoPriority.LOWEST;
      }
      this.roster[key] = { ...value, videoPriority };
    });
    this.updateDownlinkPreference();
  }, 2000);

  sortAttendee = (data) => {
    const attndees = {};
    Object.entries(data)
      .sort((a, b) => {
        if (a[1]?.name?.toLowerCase() < b[1]?.name?.toLowerCase()) return -1;
        if (a[1]?.name?.toLowerCase() > b[1]?.name?.toLowerCase()) return 1;
        return 0;
      })
      .map(([key, value]) => {
        Object.assign(attndees, {
          [key]: value,
        });
      });
    return attndees;
  };

  storeSelectedDevices = () => {
    setLocalStorage('chimeDevices', {
      currentVideoInputDevice: this.currentVideoInputDevice,
      currentAudioInputDevice: this.currentAudioInputDevice,
      currentAudioOutputDevice: this.currentAudioOutputDevice,
      isCamEnabled: this.isCamEnabled,
      isMicEnabled: this.isMicEnabled,
    });
  };

  checkisDeviceEnabled = (isDeviceEnabled) => {
    const selectedDevices = getLocalStorage('chimeDevices');
    const chimeDevices = selectedDevices;
    return chimeDevices && chimeDevices[isDeviceEnabled];
  };

  joinRoom = async (element) => {
    try {
      if (!element) {
        throw Error(`element does not exist`);
      }
      const selectedDevices = getLocalStorage('chimeDevices');
      const chimeDevices = selectedDevices;

      const oldSelectedVideo = find(this.videoInputDevices, {
        value: get(chimeDevices, 'currentVideoInputDevice.value'),
      });
      const oldSelectedAudio = find(this.audioInputDevices, {
        value: get(chimeDevices, 'currentAudioInputDevice.value'),
      });
      const oldSelectedSpeaker = find(this.audioOutputDevices, {
        value: get(chimeDevices, 'currentAudioOutputDevice.value'),
      });

      if (this.audioInputDevices && this.audioInputDevices.length > 0) {
        await this.chooseAudioInputDevice(oldSelectedAudio || this.audioInputDevices[0]);
      }

      if (this.audioOutputDevices && this.audioOutputDevices.length > 0) {
        await this.chooseAudioOutputDevice(oldSelectedSpeaker || this.audioOutputDevices[0]);
      }

      if (this.videoInputDevices && this.videoInputDevices.length > 0) {
        await this.chooseVideoInputDevice(oldSelectedVideo || this.videoInputDevices[0]);
      }
      this.publishDevicesUpdated();
      element.current && (await this?.audioVideo?.bindAudioElement(element.current));
      return oldSelectedVideo && oldSelectedAudio;
    } catch (error) {
      this.logError(error);
      return false;
    }
  };

  joinWithOffCamera = async () => {
    await this?.audioVideo?.stopVideoInput();
  };

  sendRaiseHandMessage = (topic, data) => {
    new AsyncScheduler().start(() => {
      this.audioVideo && this.audioVideo.realtimeSendDataMessage(topic, data, ChimeSdkWrapper.DATA_MESSAGE_LIFETIME_MS);
      this.publishMessageUpdate(
        new DataMessage(
          Date.now(),
          topic,
          new TextEncoder().encode(data),
          this.meetingSession.configuration.credentials.attendeeId || '',
          this.meetingSession.configuration.credentials.externalUserId || '',
        ),
      );
    });
  };

  // eslint-disable-next-line
  sendMessage = (topic, data) => {
    new AsyncScheduler().start(() => {
      const payload = {
        ...data,
        attendeeId: this.attendeeId || '',
        name: this.rosterName || '',
      };
      this.audioVideo &&
        this.audioVideo.realtimeSendDataMessage(
          topic,
          payload,
          data && data.type === 'KICK' ? 10 : ChimeSdkWrapper.DATA_MESSAGE_LIFETIME_MS,
        );

      this.publishMessageUpdate(
        new DataMessage(
          Date.now(),
          topic,
          new TextEncoder().encode(payload),
          this.meetingSession.configuration.credentials.attendeeId || '',
          this.meetingSession.configuration.credentials.externalUserId || '',
        ),
      );
    });
  };

  leaveRoom = async () => {
    try {
      try {
        await this.audioVideo?.stopVideoInput();
        await this.audioVideo?.stopAudioInput();
        await this.audioVideo?.chooseAudioOutput(null);
      } catch (error) {
        console.log('Unable to set device to null on leave.');
      } finally {
        if (this.audioVideo) {
          this.audioVideo.stopContentShare();
          this.audioVideo.unbindAudioElement();
          await this.audioVideo.stopVideoInput();
          await this.audioVideo.stop();
          this.audioVideo.removeObserver(this);
        }
      }

      this.meetingReadinessChecker = null;
      this.roster = {};
      this.attendees = {};
      this.devicesUpdatedCallbacks = [];
      this.rosterUpdateCallbacks = [];
      this.attendeeUpdateCallbacks = [];
      this.isModerator = false;
      this.isFrom = null;
      this.enableLiveTranscription = false;
    } catch (error) {
      this.logError(error);
    }
    // try {
    //   if (!this.meetingId || !this.attendeeId) {
    //     console.info(`Meeting or attendee not exist`);
    //     return;
    //   }
    //   const settings = {
    //     method: 'POST',
    //     headers: { Authorization: getLocalStorage('token') },
    //   };

    //   await fetch(`${API_URL}events/${eventUrl}/chime/meeting/${this.meetingId}/attendee/${this.attendeeId}`, settings);
    // } catch (error) {
    //   this.logError(error);
    // }
  };

  removeVideoTile(tileId) {
    this.removeAttendeeVideoTile(tileId);
    this.removeRosterVideoTile(tileId);
  }

  /**
   * ====================================================================
   * Device
   * ====================================================================
   */

  chooseAudioInputDevice = async (device) => {
    let transformer = null;
    let vfDevice = null;
    try {
      if (this.isVoiceFocusEnabled && device) {
        transformer = await VoiceFocusDeviceTransformer.create();
        this.isVoiceFocusEnabled = transformer.isSupported();
        if (transformer.isSupported()) {
          vfDevice = await transformer.createTransformDevice(device.value || null);
        }
      }
      const deviceId = get(device, 'value', null);
      const defaultValue = get(this, 'audioInputDevices[0]', null);
      const selectedDevice = vfDevice || deviceId ? device : null || defaultValue;
      try {
        await this.audioVideo?.startAudioInput(vfDevice || deviceId || defaultValue);
        this.currentAudioInputDevice = selectedDevice;
        this.storeSelectedDevices();
      } catch (e) {
        console.error(`failed to chooseAudioInputDevice ${device}`, e);
      }
    } catch (error) {
      this.logError(error);
    }
  };

  chooseAudioOutputDevice = async (device) => {
    if (!new DefaultBrowserBehavior().supportsSetSinkId()) {
      console.error('Cannot select audio output device. This browser does not support setSinkId.');
      return;
    }
    try {
      const deviceId = get(device, 'value', null);
      const defaultValue = get(this, 'audioOutputDevices[0]', null);
      let selectedDevice = deviceId ? device : null || defaultValue;
      if (this.iOS()) {
        await this.audioVideo?.chooseAudioOutput('default');
        selectedDevice = 'default';
      } else {
        await this.audioVideo?.chooseAudioOutput(deviceId || defaultValue);
      }
      this.currentAudioOutputDevice = selectedDevice;
      this.storeSelectedDevices();
    } catch (error) {
      this.logError(error);
    }
  };

  isAudioOuputSpeakerAvailabel = () => new DefaultBrowserBehavior().supportsSetSinkId();

  chooseVideoInputDevice = async (device) => {
    try {
      const deviceId = get(device, 'value', null);
      const defaultValue = get(this, 'videoInputDevices[0]', null);
      const selectedDevice = deviceId ? device : null || defaultValue;
      try {
        await this.audioVideo?.startVideoInput(deviceId || defaultValue);
      } catch (e) {
        console.error(`failed to chooseVideoInputDevice ${device}`, e);
      }
      this.currentVideoInputDevice = selectedDevice;
      this.storeSelectedDevices();
    } catch (error) {
      this.logError(error);
    }
  };

  /**
   * ====================================================================
   * Observer methods
   * ====================================================================
   */

  audioInputsChanged(freshAudioInputDeviceList) {
    let hasCurrentDevice = false;
    this.audioInputDevices = [];
    freshAudioInputDeviceList.forEach((mediaDeviceInfo) => {
      if (this.currentAudioInputDevice && mediaDeviceInfo.deviceId === this.currentAudioInputDevice.value) {
        hasCurrentDevice = true;
      }
      this.audioInputDevices.push({
        label: mediaDeviceInfo.label,
        value: mediaDeviceInfo.deviceId,
      });
    });
    if (!hasCurrentDevice) {
      this.currentAudioInputDevice = this.audioInputDevices.length > 0 ? this.audioInputDevices[0] : null;
    }
    this.publishDevicesUpdated();
  }

  audioOutputsChanged(freshAudioOutputDeviceList) {
    let hasCurrentDevice = false;
    this.audioOutputDevices = [];
    freshAudioOutputDeviceList.forEach((mediaDeviceInfo) => {
      if (this.currentAudioOutputDevice && mediaDeviceInfo.deviceId === this.currentAudioOutputDevice.value) {
        hasCurrentDevice = true;
      }
      this.audioOutputDevices.push({
        label: mediaDeviceInfo.label,
        value: mediaDeviceInfo.deviceId,
      });
    });
    if (!hasCurrentDevice) {
      this.currentAudioOutputDevice = this.audioOutputDevices.length > 0 ? this.audioOutputDevices[0] : null;
    }
    this.publishDevicesUpdated();
  }

  videoInputsChanged(freshVideoInputDeviceList) {
    let hasCurrentDevice = false;
    this.videoInputDevices = [];
    freshVideoInputDeviceList.forEach((mediaDeviceInfo) => {
      if (this.currentVideoInputDevice && mediaDeviceInfo.deviceId === this.currentVideoInputDevice.value) {
        hasCurrentDevice = true;
      }
      this.videoInputDevices.push({
        label: mediaDeviceInfo.label,
        value: mediaDeviceInfo.deviceId,
      });
    });
    if (!hasCurrentDevice) {
      this.currentVideoInputDevice = this.videoInputDevices.length > 0 ? this.videoInputDevices[0] : null;
    }
    this.publishDevicesUpdated();
  }

  videoTileDidUpdate(tileState) {
    const { boundAttendeeId, tileId, isContent, paused } = tileState;
    if (!boundAttendeeId || !tileId || isContent) {
      return;
    }
    if (!paused) {
      this.updateAttendeeVideoTile(boundAttendeeId, tileId);
      this.updateRosterVideoTile(boundAttendeeId, tileId);
    } else {
      this.removeVideoTile(tileId);
    }
  }

  videoTileWasRemoved(tileId) {
    this.removeVideoTile(tileId);
  }

  remoteVideoSourcesDidChange = (videoSources) => {
    for (const attendeeId in Object.keys(this.roster)) {
      if (this.roster[attendeeId]) {
        this.roster[attendeeId].hasVideo = false;
      }
    }
    for (const source of videoSources) {
      if (this.roster[source.attendee.attendeeId]) {
        this.roster[source.attendee.attendeeId].hasVideo = true;
      } else {
        this.roster[source.attendee.attendeeId] = {
          hasVideo: true,
        };
      }
    }
    // Update downlink policy preferences accordingly
    this.updateDownlinkPreference();
  };

  /**
   * ====================================================================
   * Subscribe and unsubscribe from SDK events
   * ====================================================================
   */

  subscribeToDevicesUpdated = (callback) => {
    this.devicesUpdatedCallbacks.push(callback);
  };

  unsubscribeFromDevicesUpdated = (callback) => {
    const index = this.devicesUpdatedCallbacks.indexOf(callback);
    if (index !== -1) {
      this.devicesUpdatedCallbacks.splice(index, 1);
    }
  };

  publishDevicesUpdated = () => {
    this.devicesUpdatedCallbacks.forEach((callback) => {
      callback({
        currentAudioInputDevice: this.currentAudioInputDevice,
        currentAudioOutputDevice: this.currentAudioOutputDevice,
        currentVideoInputDevice: this.currentVideoInputDevice,
        audioInputDevices: this.audioInputDevices,
        audioOutputDevices: this.audioOutputDevices,
        videoInputDevices: this.videoInputDevices,
      });
    });
  };

  subscribeToRosterUpdate = (callback) => {
    this.rosterUpdateCallbacks.push(callback);
  };

  unsubscribeFromRosterUpdate = (callback) => {
    const index = this.rosterUpdateCallbacks.indexOf(callback);
    if (index !== -1) {
      this.rosterUpdateCallbacks.splice(index, 1);
    }
  };

  publishRosterUpdate = throttle(() => {
    for (let i = 0; i < this.rosterUpdateCallbacks.length; i += 1) {
      const callback = this.rosterUpdateCallbacks[i];
      callback(this.roster);
    }
  }, ChimeSdkWrapper.ROSTER_THROTTLE_MS);

  subscribeToAttendeeUpdate = (callback) => {
    this.attendeeUpdateCallbacks.push(callback);
  };

  unsubscribeFromAttendeeUpdate = (callback) => {
    const index = this.attendeeUpdateCallbacks.indexOf(callback);
    if (index !== -1) {
      this.attendeeUpdateCallbacks.splice(index, 1);
    }
  };

  publishAttendeeUpdate = throttle(() => {
    for (let i = 0; i < this.attendeeUpdateCallbacks.length; i += 1) {
      const callback = this.attendeeUpdateCallbacks[i];
      callback(this.attendees);
    }
  }, ChimeSdkWrapper.ROSTER_THROTTLE_MS);

  subscribeToMessageUpdate = (messageUpdateCallback) => {
    this.messageUpdateCallbacks.push(messageUpdateCallback);
    this.audioVideo &&
      this.audioVideo.realtimeSubscribeToReceiveDataMessage(
        messageUpdateCallback.topic,
        messageUpdateCallback.callback,
      );
  };

  unsubscribeFromMessageUpdate = (messageUpdateCallback) => {
    const index = this.messageUpdateCallbacks.indexOf(messageUpdateCallback);
    if (index !== -1) {
      this.messageUpdateCallbacks.splice(index, 1);
    }
    if (this.audioVideo) {
      this.audioVideo.realtimeUnsubscribeFromReceiveDataMessage(messageUpdateCallback.topic);
    }
  };

  publishMessageUpdate = (message) => {
    for (let i = 0; i < this.messageUpdateCallbacks.length; i += 1) {
      const messageUpdateCallback = this.messageUpdateCallbacks[i];
      if (messageUpdateCallback.topic === message.topic) {
        messageUpdateCallback.callback(message);
      }
    }
  };

  publishAudioVideoUpdated = (audioVideo) => {
    this.audioVideoCallbacks.forEach((callback) => {
      callback(audioVideo);
    });
  };

  subscribeToAudioVideo = (callback) => {
    this.audioVideoCallbacks.push(callback);
  };

  unsubscribeFromAudioVideo = (callback) => {
    const index = this.audioVideoCallbacks.indexOf(callback);
    if (index !== -1) {
      this.audioVideoCallbacks.splice(index, 1);
    }
  };

  /**
   * ====================================================================
   * Utilities
   * ====================================================================
   */

  getRosterCount = () =>
    Object.keys(this.roster).filter((attendeeId) => !this.isContentShareAttendee(attendeeId)).length;

  isAttendeeMuted = (attendeeId) => this.roster[attendeeId]?.muted;

  isVoiceFocusSupported = async () => {
    const isVoiceFocusSupported = await VoiceFocusDeviceTransformer.isSupported();
    if (!isVoiceFocusSupported) {
      console.info('Voice Focus Not Supported.');
    }
    return isVoiceFocusSupported;
  };

  handleVoiceFocusSupported = async (isEnabled) => {
    this.isVoiceFocusEnabled = isEnabled;
    this.chooseAudioInputDevice(this.currentAudioInputDevice);
  };

  handleMeetingEntryExitNotification = (isEnabled) => {
    this.meetingEntryExitNotificationOn = isEnabled;
  };

  startContentShare = async (contentVideoElement, file) => {
    const url = URL.createObjectURL(file);
    contentVideoElement.src = url;
    contentVideoElement.autoplay = true;
    contentVideoElement.controls = true;
    contentVideoElement.muted = false;

    try {
      await contentVideoElement.play();
    } catch (error) {
      if (error && error.name === 'NotSupportedError') {
        throw new Error('The file you chose for video sharing is not supported.');
      }
    }

    let mediaStream = null;
    if (contentVideoElement.captureStream) {
      mediaStream = contentVideoElement.captureStream();
    } else if (contentVideoElement.mozCaptureStream) {
      mediaStream = contentVideoElement.mozCaptureStream();
    } else {
      contentVideoElement.pause();
      throw new Error('BrowserNotSupported');
    }
    return mediaStream;
  };

  getChimeMeetingStatus = (status) => {
    const sessionStatus = { status: '', message: '' };
    if (!status) {
      return sessionStatus;
    }
    console.error('Meeting Status :', status);
    const sessionStatusCode = status.statusCode();
    switch (sessionStatusCode) {
      case MeetingSessionStatusCode.OK:
        sessionStatus.status = 'OK';
        sessionStatus.message = 'OK';
        break;
      case MeetingSessionStatusCode.Left:
        sessionStatus.status = 'Left';
        sessionStatus.message = 'Left';
        break;
      case MeetingSessionStatusCode.AudioJoinedFromAnotherDevice:
        sessionStatus.status = 'AudioJoinedFromAnotherDevice';
        sessionStatus.message = 'AudioJoinedFromAnotherDevice';
        break;
      case MeetingSessionStatusCode.AudioDisconnectAudio:
        sessionStatus.status = 'AudioDisconnectAudio';
        sessionStatus.message = 'AudioDisconnectAudio';
        break;
      case MeetingSessionStatusCode.AudioAuthenticationRejected:
        sessionStatus.status = 'AudioAuthenticationRejected';
        sessionStatus.message = 'AudioAuthenticationRejected';
        break;
      case MeetingSessionStatusCode.AudioCallAtCapacity:
        sessionStatus.status = 'AudioCallAtCapacity';
        sessionStatus.message = 'AudioCallAtCapacity';
        break;
      case MeetingSessionStatusCode.AudioCallEnded:
        sessionStatus.status = 'AudioCallEnded';
        sessionStatus.message = 'AudioCallEnded';
        break;
      case MeetingSessionStatusCode.AudioServiceUnavailable:
        sessionStatus.status = 'AudioServiceUnavailable';
        sessionStatus.message = 'AudioServiceUnavailable.';
        break;
      case MeetingSessionStatusCode.AudioDisconnected:
        sessionStatus.status = 'AudioDisconnected';
        sessionStatus.message = 'AudioDisconnected';
        break;
      case MeetingSessionStatusCode.ConnectionHealthReconnect:
        sessionStatus.status = 'ConnectionHealthReconnect';
        sessionStatus.message = 'ConnectionHealthReconnect';
        break;
      case MeetingSessionStatusCode.SignalingBadRequest:
        sessionStatus.status = 'SignalingBadRequest';
        sessionStatus.message = 'SignalingBadRequest';
        break;
      case MeetingSessionStatusCode.TURNCredentialsForbidden:
        sessionStatus.status = 'TURNCredentialsForbidden';
        sessionStatus.message = 'ReconnectMeeting';
        break;
      case MeetingSessionStatusCode.TaskFailed:
        sessionStatus.status = 'TURNCredentialsForbidden';
        sessionStatus.message = 'ReconnectMeeting';
        break;
      case MeetingSessionStatusCode.RealtimeApiFailed:
        sessionStatus.status = 'RealtimeApiFailed';
        sessionStatus.message = 'ReconnectMeeting';
        break;
      case MeetingSessionStatusCode.NetworkBecamePoor:
        sessionStatus.status = 'NetworkBecamePoor';
        sessionStatus.message = 'NetworkBecamePoor';
        break;
      case MeetingSessionStatusCode.VideoServiceFailed:
        sessionStatus.status = 'VideoServiceFailed';
        sessionStatus.message = 'VideoServiceFailed';
        break;
      case MeetingSessionStatusCode.VideoAtCapacityViewOnly:
        sessionStatus.status = 'VideoAtCapacityViewOnly';
        sessionStatus.message = 'VideoAtCapacityViewOnly';
        break;
      default:
        console.error('Stopped with a session status code: ', sessionStatusCode);
    }
    return sessionStatus;
  };

  playMeetingEntryExitNotificationOn = (isEnter) => {
    const sound = new Audio();
    if (isEnter) {
      sound.src =
        'data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=';
    } else {
      sound.src =
        'data:audio/wav;base64,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';
    }
    sound.autoplay = true;
    return () => {
      sound.play();
    };
  };

  logError = (error) => {
    // eslint-disable-next-line
    console.error(error);
  };

  createNewLogStream = async (configuration, logGroupName) => {
    const meetingId = configuration.meetingId;
    const attendeeId = configuration.credentials.attendeeId;
    if (!meetingId || !attendeeId) {
      return;
    }
    if (!this.cloudWatchLogger) {
      const config = {
        logGroupName,
        logStreamName: this.logStreamName,
        region: AWS_CLOUDWATCH_REGION,
        accessKeyId,
        secretAccessKey,
        local: false, // Optional. If set to true, the log will fall back to the standard 'console.log'.
      };
      this.cloudWatchLogger = new CloudWatchLogger(config);
      (async () => {
        try {
          await this.cloudWatchLogger.connect();
        } catch (error) {
          if (error && error.code === 'ResourceAlreadyExistsException') {
            const startTime = new Date();
            await this.createLogStreamName(this.meetingId, startTime.getTime());
            await this.createNewLogStream(configuration, 'Chime-log');
          } else {
            console.info('Create stream error:-', error);
          }
        }
      })();
    }
  };

  createLogStreamName = async (meetingId, startTime) => {
    const userId = localStorage && getLocalStorage('userId');
    this.logStreamName = `${this.isFrom}_${this.loggerId}_${userId}_${meetingId}_${startTime}`;
  };

  setStreamLog = async (log) => {
    if ((APP_ENV === 'production' || APP_ENV === 'stage') && this.cloudWatchLogger) {
      (async () => {
        try {
          this.cloudWatchLogger && (await this.cloudWatchLogger.log(log));
        } catch {
          (error) => console.log('Error while setStreamLog:', error);
        }
      })();
    }
  };

  iOS = () =>
    ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
    // iPad on iOS 13 detection
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document);

  // workaround to solve audio distortion issue on mac safari or ipad
  refreshAudioInputDevice = async () => {
    if (this.iOS()) return;
    let safariAgent = navigator.userAgent.indexOf('Safari') > -1;
    const chromeAgent = navigator.userAgent.indexOf('Chrome') > -1;
    if (chromeAgent && safariAgent) safariAgent = false;
    if (safariAgent) {
      if (this.audioVideo) await this.audioVideo.stopAudioInput();
      await this.chooseAudioInputDevice(this.currentAudioInputDevice);
    }
  };

  analyserNode = null;

  analyserNodeCallback = () => {};

  /**
   * ====================================================================
   * Video Prioritization
   * ====================================================================
   */

  updateDownlinkPreference = () => {
    if (!this.defaultBrowserBehaviour.supportDownlinkBandwidthEstimation() || !ENABLE_DOWNLINKPOLICY) {
      return;
    }
    const videoPreferences = VideoPreferences.prepare();
    for (const attendeeId in this.roster) {
      if (this.roster[attendeeId]) {
        const attendee = this.roster[attendeeId];
        const isScreenShare = this.isContentShareAttendee(attendeeId);
        let targetDisplaySize;
        if (isScreenShare) {
          attendee.videoPriority = VideoPriority.HIGHEST;
          targetDisplaySize = TargetDisplaySize.High;
        } else if (
          attendee.videoPriority === VideoPriority.HIGHEST ||
          attendee.videoPriority === VideoPriority.HIGHER ||
          attendee.videoPriority === VideoPriority.HIGH
        ) {
          targetDisplaySize = TargetDisplaySize.High;
        } else if (attendee.videoPriority === VideoPriority.MEDIUM) {
          targetDisplaySize = TargetDisplaySize.Medium;
        } else {
          targetDisplaySize = TargetDisplaySize.Low;
        }
        if (attendee && attendee.hasVideo) {
          // Logs are for dev testing will remove once tested
          if (SHOW_PRIORITY_LOGS) {
            console.log(
              `${attendee.isContentShare ? 'Screen' : attendee.name}/Priority-${
                attendee.videoPriority
              }/Speaker-${!!attendee.isSpeaker}/Admin-${!!attendee.isAdmin}`,
            );
          }
          videoPreferences.add(
            new VideoPreference(attendeeId, attendee.videoPriority || VideoPriority.LOW, targetDisplaySize),
          );
        }
      }
    }
    this.priorityBasedDownlinkPolicy.chooseRemoteVideoSources(videoPreferences.build());
  };

  getAttendeeDetailFromExternalUserId = (externalUserId) => {
    const name = (externalUserId && externalUserId.substring(0, externalUserId.indexOf('_'))) || '';
    let userId = externalUserId && externalUserId.substring(externalUserId.indexOf('_') + 1, externalUserId.length);
    userId = userId ? parseInt(userId, 10) : null;
    return { name, userId };
  };

  addToRoster = (attendeeId, externalUserId, attendeeProfileDtos) => {
    const { name, userId } = this.getAttendeeDetailFromExternalUserId(externalUserId);
    if (!this.roster[attendeeId]) {
      this.roster[attendeeId] = { name, userId, attendeeId };
    } else {
      this.roster[attendeeId].name = name;
      this.roster[attendeeId].userId = userId;
      this.roster[attendeeId].attendeeId = attendeeId;
    }
    if (size(attendeeProfileDtos) > 0) {
      const _attendee = attendeeProfileDtos?.find((attendeeProfile) => attendeeProfile.userId === userId);
      if (_attendee && this.roster[attendeeId]) {
        this.roster[attendeeId].profilePic = _attendee.photo;
        this.roster[attendeeId].firstName = _attendee.firstName;
        this.roster[attendeeId].lastName = _attendee.lastName;
      }
    }
  };

  removeFromRoster = (presentAttendeeId) => {
    delete this.roster[presentAttendeeId];
    this.publishRosterUpdate.cancel();
    this.publishRosterUpdate();
  };

  addToAttendee = (attendeeId, externalUserId, attendeeProfileDtos) => {
    const { name, userId } = this.getAttendeeDetailFromExternalUserId(externalUserId);
    if (!this.attendees[attendeeId]) {
      this.attendees[attendeeId] = { name, userId, attendeeId };
    } else {
      this.attendees[attendeeId].name = name;
      this.attendees[attendeeId].userId = userId;
      this.attendees[attendeeId].attendeeId = attendeeId;
    }
    if (size(attendeeProfileDtos) > 0) {
      const _attendee = attendeeProfileDtos?.find((attendeeProfile) => attendeeProfile.userId === userId);
      if (_attendee && this.attendees[attendeeId]) {
        this.attendees[attendeeId].profilePic = _attendee.photo;
        this.attendees[attendeeId].firstName = _attendee.firstName;
        this.attendees[attendeeId].lastName = _attendee.lastName;
      }
    }
    this.publishAttendeeUpdate.cancel();
    this.publishAttendeeUpdate();
  };

  removeFromAttendee = (presentAttendeeId) => {
    delete this.attendees[presentAttendeeId];
    this.publishAttendeeUpdate.cancel();
    this.publishAttendeeUpdate();
  };

  isContentShareAttendee = (attendeeId) => {
    const modality = new DefaultModality(attendeeId);
    return modality.hasModality(DefaultModality.MODALITY_CONTENT);
  };

  changeVideoQuality = async (value, isPrefered = true) => {
    if (!this.audioVideo) return;
    switch (value) {
      case '180p':
        await this.audioVideo.chooseVideoInputQuality(320, 180, 15);
        await this.audioVideo?.setVideoMaxBandwidthKbps(250);
        break;
      case '360p':
        await this.audioVideo.chooseVideoInputQuality(640, 360, 15);
        await this.audioVideo?.setVideoMaxBandwidthKbps(600);
        break;
      case '480p':
        await this.audioVideo.chooseVideoInputQuality(848, 480, 15);
        await this.audioVideo?.setVideoMaxBandwidthKbps(1400);
        break;
      case '540p':
        await this.audioVideo.chooseVideoInputQuality(960, 540, 15);
        await this.audioVideo?.setVideoMaxBandwidthKbps(1400);
        break;
      case '720p':
        await this.audioVideo.chooseVideoInputQuality(1280, 720, 15);
        await this.audioVideo?.setVideoMaxBandwidthKbps(1400);
        break;
      default:
        break;
    }
    this.currentVideoQuality = value;
    isPrefered && (this.preferedVideoQuality = value);
  };

  unpinAllAttendee = () => {
    Object.keys(this.attendees).forEach((attendeeId) => {
      this.attendees[attendeeId].isPin = false;
    });
    Object.keys(this.roster).forEach((attendeeId) => {
      this.roster[attendeeId].isPin = false;
    });
    this.publishAttendeeUpdate();
    this.publishRosterUpdate();
    this.updateDownlinkPreference();
  };

  removeAttendeeVideoTile = (tileId) => {
    const attendees = get(this, 'attendees', {});
    const attendeeId = Object.keys(attendees).find(
      (attendee) => attendees[attendee] && attendees[attendee].tileId === tileId,
    );
    const attendee = attendees[attendeeId];
    if (attendee && attendee.tileId === tileId) {
      delete attendee.tileId;
    }
    this.publishAttendeeUpdate();
  };

  removeRosterVideoTile = (tileId) => {
    const roster = get(this, 'roster', {});
    const rosterAttendeeId = Object.keys(roster).find(
      (attendee) => roster[attendee] && roster[attendee].tileId === tileId,
    );
    const rosterAttendee = roster[rosterAttendeeId];
    if (rosterAttendee && rosterAttendee.tileId === tileId) {
      delete rosterAttendee.tileId;
    }
    this.publishRosterUpdate();
  };

  updateAttendeeVideoTile = (boundAttendeeId, tileId) => {
    const attendees = get(this, 'attendees', {});
    if (!attendees[boundAttendeeId]) {
      attendees[boundAttendeeId] = {};
    }
    const attendee = attendees[boundAttendeeId];
    attendee.tileId = tileId;
    this.publishAttendeeUpdate();
  };

  updateRosterVideoTile = (boundAttendeeId, tileId) => {
    const roster = get(this, 'roster', {});
    if (!roster[boundAttendeeId]) {
      roster[boundAttendeeId] = {};
    }
    const rosterAttendee = roster[boundAttendeeId];
    rosterAttendee.tileId = tileId;
    this.publishRosterUpdate();
  };

  setMaxVideoTilesCount = (count) => {
    this.maxVideoTilesCount = count;
    this.publishAttendeeUpdate();
  };

  getBackgroundBlurSpec = () => ({
    paths: BACKGROUND_BLUR_PATHS,
    model: BACKGROUND_BLUR_MODEL,
    ...BACKGROUND_BLUR_ASSET_SPEC,
  });

  getBackgroundBlurOptions = () => ({
    blurStrength: 10,
    filterCPUUtilization: 50,
  });

  setVirtualBackgroundEffect = async (effectType, value, eventId, userId) => {
    if (effectType === 'Image') {
      this.setVirtualBackgroundImage(value, eventId, userId);
    } else if (effectType === 'Blur') {
      this.blurBackground(value, eventId, userId);
    } else {
      this.setBackgroundColor(value, eventId, userId);
    }
  };

  setVirtualBackgroundImage = async (path, eventId, userId) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = async () => {
      const processors = [];
      if (BackgroundBlurVideoFrameProcessor.isSupported()) {
        const blurProcessor = await BackgroundBlurVideoFrameProcessor.create(
          this.getBackgroundBlurSpec(),
          this.getBackgroundBlurOptions(),
          image,
        );
        processors.push(blurProcessor);
      } else {
        console.log('Background not supported');
      }

      const transformDevice = new DefaultVideoTransformDevice(
        new ConsoleLogger('MeetingLogs', LogLevel.OFF),
        this.currentVideoInputDevice.value,
        processors,
      );

      await this.audioVideo?.startVideoInput(transformDevice).then(async () => {
        await this.audioVideo?.startLocalVideoTile();
      });
    };
    image.src = path;
    setLocalStorage('virtualBackgroundEffect', {
      value: path,
      effectType: 'Image',
      eventId,
      userId,
    });
  };

  removeBackground = async () => {
    removeLocalStorageItem('virtualBackgroundEffect');
    const transformDevice = new DefaultVideoTransformDevice(
      new ConsoleLogger('MeetingLogs', LogLevel.OFF),
      this.currentVideoInputDevice.value,
      [new NoOpBackgroundBlurProcessor()],
    );

    await this.audioVideo?.startVideoInput(transformDevice).then(async () => {
      await this.audioVideo?.startLocalVideoTile();
    });
  };

  blurBackground = async (blurAmount, eventId, userId) => {
    const processors = [];
    if (BackgroundBlurVideoFrameProcessor.isSupported()) {
      const blurProcessor = await BackgroundBlurVideoFrameProcessor.create(
        this.getBackgroundBlurSpec(),
        this.getBackgroundBlurOptions(),
      );
      processors.push(blurProcessor);
      blurProcessor.setBlurStrength(blurAmount);
    } else {
      console.log('Background not supported');
    }

    const transformDevice = new DefaultVideoTransformDevice(
      new ConsoleLogger('MeetingLogs', LogLevel.OFF),
      this.currentVideoInputDevice.value,
      processors,
    );

    setLocalStorage('virtualBackgroundEffect', {
      value: blurAmount,
      effectType: 'Blur',
      eventId,
      userId,
    });

    await this.audioVideo?.startVideoInput(transformDevice).then(async () => {
      await this.audioVideo?.startLocalVideoTile();
    });
  };

  setBackgroundColor = async (color, eventId, userId) => {
    const processors = [];
    if (BackgroundBlurVideoFrameProcessor.isSupported()) {
      const blurProcessor = await BackgroundBlurVideoFrameProcessor.create(
        this.getBackgroundBlurSpec(),
        this.getBackgroundBlurOptions(),
        null,
        color,
      );
      processors.push(blurProcessor);
    } else {
      console.log('Background not supported');
    }

    const transformDevice = new DefaultVideoTransformDevice(
      new ConsoleLogger('MeetingLogs', LogLevel.OFF),
      this.currentVideoInputDevice.value,
      processors,
    );

    setLocalStorage('virtualBackgroundEffect', {
      value: color,
      effectType: 'Color',
      eventId,
      userId,
    });

    await this.audioVideo?.startVideoInput(transformDevice).then(async () => {
      await this.audioVideo?.startLocalVideoTile();
    });
  };

  reshuffleVideoTiles = (attendees = [], { activeSpeaker, activeRaisedHandAttendees = [] }) => {
    if (this.maxVideoTilesCount === 1) {
      if (activeSpeaker) {
        return [activeSpeaker];
      }
      if (activeRaisedHandAttendees.length) {
        return [activeRaisedHandAttendees[0]];
      }
      return [attendees[0]];
    }
    let oldAttendees = [];
    const tileNeedToAdded = [];
    this.tileOrder.forEach((attendee) => {
      const _attendee = attendees.find((a) => a?.attendeeId === attendee?.attendeeId);
      _attendee && oldAttendees.push(_attendee);
    });
    oldAttendees = oldAttendees.splice(0, this.maxVideoTilesCount);
    console.log('TILE_RESUFFLE_LOG', 'init', activeSpeaker?.name, attendees, this.tileOrder, oldAttendees);

    const updateIndex = (attendee) => {
      const index = oldAttendees.findIndex((a) => a?.attendeeId === attendee?.attendeeId);
      console.log('TILE_RESUFFLE_LOG', 'Check : ', attendee?.name, index);
      if (index === -1) {
        tileNeedToAdded.push(attendee);
        console.log('TILE_RESUFFLE_LOG', 'Need to add : ', attendee?.name);
      }
    };

    const activeAttendees = uniqBy([activeSpeaker, ...activeRaisedHandAttendees], 'attendeeId').filter(
      (attendee) => attendee?.attendeeId,
    );

    let reshuffledTiles = [];
    if (activeAttendees.length >= this.maxVideoTilesCount) {
      const tiles = [];
      const availableIndex = new Set();
      for (let index = 0; index < this.maxVideoTilesCount; index++) {
        availableIndex.add(index);
      }
      console.log('TILE_RESUFFLE_LOG', 'Check availableIndex : ', availableIndex);
      activeAttendees.forEach((attendee) => {
        const index = oldAttendees.findIndex((a) => a?.attendeeId === attendee?.attendeeId);
        console.log('TILE_RESUFFLE_LOG', 'Check tileNeedToAdded : ', attendee?.name, index);
        if (index > -1 && index < this.maxVideoTilesCount && availableIndex.has(index)) {
          tiles[index] = attendee;
          console.log('TILE_RESUFFLE_LOG', 'Attendee added : ', attendee?.name, index);
        } else {
          const [first] = availableIndex;
          console.log('TILE_RESUFFLE_LOG', 'Available : ', first);
          if (first !== undefined) {
            tiles[first] = attendee;
            availableIndex.delete(first);
            console.log('TILE_RESUFFLE_LOG', 'Attendee added to : ', attendee?.name, first);
          }
        }
      });
      reshuffledTiles = uniqBy([...tiles, ...attendees], 'attendeeId').filter((a) => a?.attendeeId);
    } else {
      activeAttendees.forEach((attendee) => attendee && updateIndex(attendee));
      reshuffledTiles = uniqBy([attendees[0], ...tileNeedToAdded, ...oldAttendees, ...attendees], 'attendeeId').filter(
        (a) => a?.attendeeId,
      );
    }

    console.log(
      'TILE_RESUFFLE_LOG',
      'After reshuffle ',
      reshuffledTiles.map((attendee) => attendee?.name),
    );

    return reshuffledTiles;
  };

  updateAttendeeProfile = (attendeeData) => {
    const { attendeeId, profilePic, firstName, lastName } = attendeeData;
    if (this.attendees[attendeeId]) {
      this.attendees[attendeeId].profilePic = profilePic;
      this.attendees[attendeeId].firstName = firstName;
      this.attendees[attendeeId].lastName = lastName;
      this.publishAttendeeUpdate.cancel();
      this.publishAttendeeUpdate();
    }
    if (this.roster[attendeeId]) {
      this.roster[attendeeId].profilePic = profilePic;
      this.roster[attendeeId].firstName = firstName;
      this.roster[attendeeId].lastName = lastName;
      this.publishRosterUpdate.cancel();
      this.publishRosterUpdate();
    }
  };
}
