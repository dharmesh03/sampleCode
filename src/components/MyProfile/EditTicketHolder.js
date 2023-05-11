/* eslint-disable */
import { connect } from 'react-redux';
import cx from 'classnames';
import moment from 'moment-timezone';
import { Col, ControlLabel, FormGroup } from 'react-bootstrap';
import React from 'react';
import keys from 'lodash/keys';
import map from 'lodash/map';
import filter from 'lodash/filter';
import get from 'lodash/get';
import { withTranslation } from 'react-i18next';
import Webcam from 'react-webcam';
import $ from 'jquery';
import Script from 'react-load-script';
import isEmpty from 'lodash/isEmpty';
import postalCodes from 'postal-codes-js';
import {
  doGetTicketBuyerDetails,
  doGetTicketHolderDetails,
  doUpdateTicketBuyerDetails,
  doUpdateTicketHolderDetails,
  uploadFileForTicketing,
} from '../../routes/myProfile/myTicket/action/index';
import { removeSpecialCharacter } from '../Widget/Utility/jsFunction';
import { uploadImage } from '../Widget/UploadFile/action';
import { imgUrl as IMAGE_URL, cloudinary_url as CLOUDNARY_URL } from '../../clientConfig';
import { doValidateMobileNumber } from '../../routes/event/action/index';
import { CountryDropdown, RegionDropdown } from 'react-country-region-selector';
import { checkEmailCon, checkEmailTld, validateUnicode } from '../../utils/common';
import size from 'lodash/size';
import loadable from '@loadable/component';
import ContryList from '../../components/Widget/Utility/ContryList';
import { AEDropDown } from '../../Core/Dropdown';
import AERadioButton from '../../Core/RadioButton/RadioButton';
import {
  UserEmail,
  UserFirstName,
  UserLastName,
} from '../Checkout/TicketingCheckoutLayout/TicketSteps/UserBasicInformation';

const PopupModel = loadable(() => import('../../components/PopupModal'));
const UploadImageModel = loadable(() => import('../../components/Widget/UploadFile/UploadImageModel'));
const AEButton = loadable(() => import('../../Core/Button/Button'));
const AEInputField = loadable(() => import('../../Core/Input'));
const AEDateTime = loadable(() => import('../../Core/Date/index'));
const AEImage = loadable(() => import('../../Core/Image'));
const AETooltip = loadable(() => import('../../Core/Tooltip'));
const AEIntlTelInput = loadable(() => import('../../Core/PhoneInput/PhoneInput'));
const AECheckbox = loadable(() => import('../../Core/Checkbox/Checkbox'));
const AETextAreaField = loadable(() => import('../../Core/TextArea/index'));

let ticketHolder = {};
let TicketHolderQuestions = {};
let newSeatNumber = '';
let hasEventManagerRendered = false;

