import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import find from 'lodash/find';
import filter from 'lodash/filter';
import get from 'lodash/get';
import loadable from '@loadable/component';
import { cloudinary_url as CLOUDINARYURL, imgUrl as IMAGE_URL } from '../../clientConfig';
import { getAuthToken } from '../WebChat/action/index';
import { getUserSession } from '../../routes/login/action/selector';
import { getEventData, getHostEventData } from '../../routes/event/action/selector';

const AEExpoCard = loadable(() => import('../../Core/Card/Expo/ExpoCard'));

function ExpoCard({
  data,
  setData,
  isDisplayPage,
  compRepStatus,
  isSearching,
  eventData,
  isExpo,
  expoCardBackImgSize,
  isPreview,
  isDesign,
  isSponsorDesign,
  isBackgroundImage,
  category,
  isFromSession,
  isFeaturedExhibitorList,
}) {
  const [userAvailable, setUserAvailable] = useState(false);
  const { logo, boothSize, available, categoryId, showStatusIndicator, expoCardImage, sponsorCardImage, colorConfig } =
    data || {};
  const { nameColor, shortDescriptionColor } = colorConfig || {};
  const imgConfig =
    boothSize === 'LARGE'
      ? `c_fill,dpr_1.0,g_auto,h_120,w_240,q_100,f_auto,r_8`
      : boothSize !== 'SMALL'
      ? 'c_fill,dpr_1.0,g_auto,h_80,w_160,q_100,f_auto,r_8'
      : `c_fill,dpr_1.0,g_auto,h_63,w_125,q_100,f_auto,r_8`;

  const displayImgConfig =
    boothSize === 'LARGE'
      ? `c_fill,dpr_1.0,g_auto,h_135,w_270,q_100,f_auto,r_8`
      : boothSize !== 'SMALL'
      ? 'c_fill,dpr_1,g_auto,h_100,w_200,q_100,f_auto,r_8'
      : `c_fill,dpr_1.0,g_auto,h_74,w_148,q_100,f_auto,r_8`;

  useEffect(() => {
    if (available === 'available' && !isDisplayPage) {
      const compRepStatuses = compRepStatus || {};
      const channel = find(compRepStatuses.channels, { id: `Exhibitor_${data.id}` });
      if (channel) {
        setUserAvailable(channel.isOnline);
      }
    }
  }, [compRepStatus]);

  const cardImgConfig = `q_auto,f_auto,c_limit,c_fill_pad,c_fit,dpr_2.0,g_auto`;
  let expoCardBackgroundStyle = '';
  if (expoCardImage || sponsorCardImage) {
    expoCardBackgroundStyle = {
      backgroundImage: `url(${CLOUDINARYURL}/${cardImgConfig}/${IMAGE_URL}${expoCardImage || sponsorCardImage})`,
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      border: (expoCardBackImgSize || isBackgroundImage) && '3px solid #fff',
      aspectRatio: boothSize === 'LARGE' ? '4/1' : boothSize === 'MEDIUM' ? '2/1' : '1/1',
    };
  }
  const URL = logo ? `${CLOUDINARYURL}/${isDisplayPage ? displayImgConfig : imgConfig}/${IMAGE_URL}${logo}` : '';
  let status = 'away';
  const isShowAvailability = showStatusIndicator || available === 'sponsor';
  if (showStatusIndicator) {
    status = available === 'available' ? (userAvailable ? available : 'away') : available;
  } else {
    status = available === 'sponsor' ? available : status;
  }
  const nameTextColor = nameColor || '#ffffff';
  const shortDescriptionTextColor = shortDescriptionColor || '#ffffff';
  let categoryColorConfig = '';
  if (category) {
    categoryColorConfig = filter(category, { id: parseInt(categoryId, 10) });
    categoryColorConfig = get(categoryColorConfig, '[0].colorCode');
  }
  const categoryColor = categoryColorConfig || '#ffffff';
  return (
    <AEExpoCard
      exhibitorData={data}
      setData={setData}
      isDisplayPage={isDisplayPage}
      compRepStatus={compRepStatus}
      isSearching={isSearching}
      eventData={eventData}
      isExpo={isExpo}
      expoCardBackImgSize={expoCardBackImgSize}
      isPreview={isPreview}
      isDesign={isDesign}
      isSponsorDesign={isSponsorDesign}
      isBackgroundImage={isBackgroundImage}
      category={category}
      expoCardBackgroundStyle={expoCardBackgroundStyle}
      labelConfigColors={{ nameTextColor, categoryColor, shortDescriptionTextColor }}
      isShowAvailability={isShowAvailability}
      exhibitorLogo={URL}
      expoStatus={status}
      isFromSession={isFromSession}
      isFeaturedExhibitorList={isFeaturedExhibitorList}
      isImagePresent={expoCardImage || sponsorCardImage}
    />
  );
}

const mapDispatchToProps = {
  getAuthToken,
};
const mapStateToProps = (state) => ({
  compRepStatus: state.exhibitor.compRepStatus,
  user: getUserSession(state),
  eventData: getEventData(state) || getHostEventData(state),
  category: state.exhibitor.exhibitorCategory,
});

export default connect(mapStateToProps, mapDispatchToProps)(ExpoCard);
