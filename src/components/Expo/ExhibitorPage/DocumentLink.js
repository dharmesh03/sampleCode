import React, { useEffect, useState } from 'react';
import { Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import map from 'lodash/map';
import size from 'lodash/size';
import filter from 'lodash/filter';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import loadable from '@loadable/component';
import { imgUrl as DOC_URL } from '../../../clientConfig';
import {
  logDocumentDownloadData,
  addDataToKinesis,
  logDocumentVisitLink,
} from '../../../routes/exhibitorPortal/action';
import {
  getUserExpoVisitData,
  selectorVirtualEventSettings,
  getUserTicketTypeIds,
} from '../../../routes/event/action/selectorVirtualEvent';
import { getEventData } from '../../../routes/event/action/selector';
import { getUserSession } from '../../../routes/login/action/selector';
import {
  EXHIBITOR_DOCUMENT_DOWNLOAD,
  EXHIBITOR_LINK_CLICK,
  DOWNLOADED_INFO_DESK_DOCUMENT,
  DOWNLOADED_SESSION_DOCUMENT,
  CLICKED_SESSION_LINK,
  CLICKED_INFO_DESK_LINK,
} from '../../../routes/exhibitorPortal/action/userActivityEventConstant';

const AETooltip = loadable(() => import('../../../Core/Tooltip'));
const AEIcons = loadable(() => import('../../../Core/Icon/index'));
const AELabel = loadable(() => import('../../../Core/Label/label'));

function DocumentLink({
  data,
  logDocumentDownloadData,
  logDocumentVisitLink,
  exhibitorId,
  eventId,
  isSetup,
  pushDataToKinesis,
  eventData,
  user,
  virtualEventSettings,
  userTicketTypeIds,
  setUserExpoVisitData,
  userExpoVisitData,
  isSession,
  handlePushDataToDynamoDB,
}) {
  const [localUserExpoVisitData, setLocalUserExpoVisitData] = useState(userExpoVisitData);
  const [addLinks, setAddLinks] = useState(true);
  const { linkToSite, socialLinks, documentKeyValue, addLinksInJson, linkKeyValue } = data;
  const { gamificationNewFlow } = virtualEventSettings || {};
  const docLink = documentKeyValue || [];
  const { t } = useTranslation('common');

  useEffect(() => {
    if (linkToSite) {
      if (size(docLink) > 0) {
        const checkLink = filter(docLink, (item) => item && item.key === linkToSite);
        if (addLinks && size(checkLink) === 0) {
          docLink.push({ key: linkToSite, value: linkToSite });
          setAddLinks(false);
        }
      } else {
        docLink.push({ key: linkToSite, value: linkToSite });
        setAddLinks(false);
      }
    }
  });

  const socialLink = [
    {
      value: '',
      key: 'facebook',
    },
    {
      value: '',
      key: 'twitter',
    },
    {
      value: '',
      key: 'instagram',
    },
    {
      value: '',
      key: 'linkedIn',
    },
  ];

  const handleIcon = (icon, isCustomLink) => {
    const splitValue = icon.split('.');
    const fileExtension = size(splitValue) >= 1 && splitValue[size(splitValue) - 1];
    if (!isCustomLink) {
      if (fileExtension === 'ppt' || fileExtension === 'pptx') {
        return 'ppt_icon';
      }
      if (fileExtension === 'docx' || fileExtension === 'doc' || fileExtension === 'docxx') {
        return 'doc_icon';
      }
      if (fileExtension === 'pdf') {
        return 'pdf_icon';
      }
      return 'file_icon';
    }
    return 'link_icon';
  };

  const setIcon = (icon, key, isCustomLink) => {
    switch (icon) {
      case 'facebook':
        return 'ac-icon-facebook';
      case 'twitter':
        return 'ac-icon-twitter';
      case 'instagram':
        return 'fa fa-instagram';
      case 'text':
        return handleIcon(key, isCustomLink);
      case 'dropbox':
        return 'fa fa-dropbox';
      case 'linkedIn':
        return 'fa fa-linkedin';
      default:
        return 'fa fa-link';
    }
  };
  const isDoc = size(docLink) > 0;
  const setUrl = (url) => (url.startsWith('http') || url.startsWith('mailto') ? url : `https://${url}`);

  const onDocumentClick = (doc) => {
    if (exhibitorId && eventId) {
      logDocumentDownloadData(exhibitorId, eventId, doc)
        .then(() => {})
        .catch(() => {});
    }
  };

  const onClickLink = (obj) => {
    if (exhibitorId && eventId) {
      logDocumentVisitLink(exhibitorId, eventId, obj);
    }
  };

  const handleExpoVisitDataForFirehose = (documentsOrLinks, doc) => {
    if (size(documentsOrLinks) > 0) {
      if (documentsOrLinks.indexOf(doc) === -1) {
        documentsOrLinks.push(doc);
      }
    } else {
      documentsOrLinks = [doc];
    }
    return documentsOrLinks;
  };

  const handleUserExpoVisitData = (isDocument, doc) => {
    const { eventId } = eventData;
    const { userId } = user;
    const expoId = parseInt(exhibitorId, 10);
    if (pushDataToKinesis && eventId && userId && expoId) {
      const userExpoVisitData = {
        eventId,
        userId,
        gameType: '',
        area: 'EXPO',
        expoId,
        date: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
        ticketTypeIds: size(userTicketTypeIds) > 0 ? userTicketTypeIds : [],
      };
      if (isDocument) {
        userExpoVisitData.documentDownloads = [doc];
      } else {
        userExpoVisitData.linkClicked = [doc];
      }
      if (gamificationNewFlow) {
        addDataToKinesis(userExpoVisitData, true);
      }
    }
  };

  const handleDocumentDownloadOrLinkClickEvent = (isLink, doc, link) => {
    if (handlePushDataToDynamoDB) {
      if (isLink) {
        if (isSession) {
          handlePushDataToDynamoDB(CLICKED_SESSION_LINK, { linkName: doc, link });
        } else if (isSetup) {
          handlePushDataToDynamoDB(CLICKED_INFO_DESK_LINK, { linkName: doc, link });
        } else if (exhibitorId) {
          handlePushDataToDynamoDB(EXHIBITOR_LINK_CLICK, { linkName: doc, link });
        }
      } else if (isSetup) {
        handlePushDataToDynamoDB(DOWNLOADED_INFO_DESK_DOCUMENT, { documentName: doc, link: window.location.href });
      } else if (isSession) {
        handlePushDataToDynamoDB(DOWNLOADED_SESSION_DOCUMENT, { documentName: doc, link: window.location.href });
      } else if (exhibitorId) {
        handlePushDataToDynamoDB(EXHIBITOR_DOCUMENT_DOWNLOAD, { documentName: doc, link: window.location.href });
      }
    }
  };

  const handleIsCustomLink = (doc) => {
    if (gamificationNewFlow) {
      handleUserExpoVisitData(false, doc);
    } else {
      localUserExpoVisitData.linkClicked = handleExpoVisitDataForFirehose(localUserExpoVisitData.linkClicked, doc);
    }
  };

  const handleDocumentDownload = (doc) => {
    if (gamificationNewFlow) {
      handleUserExpoVisitData(true, doc);
    } else {
      localUserExpoVisitData.documentDownloads = handleExpoVisitDataForFirehose(
        localUserExpoVisitData && localUserExpoVisitData.documentDownloads,
        doc,
      );
    }
  };

  const handleClick = (doc, isCustomLink, isweb, link) => {
    const obj = {
      documentLink: `${doc}`,
      documentName: null,
    };
    handleDocumentDownloadOrLinkClickEvent(isCustomLink || isweb, doc, link);
    if (isSetup) return;
    if (!isSession) {
      if (isCustomLink || isweb) {
        handleIsCustomLink(doc);
      } else {
        handleDocumentDownload(doc);
      }
      setUserExpoVisitData({ ...localUserExpoVisitData });
      if (isCustomLink || isweb) {
        onClickLink(obj);
      } else {
        onDocumentClick(doc);
      }
    }
  };

  const renderDoc = (doc, key, isCustomLink) => {
    const isWeb = doc === linkToSite;
    let docUrl = '';
    let link = '';
    if (isCustomLink) {
      docUrl = setUrl(key);
      link = key;
    } else if (isWeb) {
      docUrl = setUrl(linkToSite);
      link = key;
    } else {
      docUrl = `${DOC_URL}${key}`;
      link = doc;
    }
    return (
      <li className="doc-box" key={key}>
        <a
          className="doc-data outline_offset_2 cursor"
          role="button"
          target="_blank"
          rel="noopener noreferrer"
          href={docUrl}
          onClick={() => {
            handleClick(doc, isCustomLink, isWeb, link);
          }}
          id="docLink"
        >
          <AETooltip tooltip={doc} overlayProps={{ placement: 'top' }}>
            <span className="overflow-txt-ellipsis" id="docLink">
              <AEIcons
                className="icon"
                type={isWeb && setIcon()}
                svgIcon={!isWeb && setIcon('text', key, isCustomLink)}
                id="docLink"
                viewBox={!isWeb && handleIcon(key, isCustomLink) === 'link_icon' ? '0 0 20 20' : '0 0 791.454 791.454'}
              />
              <AELabel
                header={doc}
                variant="captions"
                color="#4B4D5F"
                labelClass="m-b-0 doc_link_label overflow-txt-ellipsis cursor"
              />
            </span>
          </AETooltip>
        </a>
      </li>
    );
  };
  useEffect(() => {
    if (userExpoVisitData) {
      setLocalUserExpoVisitData(userExpoVisitData);
    }
    setAddLinks(true);
  }, [userExpoVisitData]);

  return (
    <>
      <Col className="title-link">
        {(isDoc || size(addLinksInJson) > 0 || size(linkKeyValue) > 0 || isSetup) && (
          <h2 className="ae-heading4 m-0">{t('Documents & Links')}</h2>
        )}
        {!isSetup && socialLinks && (
          <ul className="link-list custom-social-share">
            {map(
              socialLinks || socialLink,
              (doc, key) =>
                socialLinks[key].value && (
                  <AETooltip
                    tooltip={doc.key.charAt(0).toUpperCase() + doc.key.slice(1)}
                    overlayProps={{ placement: 'top' }}
                  >
                    <li className={cx('list-box', doc.key)} key={key} id="socialLinks">
                      <span
                        onClick={() => doc.value && window.open(setUrl(doc.value))}
                        tabIndex="0"
                        id="socialLinks"
                        role="link"
                        className="line_height_0 b_rad_100 outline_offset_14"
                        onKeyDown={(e) => e.key === 'Enter' && doc.value && window.open(setUrl(doc.value))}
                        aria-label={doc.key}
                      >
                        <AEIcons className={cx('icon ', setIcon(doc.key))} style={{ fontSize: '18px' }} />
                      </span>
                    </li>
                  </AETooltip>
                ),
            )}
          </ul>
        )}
      </Col>
      <Col className="">
        {isDoc && (
          <Col>
            <ul className="doc-list p-l-0 m-b-0">
              {map(docLink, (doc) => doc && doc.key && doc.value && renderDoc(doc.value, doc.key))}
            </ul>
          </Col>
        )}
        {(size(addLinksInJson) > 0 || size(linkKeyValue) > 0) && (
          <Col>
            <ul className="doc-list p-l-0 m-b-0">
              {map(
                addLinksInJson || linkKeyValue,
                (doc) => doc && doc.key && doc.value && renderDoc(doc.key, doc.value, true),
              )}
            </ul>
          </Col>
        )}
      </Col>
    </>
  );
}

const mapDispatchToProps = {
  logDocumentDownloadData,
  logDocumentVisitLink,
};
const mapStateToProps = (state) => ({
  userExpoVisitData: getUserExpoVisitData(state),
  eventData: getEventData(state),
  user: getUserSession(state),
  userTicketTypeIds: getUserTicketTypeIds(state),
  virtualEventSettings: selectorVirtualEventSettings(state),
});

export default connect(mapStateToProps, mapDispatchToProps)(DocumentLink);
