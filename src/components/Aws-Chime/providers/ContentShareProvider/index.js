import { DefaultModality, DefaultVideoTile } from 'amazon-chime-sdk-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

import useAudioVideo from '../../hooks/useAudioVideo';
import { ContentActionType, ContentShareErrorType, initialState, reducer } from './state';

const ContentShareContext = createContext(null);
const ContentShareControlContext = createContext(null);

const ContentShareType = {
  SCREEN: 'SCREEN',
  VIDEO: 'VIDEO',
};

const ContentShareProvider = ({ children }) => {
  const audioVideo = useAudioVideo();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { paused, isLocalUserSharing, isLocalShareLoading } = state;
  const localUserTileIdRef = useRef(null);
  const screenShareTileIdRef = useRef(null);
  const videoElement = useRef(null);

  useEffect(() => {
    if (!audioVideo) {
      return () => {};
    }

    const videoObserver = {
      videoTileDidUpdate: (tileState) => {
        if (!tileState.boundAttendeeId || !tileState.isContent || !tileState.tileId) {
          return;
        }
        const { boundAttendeeId } = tileState;
        const baseAttendeeId = new DefaultModality(boundAttendeeId).base();
        const localAttendeeId = audioVideo?.audioVideoController?.realtimeController?.state?.localAttendeeId;
        const isLocalUser = baseAttendeeId === localAttendeeId;

        if (isLocalUser && screenShareTileIdRef.current && screenShareTileIdRef.current < tileState.tileId) {
          audioVideo.stopContentShare();
          localUserTileIdRef.current = null;
          dispatch({
            type: ContentActionType.SET_ERROR,
            payload: {
              type: 'ERROR',
              level: 'warning',
              message: 'Your screenshare is stopped because someone is already sharing the screen.',
            },
          });
          return;
        }

        if (!isLocalUser && screenShareTileIdRef.current && screenShareTileIdRef.current < tileState.tileId) {
          return;
        }

        if (isLocalUser) {
          localUserTileIdRef.current = tileState.tileId;
        }

        if (!screenShareTileIdRef.current) {
          screenShareTileIdRef.current = tileState.tileId;
        }

        dispatch({
          type: ContentActionType.UPDATE,
          payload: {
            tileState,
            isLocalUser,
          },
        });
      },
      videoTileWasRemoved: (tileId) => {
        if (tileId === localUserTileIdRef.current) {
          localUserTileIdRef.current = null;
        }
        if (tileId === screenShareTileIdRef.current) {
          screenShareTileIdRef.current = null;
        }
        dispatch({
          type: ContentActionType.REMOVE,
          payload: tileId,
        });
      },
    };

    const contentShareObserver = {
      contentShareDidStop: () => {
        if (videoElement?.current) {
          DefaultVideoTile.disconnectVideoStreamFromVideoElement(videoElement?.current);
          videoElement.current.src = null;
        }
        dispatch({ type: ContentActionType.DID_STOP });
      },
    };

    audioVideo.addObserver(videoObserver);
    audioVideo.addContentShareObserver(contentShareObserver);

    return () => {
      audioVideo.removeObserver(videoObserver);
      audioVideo.removeContentShareObserver(contentShareObserver);
      dispatch({ type: ContentActionType.RESET });
    };
  }, [audioVideo]);

  useEffect(() => {
    if (!audioVideo) {
      return () => {};
    }

    const cb = (event) => {
      if (event.reason.name === 'NotAllowedError') {
        if (event.reason.message !== ContentShareErrorType.PERMISSION_DENIED) {
          dispatch({
            type: ContentActionType.SET_ERROR,
            payload: {
              type: 'ERROR',
              level: 'error',
              message: event.reason.message,
            },
          });
        }
        dispatch({ type: ContentActionType.DENIED });
      }
    };

    window.addEventListener('unhandledrejection', cb);
    return () => window.removeEventListener('unhandledrejection', cb);
  }, [isLocalShareLoading]);

  const toggleContentShare = useCallback(
    async (videoEl, sourceId, type = ContentShareType.SCREEN) => {
      if (!audioVideo) {
        return;
      }

      if (isLocalUserSharing || isLocalShareLoading) {
        audioVideo.stopContentShare();
      } else if (!navigator?.mediaDevices?.getDisplayMedia) {
        dispatch({
          type: ContentActionType.SET_ERROR,
          payload: {
            level: 'warning',
            type: ContentShareErrorType.NOT_SUPPORTED,
          },
        });
      } else {
        videoElement.current = videoEl;
        try {
          if (type === ContentShareType.VIDEO) {
            audioVideo.startContentShare(sourceId);
          } else if (sourceId && typeof sourceId === 'string') {
            audioVideo.startContentShareFromScreenCapture(sourceId).then((stream) => {
              DefaultVideoTile.connectVideoStreamToVideoElement(stream, videoEl, false);
            });
          } else {
            audioVideo.startContentShareFromScreenCapture().then((stream) => {
              DefaultVideoTile.connectVideoStreamToVideoElement(stream, videoEl, false);
            });
          }
        } catch (err) {
          dispatch({
            type: ContentActionType.SET_ERROR,
            payload: {
              type: 'ERROR',
              level: 'warning',
              message: err.message,
            },
          });
        }

        dispatch({ type: ContentActionType.STARTING });
      }
    },
    [audioVideo, isLocalUserSharing, isLocalShareLoading],
  );

  const onContentShareError = useCallback((error) => {
    dispatch({ type: ContentActionType.SET_ERROR, payload: error });
  }, []);

  const onResetContentShareError = useCallback(() => {
    dispatch({ type: ContentActionType.RESET_ERROR });
  }, []);

  const controlsValue = useMemo(
    () => ({
      paused,
      isLocalUserSharing,
      isLocalShareLoading,
      toggleContentShare,
      onContentShareError,
      onResetContentShareError,
    }),
    [
      paused,
      toggleContentShare,
      isLocalUserSharing,
      isLocalShareLoading,
      onContentShareError,
      onResetContentShareError,
    ],
  );

  return (
    <ContentShareContext.Provider value={state}>
      <ContentShareControlContext.Provider value={controlsValue}>{children}</ContentShareControlContext.Provider>
    </ContentShareContext.Provider>
  );
};

const useContentShareState = () => {
  const contentShareState = useContext(ContentShareContext);

  if (!contentShareState) {
    throw new Error('useContentShareState must be used within a ContentShareProvider');
  }

  return contentShareState;
};

const useContentShareControls = () => {
  const context = useContext(ContentShareControlContext);

  if (!context) {
    throw new Error('useContentShareControlContext must be used within ContentShareControlProvider');
  }
  return context;
};

export { ContentShareProvider, useContentShareState, useContentShareControls, ContentShareType, ContentShareErrorType };
