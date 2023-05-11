export const ContentActionType = {
  STARTING: 'STARTING',
  DID_STOP: 'DID_STOP',
  UPDATE: 'UPDATE',
  REMOVE: 'REMOVE',
  DENIED: 'DENIED',
  RESET: 'RESET',
  RESET_ERROR: 'RESET_ERROR',
  SET_ERROR: 'SET_ERROR',
};

export const initialState = {
  tileId: null,
  paused: false,
  isLocalUserSharing: false,
  isLocalShareLoading: false,
  sharingAttendeeId: null,
  notSupported: false,
  error: null,
};

export const ContentShareErrorType = {
  NOT_SUPPORTED: 'NOT_SUPPORTED',
  ERROR: 'ERROR',
  PERMISSION_DENIED: 'Permission denied',
};

export function reducer(state, { type, payload }) {
  switch (type) {
    case ContentActionType.STARTING: {
      return {
        ...state,
        isLocalShareLoading: true,
        error: initialState?.error,
      };
    }
    case ContentActionType.UPDATE: {
      const { isLocalUser, tileState } = payload;
      const { tileId } = state;

      if (tileId === tileState.tileId || (tileId && tileId > tileState?.tileId)) {
        return { ...state, paused: tileState?.paused };
      }

      return {
        error: state?.error,
        paused: tileState?.paused,
        tileId: tileState?.tileId,
        isLocalShareLoading: false,
        isLocalUserSharing: isLocalUser,
        sharingAttendeeId: tileState.boundAttendeeId,
      };
    }
    case ContentActionType.REMOVE: {
      const { tileId } = state;

      if (tileId !== payload) {
        return state;
      }

      return initialState;
    }
    case ContentActionType.DID_STOP: {
      const { isLocalUserSharing } = state;

      if (isLocalUserSharing) {
        return initialState;
      }

      return {
        ...state,
        isLocalShareLoading: false,
        isLocalUserSharing: false,
        paused: false,
      };
    }
    case ContentActionType.DENIED: {
      if (!state.isLocalShareLoading) {
        return state;
      }

      return {
        ...state,
        isLocalShareLoading: false,
      };
    }
    case ContentActionType.SET_ERROR: {
      return {
        ...state,
        error: payload,
      };
    }
    case ContentActionType.RESET_ERROR: {
      return {
        ...state,
        error: initialState?.error,
      };
    }
    case ContentActionType.RESET: {
      return initialState;
    }
    default:
      throw new Error('Incorrect type in VideoProvider');
  }
}
