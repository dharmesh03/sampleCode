import gql from 'graphql-tag';
// -------------------------------- Noraml queries starts --------------------------------
export const getTracks = gql`
  query getTracks {
    listTracks {
      items {
        id
        name
        count
      }
    }
  }
`;

// -------------------------------- Noraml queries ends --------------------------------

// -------------------------------- Mutation queries starts --------------------------------
export const createTrack = gql`
  mutation createTrack($createTrack: CreateTrackInput!) {
    createTrack(input: $createTrack) {
      id
      name
    }
  }
`;

export const updateTrack = gql`
  mutation updateTrack($updateTrack: UpdateTrackInput!) {
    updateTrack(input: $updateTrack) {
      id
      name
    }
  }
`;

export const deleteTrack = gql`
  mutation deleteTrack($deleteTrack: DeleteTrackInput!) {
    deleteTrack(input: $deleteTrack) {
      id
    }
  }
`;

// -------------------------------- Mutation queries ends --------------------------------

// -------------------------------- Subscription queries starts --------------------------------
export const subscribeTrackCreation = gql`
  subscription getSubscriptions {
    onCreateTrack {
      id
      name
    }
  }
`;

export const subscribeTrackUpdate = gql`
  subscription updateSubscriptions {
    onUpdateTrack {
      id
      name
    }
  }
`;

export const subscribeTrackDelete = gql`
  subscription deleteSubscriptions {
    onDeleteTrack {
      id
      name
    }
  }
`;
// -------------------------------- Subscription queries ends --------------------------------