class EditTicketHolder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      holderData: {},
      ticketHolder: [],
      TicketHolderQuestions: [],
      errorTicketHolder: [],
      errorConditionalTicketHolder: [],
      errorQuestions: [],
      isDataUpdated: false,
      showPopup: true,
      showFormError: false,
      ticketCategory: null,
      seating: false,
      selectedSeats: [],
      hasSeatsioScriptLoaded: false,
      oldSeatNumber: '',
      showConfirmationDialog: false,
      holderImageList: null,
      selectedOption: '',
      firstName: '',
      firstNameFeedBack: null,
      displayFirstNameLength: null,
      lastName: '',
      lastNameFeedBack: null,
      displayLastNameLength: null,
      email: '',
      checkConOccurance: false,
      isUnicodePresent: false,
      displayEmailLength: null,
      shippingZipCode: false,
      shippingZipCodeMsg: '',
      billingZipCode: false,
      billingZipCodeMsg: '',
      isdisable: false,
      choices: [],
      isAllCheckBoxSelected: [],
      checkData: [],
      uploadedFileName: '',
      fileSizeError: false,
      loading: false,
      isError: false,
      cameraError: false,
      conditionalHolderData: [],
    };

    this.validateEmail = this.validateEmail.bind(this);
    this.updateHolderAttributes = this.updateHolderAttributes.bind(this);
    this.setTicketHolderDefaultAttribes = this.setTicketHolderDefaultAttribes.bind(this);
    this.getHolderOrPurchaserDetails = this.getHolderOrPurchaserDetails.bind(this);
    hasEventManagerRendered = false;
  }

  SeatsioEventManager = () => {
    if (!hasEventManagerRendered) {
      hasEventManagerRendered = true;
      const inst = this;
      newSeatNumber = '';
      const eventManagerObject = new seatsio.EventManager({
        divId: 'event-manager',
        secretKey: SEATSIO_SECREAT_KEY,
        event: inst.props.isRecurringEvent
          ? inst.state.holderData.eventKey.toString()
          : inst.props.eventDetails.eventId.toString(),
        mode: 'manageObjectStatuses',
        onObjectSelected: (selectedSeat) => {
          if (eventManagerObject && eventManagerObject.selectedObjects.length === 1) {
            if (selectedSeat.category) {
              newSeatNumber = selectedSeat && selectedSeat.id ? selectedSeat.id : '';
              if (selectedSeat.status === 'free' && newSeatNumber !== '' && this.props.ticketId) {
                inst.props
                  .doUpdateSeatNumber(inst.props.ticketId, newSeatNumber)
                  .then((res) => {
                    if (res?.data?.type === 'Success') {
                      this.setState({ oldSeatNumber: newSeatNumber });
                    }
                  })
                  .catch((error) => {});
              }
            }
          } else {
            this.toggleConfirmationDialog();
          }
        },
        onFullScreenOpened: () => {
          $('#popupDialog1 .modal-dialog').addClass('modal-mw-full');
        },
        onFullScreenClosed: () => {
          $('#popupDialog1 .modal-dialog').removeClass('modal-mw-full');
        },
      }).render();
    }
  };

  buyerPhoneNumberValidateHandler(isValid, value, name, countryData, number, ext, field, key, event) {
    const object = ticketHolder || {};
    if (!object[field.name]) {
      object[field.name] = [];
    }
    if (!object[field.name]) {
      object[field.name] = {};
    }
    object[field.name] = {
      key: field.name,
      value: `${value}|${name.iso2}`,
    };
    if (value === '') {
      if (field.mandatory) {
        this.setState({
          phoneNumberFeedBack: true,
          phoneNumber: false,
          errorMsgPhoneNumber: 'Phone Number is Required',
        });
      } else {
        delete object[field.name].value;
      }
    } else {
      name &&
        name?.dialCode &&
        this.props.doValidateMobileNumber(`+${name?.dialCode}${value}`).then((resp) => {
          if (resp)
            this.setState({
              phoneNumberFeedBack: true,
              errorMsgPhoneNumber: 'Invalid phone number',
              updatedNumber: true,
            });
          else this.setState({ phoneNumberFeedBack: false, updatedNumber: true });
        });
    }
    event = document.getElementById(field.name + key);
    if (field.mandatory) {
      if (!value) {
        object[field.name].error = true;
        if (object.phoneNumber) {
          object.phoneNumber.error = true;
        }
        event?.parentElement.classList.add('has-error');
        event?.parentElement.classList.remove('has-success');
      } else {
        object[field.name].error = false;
        event?.parentElement.classList.add('has-success');
        event?.parentElement.classList.remove('has-error');
      }
    }
    ticketHolder = object;
  }

  UNSAFE_componentWillMount = () => {
    this.changePhone = this.phoneNumberValidateHandler.bind(this, 'phone');
    this.getHolderOrPurchaserDetails();
  };

  setFileUploadData = (item, data, file) => {
    const object = ticketHolder || {};
    const value = file.name;
    object[item.name] = {
      key: item.name,
      value,
    };
    this.setState({
      uploadedFileName: value,
    });
    object[item.name].error = false;
    $('.edit_ticket_file_upload').removeClass('has-error');
    $('.edit_ticket_file_upload').addClass('has-success');
    if (item.mandatory) {
      if (!value) {
        object[item.name].error = true;
        $('.edit_ticket_file_upload').addClass('has-error');
        $('.edit_ticket_file_upload').removeClass('has-success');
      } else {
        $('.edit_ticket_file_upload').removeClass('has-error');
        $('.edit_ticket_file_upload').addClass('has-success');
      }
    }
    ticketHolder = object;
  };

  setSubQuestion = (holderData, parentQueList) => {
    const { conditionalHolderData } = this.state || {};

    parentQueList.forEach((item) => {
      const subQuestionKey = JSON.parse(item?.defaultValue)?.dafultvalues?.dafultvalue.find(
        (e) => e.value === item?.value,
      ).key;

      const childQuestion = holderData?.nestedQuestions
        ?.filter((e) => e.parentQueId === item?.id)
        .find((subQues) => subQues?.selectedAnsId?.toString() === subQuestionKey);

      if (childQuestion !== undefined) {
        conditionalHolderData[item.name].push(childQuestion);
        // this.setSubQuestion(holderData, parentQueList);
        this.setState({
          conditionalHolderData,
        });
      }
    });
  };

  updateNestedQuesIdList = (item, conditionalHolderData, holderData, parentQuesKey) => {
    const subQuestionAnsKey = JSON.parse(item?.defaultValue)?.dafultvalues?.dafultvalue.find(
      (e) => e?.value?.trim() === item?.value?.trim(),
    )?.key;
    if (subQuestionAnsKey) {
      const childQues = holderData?.nestedQuestions
        ?.filter((ques) => ques.parentQueId === item.id)
        ?.find((subQues) => subQues?.selectedAnsId?.toString() === subQuestionAnsKey.toString());

      if (childQues) {
        const subQuestionLabel =
          childQues?.defaultValue &&
          JSON.parse(childQues?.defaultValue)?.dafultvalues?.dafultvalue.find((e) => e.label === 'Other');
        if (childQues?.value && subQuestionLabel) {
          const subQuesValue =
            childQues?.defaultValue &&
            JSON.parse(childQues?.defaultValue)?.dafultvalues?.dafultvalue.find((e) => e.value === childQues?.value);
          if (!subQuesValue) {
            childQues.otherOption = true;
          }
        }
        conditionalHolderData[parentQuesKey].push(childQues);
        this.updateNestedQuesIdList(childQues, conditionalHolderData, holderData, parentQuesKey);
      }
    }
  };

  setNestedCustomDataAttribute = (holderData) => {
    const { conditionalHolderData } = this.state || {};
    holderData?.nestedQuestions?.forEach((item) => {
      if (item?.parentQueId === 0 || item?.parentQueId === null) {
        if (!conditionalHolderData[item.name]) {
          conditionalHolderData[item.name] = [];
        }
        const subQuestionLabel =
          item?.defaultValue &&
          JSON.parse(item?.defaultValue)?.dafultvalues?.dafultvalue.find((e) => e.label === 'Other');

        if (item?.value && subQuestionLabel) {
          const subQuesValue =
            item?.defaultValue &&
            JSON.parse(item?.defaultValue)?.dafultvalues?.dafultvalue.find((e) => e.value === item?.value);
          if (!subQuesValue) {
            item.otherOption = true;
          }
        }
        conditionalHolderData[item.name].push(item);
        this.updateNestedQuesIdList(item, conditionalHolderData, holderData, item.name);

        this.setState({
          conditionalHolderData,
        });
      }
    });
  };

  setNestedQuestionData = (holderData, isUpdated = false) => {
    const { conditionalHolderData } = this.state || {};
    if (isUpdated) {
      this.setState(
        {
          conditionalHolderData: [],
        },
        () => {
          this.setNestedCustomDataAttribute(holderData);
        },
      );
    } else {
      this.setNestedCustomDataAttribute(holderData);
    }
  };

  getHolderOrPurchaserDetails = () => {
    ticketHolder = {};
    this.setState({
      errorTicketHolder: {},
      errorConditionalTicketHolder: [],
    });
    const { ticketId, isHolder, orderId } = this.props;
    if (isHolder) {
      if (ticketId) {
        this.props
          .doGetTicketHolderDetails(ticketId)
          .then((resp) => {
            const holderData = resp && resp.data;
            if (holderData) {
              this.setState(
                {
                  holderData,
                  oldSeatNumber: holderData.seatNumber,
                },
                () => {
                  const { holderData } = this.state;
                  this.initFormValues(holderData);
                  this.setNestedQuestionData(holderData);
                },
              );
              if (holderData.attributes) {
                this.setTicketHolderDefaultAttribes(holderData.attributes);
              }
            }
          })
          .catch((error) => {
            const orderRefundError = error && error.response && error.response.data;
            this.setState({
              dialogTitle: 'Error',
              dialogMessage:
                (orderRefundError && orderRefundError.errorMessage) || 'Oops something went wrong, Try again later',
            });
            setTimeout(() => {
              this.toggleDialog();
            }, 10);
          });
      } else {
        this.setState({
          dialogTitle: 'Not Found',
          dialogMessage: 'TicketId not found. Please try again later.',
        });
        setTimeout(() => {
          this.toggleDialog();
        }, 10);
      }
    } else if (orderId) {
      this.props
        .doGetTicketBuyerDetails(orderId)
        .then((resp) => {
          this.setState(
            {
              holderData: resp && resp.data,
            },
            () => {
              const { holderData } = this.state;
              this.initFormValues(holderData);
              this.setNestedQuestionData(holderData);
            },
          );
          if (resp && resp.data && resp.data.attributes) {
            this.setTicketHolderDefaultAttribes(resp.data.attributes);
          }
        })
        .catch((error) => {
          const orderRefundError = error && error.response && error.response.data;
          this.setState({
            dialogTitle: 'Error',
            dialogMessage:
              (orderRefundError && orderRefundError.errorMessage) || 'Oops something went wrong, Try again later',
          });
          setTimeout(() => {
            this.toggleDialog();
          }, 10);
        });
    } else {
      this.setState({
        dialogTitle: 'Not Found',
        dialogMessage: 'Order Id not found. Please try again later.',
      });
      setTimeout(() => {
        this.toggleDialog();
      }, 10);
    }
  };

  onChangeFileUpload = (e, item) => {
    const file = e.target.files[0];
    if (file) {
      this.setState({
        uploadedFileName: file.name,
      });
      if (file.size >= 5000000) {
        this.setState({ fileSizeError: true });
      } else {
        $('.edit_ticket_file_upload').removeClass('has-error');
        $('.edit_ticket_file_upload').addClass('has-success');

        this.setState({ fileSizeError: false, loading: true, message: 'Uploading...' });

        this.props
          .uploadFileForTicketing('event/upload/uploadFileForTicketing', file)
          .then((resp) => {
            this.setState({ loading: false });
            if (resp && resp.status === 200 && resp.data) {
              this.setState({
                message: 'File uploaded successfully',
                isError: false,
              });
              this.setFileUploadData(item, resp.data, file);
            } else {
              this.setState({
                message: resp?.data?.errorMessage || 'Something went wrong, please try again',
                isError: true,
              });
            }
            setTimeout(() => {
              this.setState({
                message: '',
                loading: false,
              });
            }, 2000);
          })
          .catch((error) => {
            this.setState({
              message: '',
              loading: false,
            });
          });
      }
    }
  };

  getSelectOptionJson = (itemValue) => {
    if (!itemValue || !itemValue.length) {
      return [];
    }
    const itemValueString = itemValue.toString();
    const ChoiceSArray = [];
    JSON.parse(itemValueString)?.dafultvalues?.dafultvalue?.forEach((e) => {
      if (e && e.label && e.value) ChoiceSArray.push([e.label.toString(), e.value.toString()]);
    });
    return ChoiceSArray;
  };

  validateDateHandler = (selectedDate) => selectedDate.isBefore(moment(new Date()).format('MM/DD/YYYY'));

  handleHolderDate = (field, key, date) => {
    if (date) {
      if (moment(date, 'MM/DD/YYYY', true).isValid()) {
        const value = date.format('MM/DD/YYYY');

        const object = ticketHolder || {};
        if (!object[field.name]) {
          object[field.name] = {};
        }
        object[field.name] = {
          key: field.name,
          value,
        };
        const isValidDate = moment(date, 'MM/DD/YYYY', true).isValid() && this.validateDateHandler(date);
        if (field.name?.toLowerCase().includes('birth') && field.type === 'date' && !isValidDate) {
          this.setState({ invalidDate: true });
        } else if (field.name?.toLowerCase().includes('birth') && field.type === 'date' && isValidDate) {
          this.setState({ invalidDate: false });
        }
        const ele = document.querySelector(`#inputQue${key}`);
        if (field.mandatory) {
          if (!value) {
            if (key in object && field?.name in object[key] && object[key][field.name])
              object[key][field.name].error = true;
            ele.parentElement.parentElement.classList.add('has-error');
            ele.parentElement.parentElement.classList.remove('has-success');
          } else {
            if (key in object && field?.name in object[key] && object[key][field.name])
              object[key][field.name].error = false;
          }
        }
        ele.parentElement.parentElement.classList.add('has-feedback');
        if (value) {
          ele.parentElement.parentElement.classList.add('has-success');
          ele.parentElement.parentElement.classList.remove('has-error');
        }
        ticketHolder = object;
      }
    }
  };

  handleScriptLoad = () => {
    this.setState({
      hasSeatsioScriptLoaded: true,
    });
  };

  hideEditPopup(message) {
    this.props.hidePopup(message);
  }

  hideImagePopup = () => {
    this.setState({
      showImagePopup: false,
    });
  };

  holderInformationImage = (field, imageName, key) => {
    const object = ticketHolder || {};
    const value = imageName;
    if (!object[field.name]) {
      object[field.name] = {};
    }
    object[field.name] = {
      key: field.name,
      value,
    };
    const holderImageList = this.state.holderImageList || {};
    holderImageList[field.name] = {};
    holderImageList[field.name] = value;
    this.setState({ holderImageList });
    if (field.mandatory) {
      if (!event.target.value) {
        object[field.name].error = true;
        $('.buyer_image_upload').addClass('has-error');
        $('.buyer_image_upload').removeClass('has-success');
      } else {
        object[field.name].error = false;
        $('.buyer_image_upload').removeClass('has-error');
        $('.buyer_image_upload').addClass('has-success');
      }
    }
    ticketHolder = object;
  };

  imageUploaded = (imageUrl) => {
    this.setState({
      showImagePopup: false,
    });
    if (imageUrl && this.state.imageDetail) {
      this.holderInformationImage(this.state.imageDetail, imageUrl, this.state.imageDetailKey);
    }
  };

  initFormValues = (holderData, isUpdate = false) => {
    if (holderData && holderData.attributes) {
      holderData.attributes.map((field) => {
        if (!ticketHolder) {
          ticketHolder = {};
        }
        if (isUpdate) {
          if (ticketHolder[field.name]) {
            ticketHolder[field.name] = {
              key: field.name,
              value: field.value,
            };
          }
          if (field.type === 'MULTIPLE_CHOICE') {
            const { choices, checkData, isAllCheckBoxSelected } = this.state || {};
            if (ticketHolder[field.name]) {
              choices[field.name] = ticketHolder[field.name].value.split('|');
              checkData[field?.name] = ticketHolder[field.name].value.split('|');
              if (!isAllCheckBoxSelected[field?.name]) {
                isAllCheckBoxSelected[field?.name] = [];
              }
              const isAllSelected = this.selectedAll(this.getSelectOptionJson(field.defaultValue).length, field.name);
              isAllCheckBoxSelected[field.name] = isAllSelected;
              this.setState({
                choices,
                checkData,
                isAllCheckBoxSelected,
              });
            }
          }
        } else {
          if (!ticketHolder[field.name]) {
            ticketHolder[field.name] = {
              key: field.name,
              value: field.value,
            };
          }
        }
        this.doCreateAndSetBillingAddressFields(field);
        this.doCreateAndSetShippingAddressFields(field);
      });
    }
    this.doSetHolderQuestions(holderData);
    this.setState({
      attendee: ticketHolder,
    });
  };

  onChartRendered = (chart) => {
    $('#poweredBy').hide();
  };

  phoneNumberValidateHandler(name, isValid, value, countryData) {
    this.setState({
      phone: value,
      countryPhone: countryData && countryData.iso2,
      country: countryData && countryData.iso2,
      phoneNumberFeedBack: true,
      errorMsgPhoneNumber: '',
    });
    if (value === '') {
      this.setState({
        phoneNumber: false,
        errorMsgPhoneNumber: 'Phone Number is Required',
      });
    } else {
    }
    this.setState({
      phone: value,
      country: countryData && countryData.iso2,
    });
  }

  handleSelect = (e) => {
    const { orderId, purchaserName, ticketId, isHolder } = this.props;
    const selectedOption = e.target.value;
    if ((selectedOption === purchaserName || (selectedOption === '' && !isHolder)) && orderId) {
      this.props.doGetTicketBuyerDetails(orderId).then((resp) => {
        if (resp && resp.data) {
          this.setState(
            {
              selectedOption,
            },
            () => {
              this.initFormValues(resp.data, true);
            },
          );
        }
      });
    } else {
      const eventTicketingId = selectedOption !== '' ? selectedOption : ticketId;
      this.props.doGetTicketHolderDetails(eventTicketingId).then((resp) => {
        if (resp && resp.data) {
          this.setState(
            {
              selectedOption,
            },
            () => {
              this.initFormValues(resp.data, true);
            },
          );
        }
      });
    }
  };

  doCreateAndSetBillingAddressFields = (field) => {
    if (field.mandatory && field.name && /^BILLING_ADDRESS/i.test(field.type)) {
      if (!ticketHolder[`${field.name} 1`]) {
        ticketHolder[`${field.name} 1`] = {};
      }
      if (!ticketHolder[`${field.name} 2`]) {
        ticketHolder[`${field.name} 2`] = {};
      }
      if (!ticketHolder[`${field.name} City`]) {
        ticketHolder[`${field.name} City`] = {};
      }
      if (!ticketHolder[`${field.name} State`]) {
        ticketHolder[`${field.name} State`] = {};
      }
      if (!ticketHolder[`${field.name} Zip Code`]) {
        ticketHolder[`${field.name} Zip Code`] = {};
      }
      if (!ticketHolder[`${field.name} Country`]) {
        ticketHolder[`${field.name} Country`] = {};
      }
      this.doSetBillingAddressFields(field);
    }
    if (field.mandatory && field.name && /^COUNTRY/i.test(field.type)) {
      if (!ticketHolder[field.name]) {
        ticketHolder[field.name] = {};
      }
      this.doSetBillingAddressFields(field);
    }
    if (field.mandatory && field.name && /^STATE/i.test(field.type)) {
      if (!ticketHolder[field.name]) {
        ticketHolder[field.name] = {};
      }

      this.doSetBillingAddressFields(field);
    }
  };

  doSetBillingAddressFields = (field) => {
    if (field.mandatory && field.name && /^BILLING_ADDRESS/i.test(field.type)) {
      if (ticketHolder[`${field.name} 1`]) {
        ticketHolder[`${field.name} 1`] = {
          key: `${field.name} 1`,
          value: this.getAddressValueString(ticketHolder[`${field.name}`], 0),
        };
      }
      if (ticketHolder[`${field.name} 2`]) {
        ticketHolder[`${field.name} 2`] = {
          key: `${field.name} 2`,
          value: this.getAddressValueString(ticketHolder[`${field.name}`], 1),
        };
      }
      if (ticketHolder[`${field.name} City`]) {
        ticketHolder[`${field.name} City`] = {
          key: `${field.name} City`,
          value: this.getAddressValueString(ticketHolder[`${field.name}`], 2),
        };
      }
      if (ticketHolder[`${field.name} State`]) {
        ticketHolder[`${field.name} State`] = {
          key: `${field.name} State`,
          value: this.getAddressValueString(ticketHolder[`${field.name}`], 3),
        };
      }
      if (ticketHolder[`${field.name} Zip Code`]) {
        ticketHolder[`${field.name} Zip Code`] = {
          key: `${field.name} Zip Code`,
          value: this.getAddressValueString(ticketHolder[`${field.name}`], 4),
        };
      }
      if (ticketHolder[`${field.name} Country`]) {
        ticketHolder[`${field.name} Country`] = {
          key: `${field.name} Country`,
          value: this.getAddressValueString(ticketHolder[`${field.name}`], 5),
        };
      }
    }
    if (field.mandatory && field.name && /^COUNTRY/i.test(field.type)) {
      if (ticketHolder[`${field.name} State`]) {
        ticketHolder[`${field.name} State`] = {
          key: `${field.name} State`,
          value: ticketHolder[`${field.name} State`].value,
        };
      }
      if (ticketHolder[`${field.name} Country`]) {
        ticketHolder[`${field.name} Country`] = {
          key: `${field.name} Country`,
          value: ticketHolder[`${field.name} Country`].value,
        };
      }
    }
  };

  doCreateAndSetShippingAddressFields = (field) => {
    if (field.name && /^SHIPPING_ADDRESS/i.test(field.type)) {
      if (!ticketHolder[`${field.name} 1`]) {
        ticketHolder[`${field.name} 1`] = {};
      }
      if (!ticketHolder[`${field.name} 2`]) {
        ticketHolder[`${field.name} 2`] = {};
      }
      if (!ticketHolder[`${field.name} City`]) {
        ticketHolder[`${field.name} City`] = {};
      }
      if (!ticketHolder[`${field.name} State`]) {
        ticketHolder[`${field.name} State`] = {};
      }
      if (!ticketHolder[`${field.name} Zip Code`]) {
        ticketHolder[`${field.name} Zip Code`] = {};
      }
      if (!ticketHolder[`${field.name} Country`]) {
        ticketHolder[`${field.name} Country`] = {};
      }
      this.doSetShippingAddressFields(field);
    }
  };

  doSetShippingAddressFields = (field) => {
    if (field.name && /^SHIPPING_ADDRESS/i.test(field.type)) {
      if (ticketHolder[`${field.name} 1`]) {
        ticketHolder[`${field.name} 1`] = {
          key: `${field.name} 1`,
          value: this.getAddressValueString(ticketHolder[`${field.name}`], 0),
        };
      }
      if (ticketHolder[`${field.name} 2`]) {
        ticketHolder[`${field.name} 2`] = {
          key: `${field.name} 2`,
          value: this.getAddressValueString(ticketHolder[`${field.name}`], 1),
        };
      }
      if (ticketHolder[`${field.name} City`]) {
        ticketHolder[`${field.name} City`] = {
          key: `${field.name} City`,
          value: this.getAddressValueString(ticketHolder[`${field.name}`], 2),
        };
      }
      if (ticketHolder[`${field.name} State`]) {
        ticketHolder[`${field.name} State`] = {
          key: `${field.name} State`,
          value: this.getAddressValueString(ticketHolder[`${field.name}`], 3),
        };
      }
      if (ticketHolder[`${field.name} Zip Code`]) {
        ticketHolder[`${field.name} Zip Code`] = {
          key: `${field.name} Zip Code`,
          value: this.getAddressValueString(ticketHolder[`${field.name}`], 4),
        };
      }
      if (ticketHolder[`${field.name} Country`]) {
        ticketHolder[`${field.name} Country`] = {
          key: `${field.name} Country`,
          value: this.getAddressValueString(ticketHolder[`${field.name}`], 5),
        };
      }
    }
  };

  doSetHolderQuestions = (holderData) => {
    if (holderData.questions && TicketHolderQuestions) {
      holderData.questions.map((field) => {
        if (!TicketHolderQuestions) {
          TicketHolderQuestions = {};
        }
        if (!TicketHolderQuestions[field.name]) {
          TicketHolderQuestions[field.name] = {};
        }
      });
    }
  };

  downloadBuyerHolderFile = (value) => {
    if (value) {
      const file = value.split('|');
      const fileUrl = `${IMAGE_URL}ticket_buyer_uploads/${file[0]}`;
      const tempLink = document.createElement('a');

      tempLink.href = fileUrl;
      tempLink.setAttribute('download', file[1]);
      tempLink.setAttribute('target', '_blank');
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
    }
  };

  toggleAllTicketsType = (e, item) => {
    const checked = e.target.checked;

    const { checkData, isAllCheckBoxSelected, choices, holderData } = this.state;
    const fieldName = item?.name;
    if (!checkData[fieldName]) {
      checkData[fieldName] = [];
    }
    if (!choices[fieldName]) {
      choices[fieldName] = [];
    }
    if (!isAllCheckBoxSelected[fieldName]) {
      isAllCheckBoxSelected[fieldName] = [];
    }

    const object = ticketHolder || {};
    holderData?.attributes?.map((item) => {
      if (item.type === 'MULTIPLE_CHOICE' && item.name === fieldName) {
        this.getSelectOptionJson(item.defaultValue).map((itemData) => {
          if (checked) {
            if (!checkData[fieldName]?.includes(itemData[0])) {
              checkData[fieldName].push(itemData[0]);
              choices[fieldName].push(itemData[0]);
            }
          } else {
            checkData[fieldName] = [];
            choices[fieldName] = [];
          }
        });
        object[fieldName] = {
          key: fieldName,
          value: choices[fieldName].join('|'),
        };
        isAllCheckBoxSelected[fieldName] = checked;
        this.setState(
          {
            isAllCheckBoxSelected,
            checkData,
            choices,
          },
          () => {
            checkData &&
              map(checkData[fieldName], (item, index) => {
                if (item && document.querySelector(`#check-editholder-${removeSpecialCharacter(item)}-${index}`)) {
                  document.querySelector(
                    `#check-editholder-${removeSpecialCharacter(item)}-${index}`,
                  ).checked = checked;
                }
              });
          },
        );
        ticketHolder = { ...object };
      }
    });
  };

  selectedAll = (allCheckBox, fieldName) => {
    const { checkData } = this.state || {};
    return checkData[fieldName]?.length >= allCheckBox;
  };

  setCameraError = () => this.setState({ cameraError: 'Camera access permission denied' });

  setRef = (webcam) => {
    this.webcam = webcam;
    setTimeout(() => {
      const hasCamera = get(this.webcam, 'state.hasUserMedia');
      if (hasCamera) this.setState({ cameraError: false });
      else this.setCameraError();
    }, 2000);
  };

  doTakePicture = () => {
    const imageSrc = this.webcam.getScreenshot();
    const fileName = Math.floor(Math.random() * 10000 + 1000);
    const file = this.dataURLtoFile(imageSrc, `${fileName}.jpeg`);
    const isTicketing = true;
    if (file) {
      this.props
        .uploadImage(file, isTicketing)
        .then((resp) => {
          if (resp && resp.data && resp.status === 200) {
            this.imageUploaded(resp.data.message);
            this.hideImagePopup();
          }
        })
        .catch((error) => error && error.response && error.response.data);
    }
  };

  dataURLtoFile = (dataurl, filename) => {
    let result = '';
    if (dataurl) {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      result = new File([u8arr], filename, { type: mime });
    }
    return result;
  };

  getAddressValueString = (attrib, index) => {
    let returnString = '';
    let attribValue = '';
    if (index !== undefined) {
      if (attrib.value) {
        attribValue = attrib.value.split('|')[index];
      }
    } else if (attrib && !attrib.value) {
      attribValue = attrib;
    }
    if (attribValue && attribValue !== null && attribValue !== undefined && !isEmpty(attribValue)) {
      returnString = attribValue;
    }
    return returnString;
  };

  getSelectOptionForCustomAttribute = (itemValue) => {
    if (!itemValue || !itemValue.length) {
      return [];
    }
    const itemValueString = itemValue.toString();
    const ChoiceSArray = [];
    JSON.parse(itemValueString)?.dafultvalues?.dafultvalue?.forEach((e) => {
      if (e && e.label && e.value) {
        ChoiceSArray.push({ label: e.label.toString(), value: e.value.toString(), key: e.key });
      } else if (e.label === 'Other') {
        ChoiceSArray.push({ label: e.label.toString(), value: e.value.toString(), key: e.key, otherOption: true });
      }
    });
    return ChoiceSArray;
  };

  deleteChildQuesOfCurrentQues = (id, conditionalHolderData, key) => {
    const childIndex = conditionalHolderData[key].findIndex((e) => e.parentQueId === id);
    if (childIndex > -1) {
      const nextChildId = conditionalHolderData[key][childIndex]?.id;
      conditionalHolderData[key].splice(childIndex, 1);
      this.deleteChildQuesOfCurrentQues(nextChildId, conditionalHolderData, key);
    }
  };

  handleSelectCustomQuestion = (event, attribute, key, index, attribKey, attributeLabel, isOtheroption) => {
    const { conditionalHolderData, holderData } = this.state || {};

    this.deleteChildQuesOfCurrentQues(attribute?.id, conditionalHolderData, key);

    const data = holderData?.nestedQuestions
      ?.filter((item) => item?.parentQueId === attribute?.id)
      .find((e) => e.selectedAnsId === attribKey);
    if (data) {
      data.value = null;
      data.otherOption = false;
      conditionalHolderData[key].push(data);
    }

    conditionalHolderData[key][index].value = event?.target?.value;
    conditionalHolderData[key][index].otherOption = attributeLabel === 'Other';
    if (isOtheroption && attribute?.mandatory && attributeLabel === 'Other') {
      conditionalHolderData[key][index].error = !event?.target?.value;
    } else if (attribute?.mandatory && attributeLabel !== 'Other') {
      conditionalHolderData[key][index].error = !event?.target?.value;
    }

    this.setState({
      conditionalHolderData,
    });
  };

  checkErrorOrNot = (key, errorEditOrder, index) => {
    let classes = '';
    if (errorEditOrder && errorEditOrder[key]) {
      if (errorEditOrder[key][index]) {
        classes = 'has-feedback';
        if (errorEditOrder[key][index].error) {
          classes = 'has-error';
        }
        if (errorEditOrder[key][index].value) {
          classes = 'has-success';
        }
      }
    }
    return classes;
  };

  isDefaultField = (fieldName) => {
    switch (fieldName) {
      case 'Organization':
      case 'Job Title':
      case 'Pronouns':
      case 'About Me':
      case 'Facebook':
      case 'Instagram':
      case 'LinkedIn':
      case 'Twitter':
        return true;
      default:
        return false;
    }
  };

  isValidField = (fieldName) => {
    let classes = '';
    const { attendee, firstNameFeedBack, firstName, lastName, lastNameFeedBack } = this.state;
    if (fieldName === 'First Name' && firstNameFeedBack && !firstName) {
      classes = 'has-error';
    }
    if (fieldName === 'Last Name' && lastNameFeedBack && !lastName) {
      classes = 'has-error';
    }
    if (attendee && attendee[fieldName] && attendee[fieldName].value && attendee[fieldName].value.trim() !== '') {
      classes = 'has-success';
    }
    return classes;
  };

  render() {
    const { isAddon, purchaserName, isHolder, t } = this.props;
    const {
      selectedOption,
      attendee,
      holderData,
      seating,
      firstName,
      firstNameFeedBack,
      displayFirstNameLength,
      lastName,
      lastNameFeedBack,
      displayLastNameLength,
      invalidDate,
      phoneNumberFeedBack,
      updatedNumber,
      shippingZipCode,
      shippingZipCodeMsg,
      billingZipCode,
      billingZipCodeMsg,
      email,
      emailFeedBack,
      checkConOccurance,
      isUnicodePresent,
      displayEmailLength,
      choices,
      isdisable,
      errorTicketHolder,
      fileSizeError,
      uploadedFileName,
      cameraError,
      conditionalHolderData,
      errorConditionalTicketHolder,
    } = this.state;
    if (!attendee) {
      return null;
    }

    const videoConstraints = {
      width: 1280,
      height: 720,
      facingMode: 'user',
    };

    if (
      attendee &&
      size(attendee['Country']?.value) &&
      attendee['Country']?.key === 'Country' &&
      attendee['Country'].value?.indexOf('|') > -1
    ) {
      const countryValue = attendee['Country'].value;
      if (countryValue.indexOf('|') > -1) {
        const countryState = countryValue.split('|');
        if (countryState[0]) {
          attendee['Country'].value = countryState[0];
        }
        if (countryState[1] && attendee['State'].key === 'State') {
          attendee['State'].value = countryState[1];
        }
      }
    }
    if (attendee && size(attendee['Country']?.value) > 2) {
      const findCountry = ContryList.find((countryObj) => countryObj.name === attendee['Country']?.value);
      if (findCountry) attendee['Country'].value = findCountry.code;
    }
    const phoneNumbarData =
      attendee['Cell Phone'] && attendee['Cell Phone'].value && attendee['Cell Phone'].value?.split('|');
    return (
      <div className={cx('edit-holder-wrap')}>
        {seating && !isAddon && <Script url="https://cdn.seatsio.net/chart.js" onLoad={this.handleScriptLoad} />}
        <div className=" gray-box card box-shadow-none">
          <div className="project-box-content">
            {holderData ? (
              <div className="h-auto m-t-16">
                {holderData.attributes
                  ? holderData.attributes.map((attrib, key) => (
                      <div className="holder-attribute" key={key}>
                        <div className="custom-attribute">
                          <div className={cx('p-t-b-5 mrg-t-md')}>
                            <div className="row">
                              {attrib.name !== 'Upload' ? (
                                <div className="col-md-12 ">
                                  <label className="text-right">
                                    {attrib.name}
                                    {attrib.mandatory && <span className="red">*</span>}
                                  </label>
                                </div>
                              ) : (
                                <></>
                              )}
                              <div className="col-md-12 "></div>
                              <div className="col-md-12 ">
                                <div
                                  className={cx(
                                    'p-t-b-5',
                                    errorTicketHolder &&
                                      errorTicketHolder[`${attrib.name}`] &&
                                      errorTicketHolder[`${attrib.name}`].key &&
                                      'has-feedback',
                                    errorTicketHolder &&
                                      errorTicketHolder[`${attrib.name}`] &&
                                      errorTicketHolder[`${attrib.name}`].error &&
                                      'has-error',
                                    errorTicketHolder &&
                                      errorTicketHolder[`${attrib.name}`] &&
                                      errorTicketHolder[`${attrib.name}`].value &&
                                      'has-success',
                                  )}
                                >
                                  {attrib.name === 'Cell Phone' ? (
                                    <AEIntlTelInput
                                      css={['intl-tel-input', 'form-control intl-tel']}
                                      utilsScript="./libphonenumber.js"
                                      separateDialCode
                                      fieldName={attrib.name}
                                      fieldId={attrib.name + key}
                                      isFeedBackShow={phoneNumberFeedBack}
                                      valid={!phoneNumberFeedBack}
                                      allowBlankValue={!attrib.mandatory}
                                      feedBackText={this.state.errorMsgPhoneNumber || 'Phone Number is Required'}
                                      defaultCountry={
                                        updatedNumber
                                          ? phoneNumbarData[1]
                                          : attrib.value
                                          ? attrib.value.indexOf('|') !== 2
                                            ? attrib.value.substring(attrib.value.indexOf('|') + 1).toString()
                                            : attrib.value.substring(0, attrib.value.indexOf('|')).toString()
                                          : ''
                                      }
                                      defaultValue={
                                        updatedNumber
                                          ? phoneNumbarData[0]
                                          : attrib.value
                                          ? attrib.value.indexOf('|') !== 2
                                            ? attrib.value.substring(0, attrib.value.indexOf('|')).toString() !== 'null'
                                              ? attrib.value.substring(0, attrib.value.indexOf('|')).toString()
                                              : ''
                                            : attrib.value.substring(attrib.value.indexOf('|') + 1).toString() !==
                                              'null'
                                            ? attrib.value.substring(attrib.value.indexOf('|') + 1).toString()
                                            : ''
                                          : (attendee && attendee[attrib.name]) ||
                                            (errorTicketHolder &&
                                              errorTicketHolder[attrib.name] &&
                                              errorTicketHolder[attrib.name].value)
                                      }
                                      onPhoneNumberBlur={(name, isValid, value, countryData, number, ext) => {
                                        // this.buyerPhoneNumberValidateHandler(name, isValid, value, countryData, number, ext, attrib, key,this);
                                        this.buyerPhoneNumberValidateHandler(
                                          name,
                                          isValid,
                                          value,
                                          countryData,
                                          number,
                                          ext,
                                          attrib,
                                          key,
                                          this,
                                        );
                                      }}
                                    />
                                  ) : attrib.type === 'SHIPPING_ADDRESS' ||
                                    attrib.type === 'BILLING_ADDRESS' ||
                                    attrib.type === 'COUNTRY' ||
                                    attrib.type === 'STATE' ? (
                                    <div className="text-left">
                                      <div className="address-field">
                                        {attrib.type !== 'COUNTRY' && attrib.type !== 'STATE' ? (
                                          <div>
                                            <div
                                              className={cx(
                                                'form-group',
                                                errorTicketHolder &&
                                                  errorTicketHolder[`${attrib.name} 1`] &&
                                                  (errorTicketHolder[`${attrib.name} 1`].key ||
                                                    errorTicketHolder[`${attrib.name} 1`].error) &&
                                                  'has-feedback',
                                                errorTicketHolder &&
                                                  errorTicketHolder[`${attrib.name} 1`] &&
                                                  errorTicketHolder[`${attrib.name} 1`].error &&
                                                  'has-error',
                                                errorTicketHolder &&
                                                  errorTicketHolder[`${attrib.name} 1`] &&
                                                  errorTicketHolder[`${attrib.name} 1`].value &&
                                                  'has-success',
                                              )}
                                            >
                                              <AEInputField
                                                data-attribute-type="text"
                                                type="text"
                                                placeHolder="Address 1"
                                                name={`${attrib.name} 1`}
                                                required={attrib.mandatory}
                                                defaultValue={
                                                  errorTicketHolder && errorTicketHolder[`${attrib.name} 1`]
                                                    ? errorTicketHolder[`${attrib.name} 1`].value
                                                    : attendee &&
                                                      attendee[`${attrib.name} 1`] &&
                                                      attendee[`${attrib.name} 1`].value
                                                }
                                                onChange={this.setAttendeesAddressValue.bind(
                                                  this,
                                                  attrib,
                                                  `${attrib.name} 1`,
                                                  key,
                                                )}
                                                size="normal"
                                                valid={
                                                  errorTicketHolder &&
                                                  errorTicketHolder[`${attrib.name} 1`] &&
                                                  errorTicketHolder[`${attrib.name} 1`].value
                                                }
                                                isFeedBackShow={
                                                  attrib.mandatory &&
                                                  !(
                                                    errorTicketHolder &&
                                                    errorTicketHolder[`${attrib.name} 1`] &&
                                                    errorTicketHolder[`${attrib.name} 1`].value
                                                  )
                                                }
                                              />
                                            </div>
                                            <div className={cx('mrg-b-xs form-group ')}>
                                              <div className="col-md-12 ">
                                                <label className="text-right">
                                                  {'Address 2'}
                                                  {attrib.mandatory && <span className="red">*</span>}
                                                </label>
                                              </div>
                                              <AEInputField
                                                data-attribute-type="text"
                                                type="text"
                                                placeHolder="Address 2"
                                                name={`${attrib.name} 2`}
                                                defaultValue={
                                                  errorTicketHolder && errorTicketHolder[`${attrib.name} 2`]
                                                    ? errorTicketHolder[`${attrib.name} 2`].value
                                                    : attendee &&
                                                      attendee[`${attrib.name} 2`] &&
                                                      attendee[`${attrib.name} 2`].value
                                                }
                                                onChange={this.setAttendeesAddressValue.bind(
                                                  this,
                                                  attrib,
                                                  `${attrib.name} 2`,
                                                  key,
                                                )}
                                                size="normal"
                                                valid={
                                                  errorTicketHolder &&
                                                  errorTicketHolder[`${attrib.name} 2`] &&
                                                  errorTicketHolder[`${attrib.name} 2`].value
                                                }
                                              />
                                            </div>
                                            <div
                                              className={cx(
                                                'mrg-b-xs form-group',
                                                errorTicketHolder &&
                                                  errorTicketHolder[`${attrib.name} Country`] &&
                                                  (errorTicketHolder[`${attrib.name} Country`].key ||
                                                    errorTicketHolder[`${attrib.name} Country`].error) &&
                                                  'has-feedback',
                                                errorTicketHolder &&
                                                  errorTicketHolder[`${attrib.name} Country`] &&
                                                  errorTicketHolder[`${attrib.name} Country`].error &&
                                                  'has-error',
                                                errorTicketHolder &&
                                                  errorTicketHolder[`${attrib.name} Country`] &&
                                                  errorTicketHolder[`${attrib.name} Country`].value &&
                                                  'has-success',
                                              )}
                                            >
                                              <div className="col-md-12 ">
                                                <label className="text-right">
                                                  {'Country'}
                                                  {attrib.mandatory && <span className="red">*</span>}
                                                </label>
                                              </div>
                                              <CountryDropdown
                                                value={
                                                  errorTicketHolder && errorTicketHolder[`${attrib.name} Country`]
                                                    ? errorTicketHolder[`${attrib.name} Country`].value
                                                    : attendee &&
                                                      attendee[`${attrib.name} Country`] &&
                                                      attendee[`${attrib.name} Country`].value
                                                }
                                                classes="country-state-dropdown"
                                                onChange={this.setAttendeesAddressValue.bind(
                                                  this,
                                                  attrib,
                                                  `${attrib.name} Country`,
                                                  key,
                                                )}
                                                valueType="short"
                                              />
                                            </div>
                                            <div>
                                              <div
                                                className={cx(
                                                  'mrg-b-xs form-group',
                                                  errorTicketHolder &&
                                                    errorTicketHolder[`${attrib.name} State`] &&
                                                    (errorTicketHolder[`${attrib.name} State`].key ||
                                                      errorTicketHolder[`${attrib.name} State`].error) &&
                                                    'has-feedback',
                                                  errorTicketHolder &&
                                                    errorTicketHolder[`${attrib.name} State`] &&
                                                    errorTicketHolder[`${attrib.name} State`].error &&
                                                    'has-error',
                                                  errorTicketHolder &&
                                                    errorTicketHolder[`${attrib.name} State`] &&
                                                    errorTicketHolder[`${attrib.name} State`].value &&
                                                    'has-success',
                                                )}
                                              >
                                                <div className="col-md-12 ">
                                                  <label className="text-right">
                                                    {'State'}
                                                    {attrib.mandatory && <span className="red">*</span>}
                                                  </label>
                                                </div>
                                                <RegionDropdown
                                                  country={
                                                    errorTicketHolder && errorTicketHolder[`${attrib.name} Country`]
                                                      ? errorTicketHolder[`${attrib.name} Country`].value
                                                      : attendee &&
                                                        attendee[`${attrib.name} Country`] &&
                                                        attendee[`${attrib.name} Country`].value
                                                  }
                                                  countryValueType="short"
                                                  value={
                                                    attendee &&
                                                    attendee[`${attrib.name} State`] &&
                                                    attendee[`${attrib.name} State`].value
                                                  }
                                                  classes="country-state-dropdown"
                                                  onChange={this.setAttendeesAddressValue.bind(
                                                    this,
                                                    attrib,
                                                    `${attrib.name} State`,
                                                    key,
                                                  )}
                                                />
                                              </div>
                                            </div>
                                            <div className={cx('mrg-b-xs form-group')}>
                                              <div className="col-md-12 ">
                                                <label className="text-right">
                                                  {'City'}
                                                  {attrib.mandatory && <span className="red">*</span>}
                                                </label>
                                              </div>
                                              <AEInputField
                                                data-attribute-type="text"
                                                type="text"
                                                placeholder="City"
                                                name={`${attrib.name} City`}
                                                defaultValue={
                                                  attendee &&
                                                  attendee[`${attrib.name} City`] &&
                                                  attendee[`${attrib.name} City`].value
                                                }
                                                required={attrib.mandatory}
                                                onChange={this.setAttendeesAddressValue.bind(
                                                  this,
                                                  attrib,
                                                  `${attrib.name} City`,
                                                  key,
                                                )}
                                                size="normal"
                                                valid={
                                                  errorTicketHolder &&
                                                  errorTicketHolder[`${attrib.name} City`] &&
                                                  errorTicketHolder[`${attrib.name} City`].value
                                                }
                                                isFeedBackShow={
                                                  attrib.mandatory &&
                                                  !(
                                                    errorTicketHolder &&
                                                    errorTicketHolder[`${attrib.name} City`] &&
                                                    errorTicketHolder[`${attrib.name} City`].value
                                                  )
                                                }
                                              />
                                            </div>
                                            <div className={cx('mrg-b-xs form-group', 'zipcode')}>
                                              <div className="col-md-12 ">
                                                <label className="text-right">
                                                  {'Postal Code'}
                                                  {attrib.mandatory && <span className="red">*</span>}
                                                </label>
                                              </div>

                                              <AEInputField
                                                type="text"
                                                placeHolder="Zip Code"
                                                name={`${attrib.name} Zip Code`}
                                                defaultValue={
                                                  attendee &&
                                                  attendee[`${attrib.name} Zip Code`] &&
                                                  attendee[`${attrib.name} Zip Code`].value
                                                }
                                                required={attrib.mandatory}
                                                onBlur={this.setAttendeesAddressValue.bind(
                                                  this,
                                                  attrib,
                                                  `${attrib.name} Zip Code`,
                                                  key,
                                                )}
                                                size="normal"
                                                valid={this.checkZipCodeValidation(attrib)}
                                                isFeedBackShow={this.showFeedbackForZipcode(attrib)}
                                                feedBackText={this.setFeedbackTextForZipCode(attrib)}
                                              />
                                            </div>
                                          </div>
                                        ) : (
                                          ''
                                        )}
                                        {attrib.type === 'COUNTRY' && (
                                          <div
                                            className={cx(
                                              'mrg-b-xs form-group',
                                              errorTicketHolder &&
                                                errorTicketHolder[attrib.name] &&
                                                (errorTicketHolder[attrib.name].key ||
                                                  errorTicketHolder[attrib.name].error) &&
                                                'has-feedback',
                                              errorTicketHolder &&
                                                errorTicketHolder[attrib.name] &&
                                                errorTicketHolder[attrib.name].error &&
                                                'has-error',
                                              errorTicketHolder &&
                                                errorTicketHolder[attrib.name] &&
                                                errorTicketHolder[attrib.name].value &&
                                                'has-success',
                                            )}
                                          >
                                            <CountryDropdown
                                              value={
                                                this.state.updateCountry
                                                  ? attendee && attendee[attrib.name] && attendee[attrib.name].value
                                                  : attendee && attendee[attrib.name] && attendee[attrib.name].value
                                              }
                                              classes="country-state-dropdown"
                                              onChange={this.setAttendeesAddressValue.bind(
                                                this,
                                                attrib,
                                                attrib.name,
                                                key,
                                              )}
                                              valueType="short"
                                            />
                                          </div>
                                        )}
                                        {attrib.type === 'STATE' && (
                                          <div
                                            className={cx(
                                              'mrg-b-xs form-group',
                                              errorTicketHolder &&
                                                errorTicketHolder[attrib.name] &&
                                                (errorTicketHolder[attrib.name].key ||
                                                  errorTicketHolder[attrib.name].error) &&
                                                'has-feedback',
                                              errorTicketHolder &&
                                                errorTicketHolder[attrib.name] &&
                                                errorTicketHolder[attrib.name].error &&
                                                'has-error',
                                              errorTicketHolder &&
                                                errorTicketHolder[attrib.name] &&
                                                errorTicketHolder[attrib.name].value &&
                                                'has-success',
                                            )}
                                          >
                                            <RegionDropdown
                                              country={
                                                this.state.updateCountry
                                                  ? attendee && attendee[`Country`] && attendee[`Country`].value
                                                  : attendee && attendee[`Country`] && attendee[`Country`].value
                                              }
                                              value={
                                                this.state.updateState
                                                  ? attendee && attendee[attrib.name] && attendee[attrib.name].value
                                                  : attendee && attendee[attrib.name] && attendee[attrib.name].value
                                              }
                                              classes="country-state-dropdown"
                                              onChange={this.setAttendeesAddressValue.bind(
                                                this,
                                                attrib,
                                                attrib.name,
                                                key,
                                              )}
                                              countryValueType="short"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : attrib.type === 'UPLOAD' ? (
                                    <div
                                      className={cx(
                                        'edit_ticket_file_upload',
                                        this.validateField(errorTicketHolder, attrib.name),
                                      )}
                                    >
                                      <div>
                                        <label className="text-right">
                                          {'Uploaded File'}
                                          {attrib.mandatory && <span className="red">*</span>}
                                        </label>
                                      </div>
                                      {fileSizeError && (
                                        <span className="red">{'Please upload file less than 5 MB of size.'}</span>
                                      )}
                                      <i className="icon-feedback-true ac-icon-check" />
                                      <i className="icon-feedback-true ac-icon-close" />
                                      <div>
                                        <AEInputField
                                          id="uploadFile"
                                          type="file"
                                          accept="*.*"
                                          className="display-none"
                                          onChange={(e) => {
                                            this.onChangeFileUpload(e, attrib);
                                          }}
                                          size="normal"
                                        />

                                        <div>
                                          <div className="col-sm-10">
                                            <AEInputField
                                              type="text"
                                              className="custom-file-input-field"
                                              placeholder={'No file chosen'}
                                              value={uploadedFileName || attrib.value}
                                              disabled
                                            />
                                          </div>
                                          <div className="col-sm-2">
                                            <AEButton
                                              className="m-r-0 pull-right custom-browse-btn m-0 p-1"
                                              variant="secondary"
                                              onClick={() => {
                                                document.getElementById('uploadFile').click();
                                              }}
                                              id="chooseFile"
                                              label={'Choose File'}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      {attrib.type !== 'dropdown' &&
                                      attrib.type !== 'date' &&
                                      attrib.type !== 'image' &&
                                      !/^About Me/i.test(attrib.name) &&
                                      attrib.type !== 'UPLOAD' &&
                                      attrib.type !== 'email' &&
                                      attrib.name !== 'First Name' &&
                                      attrib.type !== 'MULTIPLE_CHOICE' &&
                                      attrib.name !== 'Last Name' ? (
                                        <AEInputField
                                          type={
                                            attrib.name?.toLowerCase().includes('age') || attrib.type === 'number'
                                              ? 'number'
                                              : 'text'
                                          }
                                          placeholder={
                                            attrib.type === 'text' && !this.isDefaultField(attrib.name)
                                              ? 'Type your answer here'
                                              : attrib.name
                                          }
                                          name={attrib.name}
                                          required={attrib.mandatory}
                                          defaultValue={
                                            attendee && attendee[attrib.name] && attendee[attrib.name].value
                                          }
                                          maxLength={255}
                                          onBlur={this.setTicketHoldersValue.bind(this, attrib, key)}
                                          size="normal"
                                          valid={
                                            !this.state.invalidAge &&
                                            attendee &&
                                            attendee[attrib.name] &&
                                            attendee[attrib.name].value &&
                                            attendee[attrib.name].value.trim()
                                          }
                                          isFeedBackShow={
                                            this.state.invalidAge ||
                                            (attrib.mandatory &&
                                              !(
                                                attendee &&
                                                attendee[attrib.name] &&
                                                attendee[attrib.name].value &&
                                                attendee[attrib.name].value.trim()
                                              ))
                                          }
                                          feedBackText={this.state.invalidAge ? `The ${attrib.name} is invalid.` : ''}
                                        />
                                      ) : null}
                                      {attrib.name === 'First Name' && (
                                        <UserFirstName
                                          id="First Name"
                                          t={t}
                                          firstNameObj={attrib}
                                          firstNameFeedBack={firstNameFeedBack}
                                          displayFirstNameLength={displayFirstNameLength}
                                          getDefaultValue={() =>
                                            attendee && attendee[attrib.name] && attendee[attrib.name].value
                                          }
                                          onFieldChange={(fieldObj) =>
                                            this.setTicketHoldersValue.bind(this, fieldObj, key)
                                          }
                                          onFieldFocus={() => this.focusCharacterLength.bind(this, 'FN')}
                                          onFieldBlur={() => this.hideCharacterLength.bind(this, 'FN')}
                                          validateAttendeeField={(fieldName) => this.isValidField(fieldName)}
                                          getFeedBackText={() =>
                                            firstNameFeedBack && !firstName
                                              ? 'First name cannot be empty'
                                              : `${
                                                  firstName
                                                    ? firstName.length
                                                    : attendee &&
                                                      attendee['First Name'] &&
                                                      attendee['First Name']?.value?.length
                                                }/50`
                                          }
                                          labelClassName={'d-none'}
                                        />
                                      )}
                                      {attrib.name === 'Last Name' && (
                                        <UserLastName
                                          id="Last Name"
                                          t={t}
                                          lastNameObj={attrib}
                                          lastNameFeedBack={lastNameFeedBack}
                                          displayLastNameLength={displayLastNameLength}
                                          getDefaultValue={() =>
                                            attendee && attendee[attrib.name] && attendee[attrib.name].value
                                          }
                                          onFieldChange={(fieldObj) =>
                                            this.setTicketHoldersValue.bind(this, fieldObj, key)
                                          }
                                          onFieldFocus={() => this.focusCharacterLength.bind(this, 'LN')}
                                          onFieldBlur={() => this.hideCharacterLength.bind(this, 'LN')}
                                          validateAttendeeField={(fieldName) => this.isValidField(fieldName)}
                                          getFeedBackText={() =>
                                            lastNameFeedBack && !lastName
                                              ? 'Last name cannot be empty'
                                              : `${
                                                  lastName
                                                    ? lastName.length
                                                    : attendee &&
                                                      attendee['Last Name'] &&
                                                      attendee['Last Name']?.value?.length
                                                }/50`
                                          }
                                          labelClassName={'d-none'}
                                        />
                                      )}
                                      {attrib.type === 'email' ? (
                                        <UserEmail
                                          id="email"
                                          t={t}
                                          emailObj={attrib}
                                          getDefaultValue={() =>
                                            attendee && attendee[attrib.name] && attendee[attrib.name].value
                                          }
                                          onFieldChange={(fieldObj) =>
                                            this.setTicketHoldersValue.bind(this, fieldObj, key)
                                          }
                                          onFieldFocus={() => this.focusCharacterLength.bind(this, 'Email')}
                                          onFieldBlur={() => this.hideCharacterLength.bind(this, 'Email')}
                                          checkIsEmailValid={() =>
                                            this.validateField(ticketHolder, attrib.name) === 'has-success' &&
                                            this.validateEmail(email) &&
                                            !checkConOccurance &&
                                            !isUnicodePresent
                                          }
                                          isEmailFeedBackShow={() =>
                                            displayEmailLength ||
                                            this.validateField(ticketHolder, attrib.name) === 'has-error' ||
                                            !this.validateEmail(email) ||
                                            (this.validateField(ticketHolder, attrib.name) === 'has-success' &&
                                              emailFeedBack &&
                                              checkConOccurance) ||
                                            (emailFeedBack && isUnicodePresent)
                                          }
                                          getFeedBackText={() =>
                                            (checkConOccurance && `You typed ".con". Did you mean ".com"?`) ||
                                            (isUnicodePresent && `Unicode characters are not allowed`) ||
                                            (this.validateField(ticketHolder, attrib.name) === 'has-success' &&
                                            this.validateEmail(email) &&
                                            !checkConOccurance &&
                                            !isUnicodePresent
                                              ? `${
                                                  email
                                                    ? email.length
                                                    : attendee && attendee['Email'] && attendee['Email']?.value?.length
                                                }/75`
                                              : `The ${attrib.name} is invalid.`)
                                          }
                                          labelClassName={'d-none'}
                                        />
                                      ) : null}
                                      {attrib.type === 'date' ? (
                                        <>
                                          <AEDateTime
                                            inputProps={{
                                              placeholder: attrib.name,
                                              name: attrib.name,
                                              required: attrib.mandatory,
                                              id: `inputQue${key}`,
                                            }}
                                            timeFormat={false}
                                            isValidDate={(allDate) =>
                                              attrib.name?.toLowerCase().includes('birth')
                                                ? this.validateDateHandler(allDate)
                                                : true
                                            }
                                            onChange={this.handleHolderDate.bind(this, attrib, key)}
                                            closeOnSelect
                                            icon="ac-icon-calender"
                                            initialValue={
                                              (attendee && attendee[attrib.name] && attendee[attrib.name].value) ||
                                              new Date()
                                            }
                                          />
                                          {attrib.name?.toLowerCase().includes('birth') && invalidDate && (
                                            <span hasError className="text-danger has-error">
                                              {`The ${attrib.name} is invalid`}
                                            </span>
                                          )}
                                        </>
                                      ) : null}
                                      {/^About Me/i.test(attrib.name) && (
                                        <div className="col-md-12 col-xs-12 p-l-0 p-r-0">
                                          <div className="field-checkout-page">
                                            <AETextAreaField
                                              type={attrib.name}
                                              placeholder={attrib.name}
                                              name={attrib.name}
                                              required={attrib.mandatory}
                                              defaultValue={
                                                this.state.attendee &&
                                                this.state.attendee[attrib.name] &&
                                                this.state.attendee[attrib.name].value
                                              }
                                              id={`h-aboutme`}
                                              className={cx(
                                                this.validateField(ticketHolder, attrib.name) === 'has-error' &&
                                                  'error-input',
                                                'aboutme-textarea',
                                              )}
                                              onBlur={this.setTicketHoldersValue.bind(this, attrib, key)}
                                              aria-required={attrib.mandatory}
                                              size="normal"
                                              valid={this.validateField(ticketHolder, attrib.name) === 'has-success'}
                                              feedBackText={
                                                this.validateField(ticketHolder, attrib.name) === 'has-error' &&
                                                `The ${attrib.name} is invalid`
                                              }
                                            />
                                          </div>
                                        </div>
                                      )}
                                      {attrib.type === 'dropdown' && attrib.defaultValue ? (
                                        <select
                                          className="form-control"
                                          name={attrib.name}
                                          placeholder={attrib.name}
                                          onChange={this.setTicketHoldersValue.bind(this, attrib, key)}
                                          required={attrib.mandatory}
                                          defaultValue={
                                            attendee && attendee[attrib.name] && attendee[attrib.name].value
                                          }
                                        >
                                          <option value="">Please Select</option>
                                          {this.getSelectOptionJson(attrib.defaultValue).map((oitem) => (
                                            <option key={oitem[0]} value={oitem[0]}>
                                              {oitem[1]}
                                            </option>
                                          ))}
                                        </select>
                                      ) : null}
                                      {attrib.type === 'MULTIPLE_CHOICE' ? (
                                        <Col md={12} className="multiple-checkout-holder">
                                          <div
                                            className={cx(
                                              'field_container_feedback multiple-choice',
                                              this.validateField(ticketHolder, attrib.name),
                                            )}
                                          >
                                            <FormGroup>
                                              <AEDropDown
                                                className="btn-download"
                                                bsStyle="fullwidth"
                                                block
                                                multiple
                                                title={'Please select your answer(s)'}
                                              >
                                                <div>
                                                  <div className="ae-option-label">
                                                    <AECheckbox
                                                      inline
                                                      id="checkAll"
                                                      name="ticketTypes"
                                                      value="Check All"
                                                      onChange={(e) => this.toggleAllTicketsType(e, attrib)}
                                                      checked={this.state.isAllCheckBoxSelected[attrib?.name]}
                                                      message="Select All"
                                                    />
                                                  </div>
                                                  {this.getSelectOptionJson(attrib.defaultValue).map(
                                                    (itemData, index) => (
                                                      <div key={itemData} className="ae-option-label">
                                                        <AECheckbox
                                                          inline
                                                          id={`check-editholder-${removeSpecialCharacter(
                                                            itemData[0],
                                                          )}-${index}`}
                                                          name="multipleChoice"
                                                          onChange={this.setTicketHoldersValue.bind(this, attrib, key)}
                                                          checked={
                                                            choices &&
                                                            choices[attrib.name] &&
                                                            choices[attrib.name].indexOf(itemData[0]) > -1
                                                          }
                                                          message={itemData[0]}
                                                          value={itemData[0]}
                                                        />
                                                      </div>
                                                    ),
                                                  )}
                                                </div>
                                              </AEDropDown>
                                            </FormGroup>
                                            {attendee &&
                                              attendee[attrib.name] &&
                                              attendee &&
                                              attendee[attrib.name].error && (
                                                <small className="help-block">{`The Multiple Choice is invalid.`}</small>
                                              )}
                                          </div>
                                        </Col>
                                      ) : null}
                                      {attrib.type === 'image' ? (
                                        <div className="form-group">
                                          <div className="theme-col col-md-12 ">
                                            <div className="event-logo img-container">
                                              <AEImage
                                                className={cx(
                                                  'checkout-image-preview',
                                                  attendee && attendee[attrib.name] && attendee[attrib.name].value
                                                    ? 'height-250'
                                                    : 'height-100',
                                                )}
                                                alt="preview"
                                                src={`${IMAGE_URL}${
                                                  attendee && attendee[attrib.name] && attendee[attrib.name].value
                                                    ? `ticket_buyer_uploads/${attendee[attrib.name].value}`
                                                    : 'images/photo-camera.png'
                                                }`}
                                                nonCloudinaryImage
                                              />
                                              <a
                                                role="button"
                                                className={cx(
                                                  'change-image-text',
                                                  !(attendee && attendee[attrib.name] && attendee[attrib.name].value)
                                                    ? 'height-100'
                                                    : 'height-50-per',
                                                )}
                                              >
                                                <span
                                                  className="take-picture-ticketing-button"
                                                  onClick={() => this.showImagePopup(attrib, key, true)}
                                                >
                                                  <AEImage
                                                    alt="preview"
                                                    className="take-picture-ticketing"
                                                    src={`${CLOUDNARY_URL}/${IMAGE_URL}images/photo-camera.png`}
                                                    nonCloudinaryImage
                                                  />
                                                  {'Take Photo'}
                                                </span>
                                                <span
                                                  className="upload-image-ticketing-button"
                                                  onClick={() => this.showImagePopup(attrib, key, false)}
                                                >
                                                  {'Upload Image'}
                                                </span>
                                              </a>
                                            </div>
                                            {attendee &&
                                              attendee[attrib.name] &&
                                              attendee &&
                                              attendee[attrib.name].error && (
                                                <small className="help-block">{`The ${attrib.name} is invalid.`}</small>
                                              )}
                                          </div>
                                        </div>
                                      ) : null}
                                      {attrib.type === 'UPLOAD' ? (
                                        <div className="form-group">
                                          <div className="col-md-12 p-0">
                                            {attrib.value ? (
                                              <>
                                                <div className="col-md-10">
                                                  <AEInputField
                                                    className="custom-file-input-field"
                                                    type="text"
                                                    placeholder="Uploaded File"
                                                    name={attrib.name}
                                                    required={attrib.mandatory}
                                                    defaultValue={
                                                      attrib.value
                                                        ? attrib.value
                                                            .substring(
                                                              attrib.value.indexOf('|') + 1,
                                                              attrib.value.length,
                                                            )
                                                            .toString()
                                                        : ''
                                                    }
                                                    disabled
                                                  />
                                                </div>
                                                <div className="col-md-2">
                                                  <AEButton
                                                    className="m-r-0 pull-right custom-browse-btn"
                                                    onClick={() => this.downloadBuyerHolderFile(attrib.value)}
                                                    label="Download"
                                                  />
                                                </div>
                                              </>
                                            ) : (
                                              <label className="help-block">No Files Were Uploaded</label>
                                            )}
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  : null}
                <>
                  {conditionalHolderData &&
                    Object.keys(conditionalHolderData).map((key) => (
                      <div className="holder-attribute m-b-20 row" key={key}>
                        <div className="custom-attribute">
                          {conditionalHolderData[key].map((item, index) => (
                            <>
                              <div className="col-md-12 col-xs-12 m-t-10">
                                <label htmlFor="question-dropdown">
                                  {item?.name} {item.mandatory && <span className="red">*</span>}
                                </label>
                              </div>
                              <div key={index}>
                                {this.getSelectOptionForCustomAttribute(item.defaultValue).map((attribute) => (
                                  <>
                                    <div className="col-md-12 col-xs-12">
                                      <AERadioButton
                                        name={attribute?.key}
                                        value={attribute?.value}
                                        id={Math.random()}
                                        onChange={(event) =>
                                          this.handleSelectCustomQuestion(
                                            event,
                                            item,
                                            key,
                                            index,
                                            attribute?.key,
                                            attribute?.label,
                                            item.otherOption,
                                          )
                                        }
                                        checked={
                                          attribute?.otherOption
                                            ? item?.otherOption
                                            : attribute?.value?.trim() === item?.value?.trim()
                                        }
                                        label={attribute?.label}
                                      />
                                    </div>
                                  </>
                                ))}
                                {item?.otherOption && (
                                  <div className="col-md-12 col-xs-12 m-b-10" key={item?.id}>
                                    <AEInputField
                                      type="text"
                                      name={item?.name}
                                      onChange={(event) =>
                                        this.handleSelectCustomQuestion(
                                          event,
                                          item,
                                          key,
                                          index,
                                          '',
                                          'Other',
                                          item.otherOption,
                                        )
                                      }
                                      value={item?.value}
                                      id={item?.value}
                                      placeHolder={'Other'}
                                      size="normal"
                                    />
                                  </div>
                                )}
                                {this.checkErrorOrNot(key, errorConditionalTicketHolder, index) === 'has-error' && (
                                  <span className=" col-md-12 col-xs-12 textRed">{`${item?.name} is mandatory`}</span>
                                )}
                              </div>
                            </>
                          ))}
                        </div>
                      </div>
                    ))}
                </>

                <div className="holder-question">
                  <input type="hidden" name="tableId" defaultValue={0} />
                  {this.state.holderData.questions
                    ? this.state.holderData.questions.map((attrib, key) => (
                        <div className="holder-attribute" key={key}>
                          <div className="custom-attribute">
                            <div className={cx('form-group mrg-t-md')}>
                              <div className="row">
                                <div className="col-md-6 text-left">
                                  <div className={cx('form-group')}>
                                    <AEInputField
                                      type="text"
                                      placeHolder={attrib.name}
                                      name={attrib.name}
                                      required={attrib.mandatory}
                                      message={attrib.name}
                                      defaultValue={
                                        attrib.value ||
                                        (this.state.TicketHolderQuestions &&
                                          this.state.TicketHolderQuestions &&
                                          this.state.TicketHolderQuestions[attrib.name]) ||
                                        (this.state.errorQuestions &&
                                          this.state.errorQuestions &&
                                          this.state.errorQuestions[attrib.name] &&
                                          this.state.errorQuestions[attrib.name].value)
                                      }
                                      onChange={this.setQuestionsValue.bind(this, attrib, key)}
                                      size="normal"
                                      valid={
                                        this.state.errorQuestions &&
                                        this.state.errorQuestions &&
                                        this.state.errorQuestions[attrib.name] &&
                                        this.state.errorQuestions[attrib.name].value
                                      }
                                      isFeedBackShow={
                                        attrib.mandatory &&
                                        !(
                                          this.state.errorQuestions &&
                                          this.state.errorQuestions &&
                                          this.state.errorQuestions[attrib.name] &&
                                          this.state.errorQuestions[attrib.name].value
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    : null}
                </div>
                {this.state.seating && this.state.hasSeatsioScriptLoaded && this.props.isHolder && (
                  <div className={cx('row')}>
                    <div className="col-md-12">
                      {'Seat Number: '}
                      {this.state.oldSeatNumber}
                    </div>
                  </div>
                )}
                <hr />
              </div>
            ) : null}
            {this.state.showFormError && (
              <div className="row m-b-10">
                <div className="col-md-12">
                  <span className="text-danger">Please provide all information for fields marked as *</span>
                </div>
              </div>
            )}
            {this.state.seating && this.state.hasSeatsioScriptLoaded && this.props.isHolder && (
              <div className={cx('row')}>
                <div id="event-manager" />
                {this.SeatsioEventManager()}
              </div>
            )}
            <div className={cx('row', 'mrg-t-lg', 'mrg-b-lg')}>
              <div className={cx('col-md-12')}>
                {isEmpty(attendee) && size(conditionalHolderData && Object.keys(conditionalHolderData)) === 0 ? (
                  <AETooltip
                    tooltip="No information to update for ticket holder"
                    placement="top"
                    tooltipProps={{ id: 'update-attendeeData' }}
                  >
                    <div className="btn-prime btn-md bt-block text-center disable">Update</div>
                  </AETooltip>
                ) : (
                  <AEButton
                    block
                    onClick={() => setTimeout(() => this.updateHolderAttributes(), 1000)}
                    label="Update"
                    className="p-t-10"
                    disabled={
                      (attendee && attendee['First Name'] && !attendee['First Name'].value) ||
                      (attendee &&
                        attendee['First Name'] &&
                        attendee['First Name'].value &&
                        attendee['First Name'].value.trim() === '') ||
                      (attendee && attendee['Last Name'] && !attendee['Last Name'].value) ||
                      (attendee &&
                        attendee['Last Name'] &&
                        attendee['Last Name'].value &&
                        attendee['Last Name'].value.trim() === '') ||
                      isdisable
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <PopupModel
          id="popupDialog"
          showModal={this.state.showDialog && this.state.dialogMessage && this.state.dialogMessage.length > 0}
          headerText={<p>{this.state.dialogTitle}</p>}
          onCloseFunc={() => {
            this.toggleDialog();
            this.getHolderOrPurchaserDetails();
          }}
          modelFooter={
            <div>
              <AEButton
                className="preview-button"
                onClick={() => {
                  this.toggleDialog(), this.getHolderOrPurchaserDetails();
                }}
                label="Close"
                variant="danger"
              />
            </div>
          }
        >
          <div>{this.state.dialogMessage}</div>
        </PopupModel>
        <PopupModel
          id="popupConfirmation"
          showModal={this.state.showConfirmationDialog}
          headerText={<p>Error</p>}
          onCloseFunc={this.toggleConfirmationDialog}
          modelFooter={
            <div>
              <AEButton
                className="preview-button"
                onClick={() => {
                  this.toggleConfirmationDialog();
                }}
                label="Close"
                variant="danger"
              />
            </div>
          }
        >
          <div>Only one seat can be selected.</div>
        </PopupModel>
        <UploadImageModel
          showPopup={this.state.showImagePopup && !this.state.hasTakePhoto}
          popupHeader="Upload Image"
          imageUploaded={this.imageUploaded}
          hidePopup={this.hideImagePopup}
          imageDimensionsValidate
          isTicketing
        />
        <PopupModel
          id="takePhoto"
          showModal={this.state.showImagePopup && this.state.hasTakePhoto}
          onCloseFunc={this.hideImagePopup}
        >
          <>
            <div className={cx(cameraError && 'd-none')}>
              <Webcam
                audio={false}
                height={350}
                ref={this.setRef}
                screenshotFormat="image/jpeg"
                width="100%"
                onUserMediaError={(error) => error && this.setCameraError()}
                videoConstraints={videoConstraints}
              />

              <AEButton onClick={this.doTakePicture}>{'Capture photo'}</AEButton>
            </div>
            {cameraError && <p>{cameraError}</p>}
          </>
        </PopupModel>
      </div>
    );
  }

  validateField = (errorBuyer, item) => {
    let classes = '';
    if (errorBuyer) {
      if (errorBuyer[item]) {
        classes = 'has-feedback';
        if (errorBuyer[item].error) {
          classes = 'has-error';
        }
        if (errorBuyer[item].value) {
          classes = 'has-success';
        }
      }
    }
    return classes;
  };

  checkZipCodeValidation = (attrib) => {
    const { shippingZipCode, billingZipCode } = this.state;
    if (attrib.type === 'SHIPPING_ADDRESS') {
      return shippingZipCode;
    } else if (attrib.type === 'BILLING_ADDRESS') {
      return billingZipCode;
    }
    return true;
  };

  showFeedbackForZipcode = (attrib) => {
    const { errorTicketHolder } = this.state;
    const zipcodeValue =
      errorTicketHolder &&
      errorTicketHolder[`${attrib.name} Zip Code`] &&
      errorTicketHolder[`${attrib.name} Zip Code`]?.value.toString();
    const zipcodeValidation = this.checkZipCodeValidation(attrib);
    if (attrib.mandatory) {
      return zipcodeValidation && !isEmpty(zipcodeValue);
    } else {
      return zipcodeValidation;
    }
  };

  setFeedbackTextForZipCode = (attrib) => {
    const { billingZipCodeMsg, shippingZipCodeMsg } = this.state;
    if (attrib.type === 'SHIPPING_ADDRESS') {
      return shippingZipCodeMsg;
    } else if (attrib.type === 'BILLING_ADDRESS') {
      return billingZipCodeMsg;
    }
    return '';
  };

  setAttendeesAddressValue = (field, name, key, events, e = null) => {
    const object = ticketHolder || {};
    const { value } = e ? e.target : events.target;
    const event = e || events;
    if (name.search('Country') >= 0) {
      this.setState({ updateCountry: true });
    }
    if (name === 'Country' && object['State']) {
      object['State'].value = '';
      // object['Country State'].error = true;
    }
    if (name.search('State') >= 0) {
      this.setState({ updateState: true });
    }
    if (!object[name]) {
      object[name] = [];
    }
    object[name] = {
      key: name,
      value,
    };
    let isInvalidZipCode = false;
    if (field.name === 'Billing Address') {
      const zipCodeValue = object[`${field.name} Zip Code`]?.value.toString();
      const countryCode = object[`${field.name} Country`]?.value;
      if (!isEmpty(zipCodeValue) && zipCodeValue !== null && zipCodeValue !== 'null') {
        if (postalCodes.validate(countryCode, zipCodeValue) === true) {
          this.setState({
            billingZipCode: false,
            billingZipCodeMsg: '',
          });
        } else {
          isInvalidZipCode = true;
          this.setState({
            billingZipCode: true,
            billingZipCodeMsg: `The ${field.name} postal code is invalid.`,
          });
        }
      } else {
        this.setState({
          billingZipCode: false,
          billingZipCodeMsg: '',
        });
      }
    }

    if (field.name === 'Shipping Address') {
      const zipCodeValue = object[`${field.name} Zip Code`]?.value.toString();
      const countryCode = object[`${field.name} Country`]?.value;
      if (!isEmpty(zipCodeValue) && zipCodeValue !== null && zipCodeValue !== 'null') {
        if (postalCodes.validate(countryCode, zipCodeValue) === true) {
          this.setState({
            shippingZipCode: false,
            shippingZipCodeMsg: '',
          });
        } else {
          isInvalidZipCode = true;
          this.setState({
            shippingZipCode: true,
            shippingZipCodeMsg: `The ${field.name} postal code is invalid.`,
          });
        }
      } else {
        this.setState({
          shippingZipCode: false,
          shippingZipCodeMsg: '',
        });
      }
    }

    if (field.mandatory) {
      if (
        !event.target.value ||
        isEmpty(event.target.value) ||
        event.target.value === null ||
        event.target.value === 'null'
      ) {
        object[name].error = true;
        isInvalidZipCode = true;
        event.target.classList.add('has-error');
        event.target.classList.remove('has-success');
      } else {
        object[name].error = false;
      }
    }
    event.target.parentElement.classList.add('has-feedback');
    event.target.parentElement.classList.remove('has-error');
    event.target.classList.remove('has-error');
    event.target.classList.remove('error-input');

    if (isInvalidZipCode) {
      event.target.parentElement.classList.add('has-error');
      event.target.classList.add('error-input');
    }

    ticketHolder = object;
    this.setState({ errorTicketHolder: ticketHolder });
  };

  setQuestionsValue = (field, key, event) => {
    let object = TicketHolderQuestions || {};
    const { value } = event.target;
    if (!object) {
      object = [];
    }
    if (!object) {
      object = {};
    }
    if (!object[field.name]) {
      object[field.name] = {};
    }
    object[field.name] = {
      key: field.name,
      value,
    };
    if (field.mandatory) {
      if (!event.target.value) {
        object[field.name].error = true;
        event.target.parentElement.classList.add('has-error');
        event.target.parentElement.classList.remove('has-success');
        event.target.classList.add('has-error');
        event.target.classList.remove('has-success');
      } else {
        object[field.name].error = false;
      }
    }
    event.target.parentElement.classList.add('has-feedback');
    if (value && field && field.type === 'email') {
      object[field.name].error = !this.validateEmail(value);
      if (this.validateEmail(value)) {
        event.target.parentElement.classList.remove('has-error');
        event.target.parentElement.classList.add('has-success');
        event.target.classList.remove('has-error');
        event.target.classList.add('has-success');
      } else {
        event.target.parentElement.classList.add('has-error');
        event.target.parentElement.classList.remove('has-success');
        event.target.classList.add('has-error');
        event.target.classList.remove('has-success');
      }
    } else if (value && event.target.parentElement) {
      event.target.parentElement.classList.add('has-success');
      event.target.parentElement.classList.remove('has-error');
      event.target.classList.add('has-success');
      event.target.classList.remove('has-error');
    }
    TicketHolderQuestions = object;
  };

  setTicketHolderDefaultAttribes = (attributes) => {
    attributes.map((attrib, key) => {
      if (attrib.name && /^BILLING_ADDRESS/i.test(attrib.type)) {
        ticketHolder[`${attrib.name} 1`] = {
          key: `${attrib.name} 1`,
          value: this.getAddressValueString(attrib, 0),
        };
        ticketHolder[`${attrib.name} 2`] = {
          key: `${attrib.name} 2`,
          value: this.getAddressValueString(attrib, 1),
        };
        ticketHolder[`${attrib.name} City`] = {
          key: `${attrib.name} City`,
          value: this.getAddressValueString(attrib, 2),
        };
        ticketHolder[`${attrib.name} State`] = {
          key: `${attrib.name} State`,
          value: this.getAddressValueString(attrib, 3),
        };
        ticketHolder[`${attrib.name} Zip Code`] = {
          key: `${attrib.name} Zip Code`,
          value: this.getAddressValueString(attrib, 4),
        };
        ticketHolder[`${attrib.name} Country`] = {
          key: `${attrib.name} Country`,
          value: this.getAddressValueString(attrib, 5),
        };
      }
      if (attrib.name && /^SHIPPING_ADDRESS/i.test(attrib.type)) {
        ticketHolder[`${attrib.name} 1`] = {
          key: `${attrib.name} 1`,
          value: this.getAddressValueString(attrib, 0),
        };
        ticketHolder[`${attrib.name} 2`] = {
          key: `${attrib.name} 2`,
          value: this.getAddressValueString(attrib, 1),
        };
        ticketHolder[`${attrib.name} City`] = {
          key: `${attrib.name} City`,
          value: this.getAddressValueString(attrib, 2),
        };
        ticketHolder[`${attrib.name} State`] = {
          key: `${attrib.name} State`,
          value: this.getAddressValueString(attrib, 3),
        };
        ticketHolder[`${attrib.name} Zip Code`] = {
          key: `${attrib.name} Zip Code`,
          value: this.getAddressValueString(attrib, 4),
        };
        ticketHolder[`${attrib.name} Country`] = {
          key: `${attrib.name} Country`,
          value: this.getAddressValueString(attrib, 5),
        };
      }
      if (attrib.name && /^COUNTRY/i.test(attrib.type)) {
        ticketHolder[attrib.name] = {
          key: 'Country',
          value: attrib.value,
        };
      }
      if (attrib.name && /^STATE/i.test(attrib.type)) {
        ticketHolder[attrib.name] = {
          key: 'State',
          value: attrib.value,
        };
      }
      if (attrib.name && /^MULTIPLE_CHOICE/i.test(attrib.type)) {
        const { choices, checkData, isAllCheckBoxSelected } = this.state || {};
        if (!choices[attrib.name]) {
          choices[attrib.name] = [];
        }
        if (!checkData[attrib.name]) {
          checkData[attrib.name] = [];
        }
        if (!isAllCheckBoxSelected[attrib.name]) {
          isAllCheckBoxSelected[attrib.name] = [];
        }
        choices[attrib.name] = attrib.value && attrib.value.split('|');
        checkData[attrib.name] = attrib.value && attrib.value.split('|');
        const isAllSelected = this.selectedAll(this.getSelectOptionJson(attrib.defaultValue).length, attrib.name);
        isAllCheckBoxSelected[attrib.name] = isAllSelected;
        this.setState({ choices, checkData, isAllCheckBoxSelected });
      }
    });
    this.setState({ attendee: ticketHolder });
  };

  setTicketHoldersValue = (field, key, event) => {
    const object = ticketHolder || {};
    const { value } = event.target;

    if (!object[field.name]) {
      object[field.name] = {};
    }
    object[field.name] = {
      key: field.name,
      value,
      error: false,
    };
    if (field.type === 'MULTIPLE_CHOICE') {
      const { choices, checkData, isAllCheckBoxSelected } = this.state;
      if (!choices[field.name]) {
        choices[field.name] = [];
      }
      if (!checkData[field.name]) {
        checkData[field.name] = [];
      }

      let indexOfChoice = choices[field.name]?.indexOf(value);
      if (indexOfChoice > -1) {
        choices[field.name].splice(indexOfChoice, 1);
        checkData[field.name].splice(indexOfChoice, 1);
      } else {
        choices[field.name].push(value);
        checkData[field.name].push(value);
      }
      object[field.name] = {
        key: field.name,
        value: choices[field.name].join('|'),
      };
      const isAllSelected = this.selectedAll(this.getSelectOptionJson(field.defaultValue).length, field.name);
      isAllCheckBoxSelected[field.name] = isAllSelected;
      this.setState({ choices, checkData, isAllCheckBoxSelected });
    }
    if (field.name === 'First Name') {
      this.setState({ firstNameFeedBack: true });
      if (value && value.trim() === '') {
        this.setState({ firstName: false });
      } else {
        this.setState({ firstName: value });
      }
    }
    if (field.name === 'Last Name') {
      this.setState({ lastNameFeedBack: true });
      if (value && value.trim() === '') {
        this.setState({ lastName: false });
      } else {
        this.setState({ lastName: value });
      }
    }
    if (field.name === 'Email') {
      this.setState({
        emailFeedBack: true,
        email: value,
      });
      const checkConOccurance = checkEmailCon(value);
      const isUnicodePresent = validateUnicode(value);
      if (isUnicodePresent) object[fieldName].error = true;
      this.setState({
        email: value,
        emailFeedBack: checkConOccurance || isUnicodePresent,
        checkConOccurance,
        isUnicodePresent,
      });
    }
    if (field.mandatory) {
      if (!value || !value.trim()) {
        object[field.name].error = true;
        event.target.parentElement.classList.remove('has-success');
        event.target.parentElement.classList.add('error-input');
        event.target.classList.remove('has-success');
        event.target.classList.add('error-input');
      } else {
        object[field.name].error = false;
        event.target.parentElement.classList.add('has-success');
        event.target.parentElement.classList.remove('error-input');
        event.target.classList.add('has-success');
        event.target.classList.remove('error-input');
      }
    }
    event.target.parentElement.classList.add('has-feedback');
    event.target.classList.add('has-feedback');
    if (value && field && field.type === 'email') {
      object[field.name].error = !this.validateEmail(value);
      if (this.validateEmail(value)) {
        event.target.parentElement.classList.remove('has-error');
        event.target.parentElement.classList.add('has-success');
        event.target.classList.remove('has-error');
        event.target.classList.add('has-success');
      } else {
        event.target.parentElement.classList.add('has-error');
        event.target.parentElement.classList.remove('has-success');
        event.target.classList.add('has-error');
        event.target.classList.remove('has-success');
      }
    } else if (value && value.trim() && event.target.parentElement) {
      event.target.parentElement.classList.add('has-success');
      event.target.parentElement.classList.remove('has-error');
      event.target.classList.add('has-success');
      event.target.classList.remove('has-error');
    }
    if (/^age/i.test(field.name?.toLowerCase())) {
      if (isNaN(value) || (!isNaN(value) && value < 0) || value.includes('.')) {
        this.setState({ invalidAge: true });
        object[field.name].error = true;
      } else {
        this.setState({ invalidAge: false });
      }
    }
    ticketHolder = object;
  };

  focusCharacterLength = (name) => {
    if (name === 'FN') {
      this.setState({ displayFirstNameLength: true });
    } else if (name === 'LN') {
      this.setState({ displayLastNameLength: true });
    } else if (name === 'Email') {
      this.setState({ displayEmailLength: true });
    }
  };

  hideCharacterLength = (name) => {
    if (name === 'FN') {
      this.setState({ displayFirstNameLength: false });
    } else if (name === 'LN') {
      this.setState({ displayLastNameLength: false });
    } else if (name === 'Email') {
      this.setState({ displayEmailLength: false });
    }
  };

  showImagePopup = (imageDetail, key, takePhoto) => {
    this.setState({
      showImagePopup: true,
      imageDetail,
      imageDetailKey: key,
      hasTakePhoto: takePhoto || false,
    });
  };

  toggleConfirmationDialog = () => {
    this.setState({
      showConfirmationDialog: !this.state.showConfirmationDialog,
    });
  };

  toggleDialog = () => {
    this.setState({
      showDialog: !this.state.showDialog,
    });
  };

  updateHolderAttributes = () => {
    let fieldHasError = false;
    let conditionalFieldError = false;
    const { conditionalHolderData } = this.state || {};
    if (this.state.holderData) {
      if (this.state.holderData && this.state.holderData.attributes) {
        this.state.holderData.attributes.map((field) => {
          if (!ticketHolder) {
            ticketHolder = {};
          }

          if (!ticketHolder[field.name]) {
            ticketHolder[field.name] = {
              key: field.name,
              value: field.value,
            };
          }
          if (field.mandatory && field.name && /^COUNTRY/i.test(field.type)) {
            if (!ticketHolder[field.name]) {
              ticketHolder[field.name] = {};
            }
            ticketHolder[field.name] = {
              key: field.name,
              error: !ticketHolder[field.name].value,
              value: ticketHolder[field.name].value,
            };
            ticketHolder[`${field.name}`].error = ticketHolder[field.name].error;
          }
          if (field.mandatory && field.name && /^STATE/i.test(field.type)) {
            if (!ticketHolder[field.name]) {
              ticketHolder[field.name] = {};
            }
            ticketHolder[field.name] = {
              key: field.name,
              error: false,
              value: ticketHolder[field.name].value,
            };
            ticketHolder[`${field.name}`].error = ticketHolder[field.name].error;
          }
          if (field.mandatory && field.name && /^BILLING_ADDRESS/i.test(field.type)) {
            if (!ticketHolder[`${field.name} 1`]) {
              ticketHolder[`${field.name} 1`] = {};
            }
            if (!ticketHolder[`${field.name} 2`]) {
              ticketHolder[`${field.name} 2`] = {};
            }
            if (!ticketHolder[`${field.name} City`]) {
              ticketHolder[`${field.name} City`] = {};
            }
            if (!ticketHolder[`${field.name} State`]) {
              ticketHolder[`${field.name} State`] = {};
            }
            if (!ticketHolder[`${field.name} Zip Code`]) {
              ticketHolder[`${field.name} Zip Code`] = {};
            }
            if (!ticketHolder[`${field.name} Country`]) {
              ticketHolder[`${field.name} Country`] = {};
            }
            ticketHolder[`${field.name} 1`] = {
              key: `${field.name} 1`,
              error: !ticketHolder[`${field.name} 1`].value,
              value: ticketHolder[`${field.name} 1`].value,
            };
            ticketHolder[`${field.name} 2`] = {
              key: `${field.name} 2`,
              value: ticketHolder[`${field.name} 2`].value,
            };
            ticketHolder[`${field.name} City`] = {
              key: `${field.name} City`,
              error: !ticketHolder[`${field.name} City`].value,
              value: ticketHolder[`${field.name} City`].value,
            };
            ticketHolder[`${field.name} State`] = {
              key: `${field.name} State`,
              error: !ticketHolder[`${field.name} State`].value,
              value: ticketHolder[`${field.name} State`].value,
            };
            ticketHolder[`${field.name} Zip Code`] = {
              key: `${field.name} Zip Code`,
              error: !ticketHolder[`${field.name} Zip Code`].value,
              value: ticketHolder[`${field.name} Zip Code`].value,
            };
            ticketHolder[`${field.name} Country`] = {
              key: `${field.name} Country`,
              error: !ticketHolder[`${field.name} Country`].value,
              value: ticketHolder[`${field.name} Country`].value,
            };
            ticketHolder[`${field.name}`].error =
              ticketHolder[`${field.name} 1`].error &&
              ticketHolder[`${field.name} 2`].error &&
              ticketHolder[`${field.name} City`].error &&
              ticketHolder[`${field.name} State`].error &&
              ticketHolder[`${field.name} Zip Code`].error;
            ticketHolder[`${field.name} Country`].error;
          }
          if (field.mandatory && field.name && /^SHIPPING_ADDRESS/i.test(field.type)) {
            if (!ticketHolder[`${field.name} 1`]) {
              ticketHolder[`${field.name} 1`] = {};
            }
            if (!ticketHolder[`${field.name} 2`]) {
              ticketHolder[`${field.name} 2`] = {};
            }
            if (!ticketHolder[`${field.name} City`]) {
              ticketHolder[`${field.name} City`] = {};
            }
            if (!ticketHolder[`${field.name} State`]) {
              ticketHolder[`${field.name} State`] = {};
            }
            if (!ticketHolder[`${field.name} Zip Code`]) {
              ticketHolder[`${field.name} Zip Code`] = {};
            }
            if (!ticketHolder[`${field.name} Country`]) {
              ticketHolder[`${field.name} Country`] = {};
            }
            ticketHolder[`${field.name} 1`] = {
              key: `${field.name} 1`,
              error: !ticketHolder[`${field.name} 1`].value,
              value: ticketHolder[`${field.name} 1`].value,
            };
            ticketHolder[`${field.name} 2`] = {
              key: `${field.name} 2`,
              value: ticketHolder[`${field.name} 2`].value,
            };
            ticketHolder[`${field.name} City`] = {
              key: `${field.name} City`,
              error: !ticketHolder[`${field.name} City`].value,
              value: ticketHolder[`${field.name} City`].value,
            };
            ticketHolder[`${field.name} State`] = {
              key: `${field.name} State`,
              error: !ticketHolder[`${field.name} State`].value,
              value: ticketHolder[`${field.name} State`].value,
            };
            ticketHolder[`${field.name} Zip Code`] = {
              key: `${field.name} Zip Code`,
              error: !ticketHolder[`${field.name} Zip Code`].value,
              value: ticketHolder[`${field.name} Zip Code`].value,
            };
            ticketHolder[`${field.name} Country`] = {
              key: `${field.name} Country`,
              error: !ticketHolder[`${field.name} Country`].value,
              value: ticketHolder[`${field.name} Country`].value,
            };
            ticketHolder[`${field.name}`].error =
              ticketHolder[`${field.name} 1`].error &&
              ticketHolder[`${field.name} 2`].error &&
              ticketHolder[`${field.name} City`].error &&
              ticketHolder[`${field.name} State`].error &&
              ticketHolder[`${field.name} Zip Code`].error;
            ticketHolder[`${field.name} Country`].error;
          } else if (!(field.name && /BILLING_ADDRESS/i.test(field.type))) {
            ticketHolder[field.name].error = field.mandatory ? !ticketHolder[field.name].value : false;
          }
          if (field.mandatory && field.name && /Cell Phone/i.test(field.name)) {
            const num = ticketHolder[`${field.name}`].value
              ? ticketHolder[`${field.name}`].value.indexOf('|') !== 2
                ? ticketHolder[`${field.name}`].value
                    .substring(0, ticketHolder[`${field.name}`].value.indexOf('|'))
                    .toString()
                : ticketHolder[`${field.name}`].value
                    .substring(ticketHolder[`${field.name}`].value.indexOf('|') + 1)
                    .toString()
              : '';
            if (!num || num === '0') {
              ticketHolder[`${field.name}`] = {
                key: `${field.name}`,
                error: true,
              };
              field.value = field.value.substring(0, field.value.indexOf('|') + 1);
            }
          }
        });
        if (conditionalHolderData && size(Object.keys(conditionalHolderData)) > 0) {
          Object.keys(conditionalHolderData).map((key) => {
            conditionalHolderData[key].map((item, index) => {
              if (!conditionalHolderData[key]) {
                conditionalHolderData[key] = [];
              }
              if (item?.mandatory) {
                conditionalHolderData[key][index].error = !conditionalHolderData[key][index].value;
              }
            });
          });
          this.setState({
            conditionalHolderData,
          });
        }
        for (let item in ticketHolder) {
          if (ticketHolder[item] && ticketHolder[item].error) {
            fieldHasError = true;
          }
        }
        if (conditionalHolderData) {
          Object.keys(conditionalHolderData).map((key) => {
            conditionalHolderData[key].map((item, index) => {
              if (conditionalHolderData[key][index].error) {
                conditionalFieldError = true;
              }
            });
          });
        }
      }

      if (this.state.holderData.questions && TicketHolderQuestions) {
        this.state.holderData.questions.map((field) => {
          if (!TicketHolderQuestions) {
            TicketHolderQuestions = {};
          }
          if (!TicketHolderQuestions[field.name]) {
            TicketHolderQuestions[field.name] = {};
          }
          if (field.mandatory && !TicketHolderQuestions[field.name].value) {
            TicketHolderQuestions[field.name].error = true;
          }
        });
      }
      this.setState({
        errorTicketHolder: ticketHolder,
        errorConditionalTicketHolder: conditionalHolderData,
        attendee: ticketHolder,
      });
      setTimeout(() => {
        const isValidData =
          document.getElementsByClassName('has-error').length === 0 &&
          document.getElementsByClassName('error-input').length === 0;
        if (isValidData && !fieldHasError && !conditionalFieldError) {
          this.setState({ showFormError: false });
          const holder = [];
          const holderQuestions = [];
          if (ticketHolder) {
            let a1 = '';
            let a2 = '';
            let a3 = '';
            let a4 = '';
            let a5 = '';
            let a6 = '';
            let sa1 = '';
            let sa2 = '';
            let sa3 = '';
            let sa4 = '';
            let sa5 = '';
            let sa6 = '';
            let c1 = '';
            let s1 = '';
            const keys = _.keys(ticketHolder);
            const holderDataCtry = this.state.holderData && this.state.holderData.attributes;
            const isTextCountry =
              holderDataCtry &&
              holderDataCtry.find((newItem) => newItem.name === 'Country' && newItem.type === 'COUNTRY');
            const isStateField =
              holderDataCtry && holderDataCtry.find((newItem) => newItem.name === 'State' && newItem.type === 'STATE');
            keys.map((keyItem) => {
              if (ticketHolder[keyItem].key) {
                if (ticketHolder[keyItem].key == 'Cell Phone') {
                  const countryCode = ticketHolder[keyItem].value
                    ? ticketHolder[keyItem].value.indexOf('|') !== 2
                      ? ticketHolder[keyItem].value.substring(ticketHolder[keyItem].value.indexOf('|') + 1).toString()
                      : ticketHolder[keyItem].value.substring(0, ticketHolder[keyItem].value.indexOf('|')).toString()
                    : '';
                  holder.push({
                    key: 'countryCode',
                    value: countryCode === 'null' ? null : countryCode,
                  });
                  const phoneNumber = ticketHolder[keyItem].value
                    ? ticketHolder[keyItem].value.indexOf('|') !== 2
                      ? ticketHolder[keyItem].value.substring(0, ticketHolder[keyItem].value.indexOf('|')).toString()
                      : ticketHolder[keyItem].value.substring(ticketHolder[keyItem].value.indexOf('|') + 1).toString()
                    : '';
                  holder.push({
                    key: 'phoneNumber',
                    value: phoneNumber === 'null' ? null : phoneNumber === '' ? 0 : phoneNumber,
                  });
                  if (phoneNumber && countryCode && !this.props.isHolder) {
                    holder.push({
                      key: 'Cell Phone',
                      value: `${phoneNumber}|${countryCode}`,
                    });
                  }
                  if (phoneNumber === undefined || phoneNumber === 'null' || phoneNumber === '' || phoneNumber === 0) {
                    const phoneNumberIndex = holder.findIndex((holderObj) => holderObj.key === 'phoneNumber');
                    if (phoneNumberIndex > -1) {
                      delete holder.splice(phoneNumberIndex, 1);
                      holder.push({
                        key: 'phoneNumber',
                        value: '',
                      });
                    }
                    const cellPhoneIndex = holder.findIndex((holderObj) => holderObj.key === 'Cell Phone');
                    if (cellPhoneIndex > -1) {
                      delete holder.splice(cellPhoneIndex, 1);
                      holder.push({
                        key: 'Cell Phone',
                        value: '',
                      });
                    }
                    const countryCodeIndex = holder.findIndex((holderObj) => holderObj.key === 'countryCode');
                    if (countryCodeIndex > -1) {
                      delete holder.splice(countryCodeIndex, 1);
                      holder.push({
                        key: 'countryCode',
                        value: '',
                      });
                    }
                  }
                } else if (ticketHolder[keyItem].key === 'Country') {
                  c1 = ticketHolder[keyItem].value;
                } else if (ticketHolder[keyItem].key === 'State') {
                  s1 = ticketHolder[keyItem].value;
                } else {
                  if (ticketHolder[keyItem].key === 'Billing Address 1') {
                    a1 = this.getAddressValueString(ticketHolder[keyItem].value);
                  }
                  if (ticketHolder[keyItem].key === 'Billing Address 2') {
                    a2 = this.getAddressValueString(ticketHolder[keyItem].value);
                  }
                  if (ticketHolder[keyItem].key === 'Billing Address City') {
                    a3 = this.getAddressValueString(ticketHolder[keyItem].value);
                  }
                  if (ticketHolder[keyItem].key === 'Billing Address State') {
                    a4 = this.getAddressValueString(ticketHolder[keyItem].value);
                  }
                  if (ticketHolder[keyItem].key === 'Billing Address Zip Code') {
                    a5 = this.getAddressValueString(ticketHolder[keyItem].value);
                  }
                  if (ticketHolder[keyItem].key === 'Billing Address Country') {
                    a6 = this.getAddressValueString(ticketHolder[keyItem].value);
                  }
                  if (ticketHolder[keyItem].key === 'Billing Address') {
                    delete ticketHolder[keyItem].key;
                  }
                  if (ticketHolder[keyItem].key === 'Shipping Address 1') {
                    sa1 = this.getAddressValueString(ticketHolder[keyItem].value);
                  }
                  if (ticketHolder[keyItem].key === 'Shipping Address 2') {
                    sa2 = this.getAddressValueString(ticketHolder[keyItem].value);
                  }
                  if (ticketHolder[keyItem].key === 'Shipping Address City') {
                    sa3 = this.getAddressValueString(ticketHolder[keyItem].value);
                  }
                  if (ticketHolder[keyItem].key === 'Shipping Address State') {
                    sa4 = this.getAddressValueString(ticketHolder[keyItem].value);
                  }
                  if (ticketHolder[keyItem].key === 'Shipping Address Zip Code') {
                    sa5 = this.getAddressValueString(ticketHolder[keyItem].value);
                  }
                  if (ticketHolder[keyItem].key === 'Shipping Address Country') {
                    sa6 = this.getAddressValueString(ticketHolder[keyItem].value);
                  }
                  if (ticketHolder[keyItem].key === 'Shipping Address') {
                    delete ticketHolder[keyItem].key;
                  } else if (ticketHolder[keyItem].key) {
                    holder.push({
                      key: ticketHolder[keyItem].key,
                      value: ticketHolder[keyItem].value,
                    });
                  }
                }
              }
            });
            if (keys.indexOf('Billing Address') > -1) {
              holder.push({
                key: 'Billing Address',
                value: `${a1}|${a2}|${a3}|${a4}|${a5}|${a6}`,
              });
            }
            if (keys.indexOf('Shipping Address') > -1) {
              holder.push({
                key: 'Shipping Address',
                value: `${sa1}|${sa2}|${sa3}|${sa4}|${sa5}|${sa6}`,
              });
            }
            if (keys.indexOf('Country') > -1 && isTextCountry) {
              holder.push({
                key: 'Country',
                value: c1,
              });
            }
            if (keys.indexOf('State') > -1 && isStateField) {
              holder.push({
                key: 'State',
                value: s1,
              });
            }
          }
          if (TicketHolderQuestions) {
            const keys = _.keys(TicketHolderQuestions);
            keys.map((keyItem) => {
              if (TicketHolderQuestions[keyItem].key) {
                holderQuestions.push({
                  key: TicketHolderQuestions[keyItem].key,
                  value: TicketHolderQuestions[keyItem].value,
                });
              }
            });
          }
          holder.forEach((holderObj) => {
            if (holderObj.value === null || holderObj.value === 'null') {
              holderObj.value = '';
            }
          });

          const { holderData } = this.state;
          const { isAddon } = this.props;
          const nestedQue = [];

          if (conditionalHolderData) {
            Object.keys(conditionalHolderData).map((key) => {
              conditionalHolderData[key].map((item) => {
                nestedQue.push(item);
              });
            });
          }

          const nestedQueData = nestedQue?.filter((e) => e.value !== '' && e.value !== null);

          holderData.attributes = holder;
          holderData.questions = holderQuestions;
          holderData.nestedQuestions = nestedQueData;
          if (this.props.isHolder) {
            this.props
              .doUpdateTicketHolderDetails(this.props.ticketId, holderData)
              .then((resp) => {
                if (resp.errorMessage) {
                  this.props.actionResult('update', 'danger', resp.errorMessage);
                } else {
                  this.props.actionResult('update', 'success', resp.message || 'Updated successfully...');
                  this.props.updatedData(this.props.isHolder);
                }
                this.hideEditPopup();
              })
              .catch((error) => {
                const orderRefundError = error && error.response && error.response.data;
                this.setState({
                  dialogTitle: 'Error',
                  dialogMessage:
                    (orderRefundError && orderRefundError.errorMessage) || 'Oops something went wrong, Try again later',
                });
                setTimeout(() => {
                  this.toggleDialog();
                }, 10);
              });
          } else {
            this.props
              .doUpdateTicketBuyerDetails(this.props.orderId, holderData)
              .then((resp) => {
                if (resp.errorMessage) {
                  this.props.actionResult('update', 'danger', resp.errorMessage);
                } else {
                  this.props.actionResult('update', 'success', resp.message || 'Updated successfully...');
                  this.props.updatedData(this.props.isHolder);
                }
                this.hideEditPopup();
              })
              .catch((error) => {
                const orderRefundError = error && error.response && error.response.data;
                this.setState({
                  dialogTitle: 'Error',
                  dialogMessage:
                    (orderRefundError && orderRefundError.errorMessage) || 'Oops something went wrong, Try again later',
                });
                setTimeout(() => {
                  this.toggleDialog();
                }, 10);
              });
          }
        } else {
          this.setState({
            showFormError: true,
          });
        }
      }, 100);
    }
    this.setState({
      email: '',
      emailFeedBack: false,
      displayEmailLength: false,
      shippingZipCode: false,
      shippingZipCodeMsg: '',
      billingZipCode: false,
      billingZipCodeMsg: '',
      isdisable: false,
    });
  };

  validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return email === '' ? true : re.test(email) && checkEmailTld(email);
  };
}

const mapDispatchToProps = {
  doGetTicketHolderDetails: (ticketId) => doGetTicketHolderDetails(ticketId),
  doUpdateTicketHolderDetails: (ticketId, data) => doUpdateTicketHolderDetails(ticketId, data),
  doGetTicketBuyerDetails: (orderId) => doGetTicketBuyerDetails(orderId),
  doUpdateTicketBuyerDetails: (orderId, data) => doUpdateTicketBuyerDetails(orderId, data),
  doValidateMobileNumber,
  uploadFileForTicketing,
  uploadImage: (file, isTicketing) => uploadImage(file, isTicketing),
};
const mapStateToProps = (state) => ({
  authenticated: state.session.authenticated,
  countryCode: (state.host && state.host.eventDetails && state.host.eventDetails.countryCode) || 'US',
});
export default connect(mapStateToProps, mapDispatchToProps)(withTranslation(['common'])(EditTicketHolder));
