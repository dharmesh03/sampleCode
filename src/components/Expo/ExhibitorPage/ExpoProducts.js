import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import concat from 'lodash/concat';
import cx from 'classnames';
import map from 'lodash/map';
import get from 'lodash/get';
import size from 'lodash/size';
import uniqBy from 'lodash/uniqBy';
import { Carousel } from 'react-responsive-carousel';
import InfiniteScroll from 'react-infinite-scroller';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import '../../../sass/carousel.css';
import { cloudinary_name as CLOUDINARY_NAME, imgUrl as IMAGE_URL } from '../../../clientConfig';
import AEImage from '../../../Core/Image';
import { getExhibitorProduct } from '../../../routes/event/portal/mybooth/action';
import { getEventData } from '../../../routes/event/action/selector';
import AEButton from '../../../Core/Button/Button';
import AELabel from '../../../Core/Label/label';
import AEIcon from '../../../Core/Icon';
import { VIEWED_A_PRODUCT } from '../../../routes/exhibitorPortal/action/userActivityEventConstant';
import AEPopup from '../../../Core/Popup';

const sizePerPage = 15;
let dataTimeout = null;
function ExpoProducts(props) {
  const [productList, setProductList] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [productTotal, setProductTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { eventData, exhibitorId, tabTitle, exhibitorData } = props;
  const { currencySymbol } = exhibitorData || {};

  const { t } = useTranslation(['common', 'exhibitor']);

  const getExhibitorProduct = () => {
    const { eventUrl, eventURL } = eventData || {};
    const compareForNext = pageCount <= productTotal / sizePerPage;
    if (compareForNext && exhibitorId && (eventUrl || eventURL)) {
      props.getExhibitorProduct(exhibitorId, eventUrl || eventURL, pageCount, sizePerPage).then((resp) => {
        if (resp && !(resp.errorMessage || resp.message)) {
          const tempPageCount = pageCount + 1;
          let tempData = concat(productList, resp && resp.data);
          tempData = uniqBy(tempData, 'id');
          setProductList(tempData);
          setProductTotal((resp && resp.recordsTotal) || 0);
          setPageCount(tempPageCount);
          setHasMore(resp && resp.recordsTotal !== tempData.length);
        }
      });
    }
  };

  const toggleProductPopup = (productData) => {
    setShowProductPopup(!showProductPopup);
    setSelectedProduct(productData);
    if (!showProductPopup) {
      const { name } = productData;
      props.trackProductViewAndExpoVisitEvent({ productView: [name] });
      props.handlePushDataToDynamoDB(VIEWED_A_PRODUCT, { productName: name, link: window.location.href });
    }
  };

  const loadMoreRows = () => {
    if (dataTimeout) {
      clearTimeout(dataTimeout);
      dataTimeout = null;
    }
    if (hasMore) {
      dataTimeout = setTimeout(() => {
        getExhibitorProduct();
      }, 400);
    }
  };

  const setUrl = (url) => (url.startsWith('http') ? url : `https://${url}`);

  const renderDiscount = (item) => {
    let finalPrice = 0;
    let discount = 0;
    const { currencySymbol: eventCurrency } = eventData || {};
    let { discountAmount, price } = item || {};
    const { discountType } = item || {};
    discountAmount = parseFloat(discountAmount);
    price = parseFloat(price);
    if (discountType) {
      if (discountType === 'PERCENTAGE') {
        finalPrice = price * (discountAmount / 100);
        finalPrice = `${price - parseFloat(finalPrice)}`;
        finalPrice = parseFloat(finalPrice).toFixed(2);
        finalPrice = parseFloat(finalPrice);
        discount = `${discountAmount}%`;
      } else {
        finalPrice = price - discountAmount;
        finalPrice = parseFloat(finalPrice).toFixed(2);
        finalPrice = parseFloat(finalPrice);
        discount = `${discountAmount}`;
      }
    }
    return (
      <>
        {finalPrice > 0 && (
          <div className="product-price">
            {currencySymbol || eventCurrency}
            {finalPrice && parseFloat(finalPrice).toFixed(2)}
          </div>
        )}

        {discountAmount ? (
          <div className="product-extra-details">
            <span className="product-list-price">
              <span>{t('List')}: </span>
              <span className="list-price-middle-line">
                {currencySymbol || eventCurrency}
                {price && parseFloat(price).toFixed(2)}
              </span>
            </span>
            <span className="product-discount">
              {t('Save')}:
              {discountType === 'PERCENTAGE'
                ? `${discount && parseFloat(discount).toFixed(2)}%`
                : `${currencySymbol || eventCurrency}${discount && parseFloat(discount).toFixed(2)}`}
            </span>
          </div>
        ) : (
          ''
        )}
      </>
    );
  };

  const getPosition = (string, subString, index) => string.split(subString, index).join(subString).length;

  const checkScriptData = (data, item, newid, isFrom = false) => {
    let newString = data;
    if (isFrom) {
      const firstPosition = getPosition(item, `'`, 1);
      const secondPosition = getPosition(item, `'`, 2);
      const getId = item?.substring(firstPosition + 1, secondPosition);
      newString = data?.replaceAll(getId, `${getId}-popup`);
    }
    const removeScript = newString?.replaceAll('<script type="text/javascript">', '');
    const removeStartCmt = removeScript?.replaceAll('/*<![CDATA[*/', '');
    const removeEndCmt = removeStartCmt?.replaceAll('/*]]>*/', '');
    const removeEndScript = removeEndCmt?.replaceAll('</script>', '');
    const scriptData = removeEndScript?.replaceAll(isFrom ? `${newid}` : `${item}`, '');

    return (
      <Helmet allowscriptaccess dangerouslySetInnerHTML={{ __html: data }}>
        <script>{`${scriptData}`}</script>
      </Helmet>
    );
  };

  const getDivElements = (item, isFrom = false) => {
    const string = item;
    const length = 2;
    let openTag = 0;
    let closeTag = 0;
    let i = 0;
    for (i; i < length; i++) {
      if (string[i] === '<') openTag++;
      if (string[i] === '>') closeTag++;
    }
    if (openTag > closeTag) {
      while (string[i] !== '>') i++;
    }

    let newString = string.substring(0, i + 8);

    if (isFrom) {
      const firstPosition = getPosition(newString, `'`, 1);
      const secondPosition = getPosition(newString, `'`, 2);
      const getId = newString.substring(firstPosition + 1, secondPosition);
      newString = newString.replaceAll(getId, `${getId}-popup`);
    }
    return newString;
  };

  const productItem = (item) => (
    <div className="d-flex product-item">
      <div className="__product-item">
        <div className={cx('___product-item', !item?.productBuyButtonLink && '__no-product-item')}>
          <div className="product-image">
            <Carousel axis="horizontal" showThumbs={false} showArrows showStatus={false}>
              {item && item.images && size(item.images) > 0
                ? map(item.images, (imgItem) => (
                    <span onClick={() => toggleProductPopup(item)} className="cursor">
                      <AEImage
                        data-dz-thumbnail
                        className="img-responsive m-auto expo-product-image"
                        height="400"
                        dpr="auto"
                        crop="scale"
                        sizes="100vw"
                        fetchFormat="auto"
                        quality="auto"
                        cloudName={CLOUDINARY_NAME}
                        type="fetch"
                        secure
                        alt={`Product Image`}
                        responsive
                        publicId={`${IMAGE_URL}${imgItem.imageUrl}`}
                      />
                    </span>
                  ))
                : ''}
            </Carousel>
            {item && item.images && size(item.images) > 0 ? (
              ''
            ) : (
              <div className="__product-default-image">
                <AEIcon svgIcon="ac-icon-default-image" width="72" height="58" viewBox="0 0 72 58" color="none" />
              </div>
            )}
          </div>
          <div className="product-details-section cursor" onClick={() => toggleProductPopup(item)}>
            <AELabel header={item && item.name} variant={'subtitle2'} labelClass="cursor" className="m-b-10 m-t-10" />
            {renderDiscount(item)}
          </div>
          <div>
            {item?.productBuyButtonLink ? (
              <AEButton
                className="buy-button"
                id="learnMore"
                onClick={() => {
                  window.open(setUrl(item?.productBuyButtonLink), '_blank');
                  setTimeout(() => {
                    setShowProductPopup(false);
                  }, 0.0001);
                }}
              >
                {t('Learn More')}
              </AEButton>
            ) : (
              item?.shopifyBuyButton && (
                <div>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: getDivElements(item?.shopifyBuyButton),
                    }}
                  />
                  {checkScriptData(item?.shopifyBuyButton, getDivElements(item?.shopifyBuyButton))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    getExhibitorProduct();
    return () => {
      if (dataTimeout) {
        clearTimeout(dataTimeout);
        dataTimeout = null;
      }
    };
  }, [exhibitorId, eventData]);

  const myElementRef = () => document.getElementById('portal-content-wrapper');

  return (
    <>
      <div className="product-list-content fix-height">
        <div className="product-list-section">
          {size(productList) > 0 ? (
            <InfiniteScroll
              getScrollParent={myElementRef}
              hasMore={hasMore}
              loadMore={() => loadMoreRows()}
              minimumBatchSize={8}
              useWindow={false}
            >
              {size(productList) > 0 && map(productList, (item) => productItem(item))}
            </InfiniteScroll>
          ) : (
            <div className="no-data-wrapper justify-content-center">
              <AELabel header={t('exhibitor:No product found')} variant={'captions'} labelClass="m-b-0" />
            </div>
          )}
        </div>
      </div>
      {showProductPopup && (
        <AEPopup
          custClassName={'virtual-modal'}
          id="expoProductView"
          showModal={showProductPopup}
          headerText={tabTitle}
          headerClass="m-b-30"
          onCloseFunc={() => toggleProductPopup()}
        >
          <div className="product-view-section">
            <div className="d-flex product-item">
              <div className="__product-item">
                <div className="product-image">
                  <Carousel
                    axis="horizontal"
                    showThumbs={false}
                    showIndicators={selectedProduct.images && size(selectedProduct.images) > 1}
                    showArrows
                    showStatus={false}
                  >
                    {selectedProduct.images && size(selectedProduct.images) > 0
                      ? map(selectedProduct.images, (imgItem) => (
                          <AEImage
                            className="img-responsive"
                            height="400"
                            dpr="auto"
                            crop="scale"
                            sizes="100vw"
                            fetchFormat="auto"
                            quality="auto"
                            cloudName={CLOUDINARY_NAME}
                            type="fetch"
                            secure
                            alt={`Product Image`}
                            responsive
                            publicId={`${IMAGE_URL}${imgItem.imageUrl}`}
                          />
                        ))
                      : ''}
                  </Carousel>
                </div>
                <AELabel
                  header={selectedProduct && selectedProduct.name}
                  variant={'subtitle2'}
                  className="m-b-10 m-t-10 justify-content-center"
                />
                {renderDiscount(selectedProduct)}
                <div
                  className="product-description"
                  dangerouslySetInnerHTML={{
                    __html: selectedProduct && selectedProduct.description,
                  }}
                />
                {selectedProduct?.productBuyButtonLink && (
                  <div className="shopify-buy-button">
                    <AEButton
                      id="shopifylearnMore"
                      onClick={() => window.open(setUrl(selectedProduct.productBuyButtonLink), '_blank')}
                    >
                      {t('Learn More')}
                    </AEButton>
                  </div>
                )}
                {showProductPopup && selectedProduct && selectedProduct.shopifyBuyButton && (
                  <div>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: getDivElements(selectedProduct.shopifyBuyButton, true),
                      }}
                    />
                    {checkScriptData(
                      selectedProduct.shopifyBuyButton,
                      getDivElements(selectedProduct.shopifyBuyButton),
                      getDivElements(selectedProduct.shopifyBuyButton, true),
                      true,
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </AEPopup>
      )}
    </>
  );
}

const mapDispatchToProps = {
  getExhibitorProduct,
};
const mapStateToProps = (state) => ({
  eventData: getEventData(state),
  exhibitorData: get(state, 'exhibitor.exhibitor'),
});
export default connect(mapStateToProps, mapDispatchToProps)(ExpoProducts);
