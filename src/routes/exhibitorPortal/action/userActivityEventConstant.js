const JOINED_AN_EVENT = 'joined an event';
const BOOKMARKED_A_SESSION = 'bookmarked a session';
const UNDO_BOOKMARKED_A_SESSION = 'undo bookmarked a session';
const JOINED_A_SESSION = 'joined a session';
const JOINED_A_SESSION_AS_SPEAKER = 'joined a session as speaker';
const VIEWED_A_SPEAKER = 'viewed a speaker';
const VIEWED_A_SPONSOR = 'viewed a sponsor';
const VISITED_AN_EXPO = 'visited an expo';
const VIEWED_A_PEOPLE = 'viewed a people';
const JOINED_A_LOUNGE = 'joined a lounge';
const ENTERED_A_LOUNGE = 'entered a lounge';
const ADDED_A_COMMENT = 'added a comment';
const JOIN_EXPO_MEETING = 'joined exhibitor meeting';
const VIEWED_A_PRODUCT = 'viewed a product';
const PLAYED_EXPO_VIDEO = 'played exhibitor video';
const EXHIBITOR_LINK_CLICK = 'exhibitor link clicked';
const EXHIBITOR_DOCUMENT_DOWNLOAD = 'downloaded exhibitor document';
const EXHIBITOR_OFFER_LINK_CLICK = 'exhibitor offer link clicked';
const VIEWED_A_RECORDING = 'viewed a recording';
const LIKED_A_POST = 'liked a post';
const DOWNLOADED_INFO_DESK_DOCUMENT = 'downloaded info desk document';
const DOWNLOADED_SESSION_DOCUMENT = 'downloaded session document';
const CLICKED_SESSION_LINK = 'clicked session link';
const CLICKED_INFO_DESK_LINK = 'clicked info desk link';
const UNDO_LIKED_A_POST = 'undo liked a post';
const DELETED_A_COMMENT = 'deleted a comment';
const ADDED_A_FEED = 'added a feed';
const DELETED_A_FEED = 'deleted a feed';
const MOBILE = 'MOBILE';
const TABLET = 'TABLET';
const DESKTOP = 'DESKTOP';
const MAIN_STAGE = 'MAIN_STAGE';
const MEET_UP = 'MEET_UP';
const BREAKOUT_SESSION = 'BREAKOUT_SESSION';
const WORKSHOP = 'WORKSHOP';

export const userActionMap = {
  [JOINED_AN_EVENT]: 'Joined an Event',
  [BOOKMARKED_A_SESSION]: 'Bookmarked a Session',
  [UNDO_BOOKMARKED_A_SESSION]: 'Undo Bookmarked a Session',
  [JOINED_A_SESSION]: 'Joined a Session',
  [JOINED_A_SESSION_AS_SPEAKER]: 'Joined a Session as Speaker',
  [VIEWED_A_SPEAKER]: 'Viewed a Speaker',
  [VIEWED_A_SPONSOR]: 'Viewed a Sponsor',
  [VISITED_AN_EXPO]: 'Visited an Expo',
  [VIEWED_A_PEOPLE]: 'Viewed a People',
  [JOINED_A_LOUNGE]: 'Joined a Lounge',
  [ENTERED_A_LOUNGE]: 'Entered a Lounge',
  [ADDED_A_COMMENT]: 'Made a Comment',
  [JOIN_EXPO_MEETING]: 'Joined Exhibitor Meeting',
  [VIEWED_A_PRODUCT]: 'Viewed a Product',
  [PLAYED_EXPO_VIDEO]: 'Played Exhibitor Video',
  [EXHIBITOR_LINK_CLICK]: 'Clicked Exhibitor Link',
  [EXHIBITOR_DOCUMENT_DOWNLOAD]: 'Downloaded Exhibitor Document',
  [EXHIBITOR_OFFER_LINK_CLICK]: 'Clicked Exhibitor Offer Link',
  [VIEWED_A_RECORDING]: 'Viewed a Recording',
  [LIKED_A_POST]: 'Liked a Post',
  [DOWNLOADED_INFO_DESK_DOCUMENT]: 'Downloaded Info Desk Document',
  [DOWNLOADED_SESSION_DOCUMENT]: 'Downloaded Session Document',
  [CLICKED_SESSION_LINK]: 'Clicked Session Link',
  [CLICKED_INFO_DESK_LINK]: 'Clicked Info Desk Link',
  [UNDO_LIKED_A_POST]: 'Undo Liked a Post',
  [DELETED_A_COMMENT]: 'Deleted a Comment',
  [ADDED_A_FEED]: 'Added a Post',
  [DELETED_A_FEED]: 'Deleted a Post',
};

export {
  JOINED_AN_EVENT,
  BOOKMARKED_A_SESSION,
  UNDO_BOOKMARKED_A_SESSION,
  JOINED_A_SESSION,
  JOINED_A_SESSION_AS_SPEAKER,
  VIEWED_A_SPEAKER,
  VIEWED_A_SPONSOR,
  VISITED_AN_EXPO,
  VIEWED_A_PEOPLE,
  JOINED_A_LOUNGE,
  ENTERED_A_LOUNGE,
  ADDED_A_COMMENT,
  JOIN_EXPO_MEETING,
  VIEWED_A_PRODUCT,
  PLAYED_EXPO_VIDEO,
  EXHIBITOR_LINK_CLICK,
  EXHIBITOR_DOCUMENT_DOWNLOAD,
  EXHIBITOR_OFFER_LINK_CLICK,
  VIEWED_A_RECORDING,
  LIKED_A_POST,
  DOWNLOADED_INFO_DESK_DOCUMENT,
  DOWNLOADED_SESSION_DOCUMENT,
  CLICKED_SESSION_LINK,
  CLICKED_INFO_DESK_LINK,
  UNDO_LIKED_A_POST,
  DELETED_A_COMMENT,
  ADDED_A_FEED,
  DELETED_A_FEED,
  MAIN_STAGE,
  MEET_UP,
  BREAKOUT_SESSION,
  WORKSHOP,
};

export const deviceType = {
  [MOBILE]: 'MobileWeb',
  [TABLET]: 'TabletWeb',
  [DESKTOP]: 'Desktop',
};
