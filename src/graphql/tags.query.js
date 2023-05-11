import gql from 'graphql-tag';
// -------------------------------- Noraml queries starts --------------------------------
export const getTags = gql`
  query getAllTags {
    listTags {
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
export const createTag = gql`
  mutation createTag($createTag: CreateTagInput!) {
    createTag(input: $createTag) {
      id
      eventId
      name
    }
  }
`;

export const updateTag = gql`
  mutation updateTag($updateTag: UpdateTagInput!) {
    updateTag(input: $updateTag) {
      id
      eventId
      name
    }
  }
`;

export const deleteTag = gql`
  mutation deleteTag($deleteTag: DeleteTagInput!) {
    deleteTag(input: $deleteTag) {
      id
    }
  }
`;

// -------------------------------- Mutation queries ends --------------------------------

// -------------------------------- Subscription queries starts --------------------------------
export const subscribeTagCreation = gql`
  subscription getSubscriptions {
    onCreateTag {
      id
      eventId
      name
    }
  }
`;

export const subscribeTagUpdate = gql`
  subscription updateSubscriptions {
    onUpdateTag {
      id
      eventId
      name
    }
  }
`;

export const subscribeTagDelete = gql`
  subscription deleteSubscriptions {
    onDeleteTag {
      id
      eventId
      name
    }
  }
`;

// export const subscribeTagCreation = gql `
//   subscription getSubscriptions{
//     onCreateTag {
//       id
//       eventId
//       title
//       startTime
//       endTime
//       location
//     }
//   }
// `

// export const subscribeTagUpdate = gql `
//   subscription updateSubscriptions{
//     onUpdateTag {
//       id
//       eventId
//       title
//       startTime
//       endTime
//       location
//     }
//   }
// `

// export const subscribeTagDelete = gql `
//   subscription deleteSubscriptions{
//     onDeleteTag {
//       id
//       eventId
//       title
//       startTime
//       endTime
//       location
//     }
//   }
// `
// -------------------------------- Subscription queries ends --------------------------------
