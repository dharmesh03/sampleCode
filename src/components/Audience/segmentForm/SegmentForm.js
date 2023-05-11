import cx from 'classnames';
import { addDays, addMonths, endOfMonth, endOfWeek, isEqual, startOfMonth, startOfWeek } from 'date-fns';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import size from 'lodash/size';
import moment from 'moment';
import React from 'react';
import { Col, DropdownButton, MenuItem, Overlay, Row } from 'react-bootstrap';
import { createStaticRanges, DateRangePicker } from 'react-date-range';
import * as locales from 'react-date-range/dist/locale';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import AEBadge from '../../../Core/Badge/Badge';
import AEButton from '../../../Core/Button/Button';
import AEIcon from '../../../Core/Icon';
import AEInputField from '../../../Core/Input';
import AELabel from '../../../Core/Label/label';
import AESearchbox from '../../../Core/SearchBox/Search';
import AESelect from '../../../Core/Select/Select';
import AESlidePopup from '../../../Core/SlidePopup/index';
import svgIcon from '../../../Core/svgIcon';
import AETooltip from '../../../Core/Tooltip';
import {
  getSuggestionByFilterTypeAndFieldAndValue,
  getSuggestionByFilterTypeAndFieldAndValueAndWhiteLabelURL,
} from '../action';
import './_segment_form.scss';

class SegmentForm extends React.Component {
  dateFormat = 'MM-DD-YYYY';

  filtersFromMasterJson = [];

  allFieldsForSearch = [];

  isDateSelectedBefore = false;

  initialDate = {
    startDate: null,
    endDate: new Date(''),
    key: 'selection',
  };

  statusEnum = {
    INITIAL: 'INITIAL',
    CREATED: 'CREATED',
    SELECTED: 'SELECTED',
    SAVED: 'SAVED',
    EDITED: 'EDITED',
  };

  initialQuery = {
    status: this.statusEnum.INITIAL,
  };

  iconMap = {
    firstName: { svgIcon: 'firstNameIcon', viewBox: '' },
    lastName: { svgIcon: 'lastNameIcon', viewBox: '' },
    title: { svgIcon: 'titleIcon', viewBox: '' },
    bio: { svgIcon: 'bioIcon', viewBox: '' },
    company: { svgIcon: 'companyIcon', viewBox: '' },
    email: { svgIcon: 'emailIcon', viewBox: '' },
    phone: { svgIcon: 'phoneIcon', viewBox: '' },
    purchaser: { svgIcon: 'virtual-icon-user-o', viewBox: '0 0 24 24', passTo: 'AEIcon' },
    ticketHolder: { svgIcon: 'ticketIcon' },
    status: { svgIcon: 'statusIcon' },
    orderTotalAmount: { svgIcon: 'orderTotalAmountIcon' },
    checkOutFrom: { svgIcon: 'checkoutIcon' },
    tickettypename: { svgIcon: 'ticketIcon' },
    nooftickets: { svgIcon: 'ticketIcon' },
    ticketprice: { svgIcon: 'priceIcon' },
    eventName: { svgIcon: 'fa fa-calendar-check-o', isNormalIcon: true },
    discountCode: { svgIcon: 'discountIcon' },
    profile: { svgIcon: 'virtual-icon-user-o', viewBox: '0 0 24 24', passTo: 'AEIcon' },
    register: { svgIcon: 'ac-icon-new-user', viewBox: '0 0 512 512', isNormalIcon: true },
    engagement: { svgIcon: 'engagement-icon', viewBox: '0 0 24 24' },
    joinedsession: { svgIcon: 'fa fa-calendar-check-o', isNormalIcon: true },
    bookmarksession: { svgIcon: 'bookmarkedSessionIcon', viewBox: '' },
    likepost: { svgIcon: 'glyphicon glyphicon-heart text-white-shadow-dark', isNormalIcon: true },
    comment: { svgIcon: 'commentIcon', viewBox: '' },
    feed: { svgIcon: 'activityStreamIcon', viewBox: '' },
  };

  constructor(props) {
    super(props);
    this.state = {
      showDatePicker: false,
      selectedDateRange: [this.initialDate],
      searchBoxValue: '',
      rangeDate: 'Any Time',
      filter: {
        date: [this.initialDate],
        conditionalOperator: this.filterOptions()[0].value,
        conditions: [{ ...this.initialQuery }],
      },
      showInputBoxForPopupTitle: false,
      updatedName: '',
      tempUpdatedName: '',
      isValidUpdatedName: true,
      isNameAlreadyTaken: false,
      showLengthForName: false,
    };
  }

  componentDidMount() {
    const { filterMasterJson, savedSegment, isEditing, isEditBeforeCreate } = this.props;
    const filtersFromMasterJson = get(filterMasterJson, 'filters');
    const operatorsFromMasterJson = get(filterMasterJson, 'operator');
    if (filtersFromMasterJson && typeof filtersFromMasterJson === 'object' && !Array.isArray(filtersFromMasterJson)) {
      const allFields = [];
      for (const [key, object] of Object.entries(filtersFromMasterJson)) {
        const allFieldsComplex = object.columns.map((column) =>
          column.values.map((value) => ({
            label: value.label,
            name: value.name,
            filterKey: key,
            filterName: object.label,
          })),
        );
        const allFieldsFlatten = allFieldsComplex.flat();
        const filter = {
          key,
          label: object.label,
          fields: allFieldsFlatten,
        };
        this.filtersFromMasterJson.push(filter);
        allFields.push(allFieldsFlatten);
      }
      this.allFieldsForSearch = allFields.flat();
    }
    if (isEditing || isEditBeforeCreate) {
      const savedFilter = JSON.parse(get(savedSegment, 'data.filterJson'));
      const name = get(savedSegment, 'data.name');
      if (savedFilter) {
        this.setState({ updatedName: name, tempUpdatedName: name });
        const filter = savedFilter;
        const { date } = filter || {};
        let initialDate;
        let rangeDate;
        if (date && date.startDate && date.endDate) {
          initialDate = [
            {
              startDate: new Date(date.startDate),
              endDate: new Date(date.endDate),
              key: 'selection',
            },
          ];
          rangeDate = `${moment(date.startDate).format(this.dateFormat)}  >  ${moment(date.endDate).format(
            this.dateFormat,
          )}`;
        }
        if (filter.conditions && Array.isArray(filter.conditions)) {
          filter.conditions = filter.conditions.map((condition, index) => {
            const { type } = condition || {};
            if (type === 'group') {
              return this.setFilterConditionDataForGroup(
                condition,
                filtersFromMasterJson,
                operatorsFromMasterJson,
                `${index}_`,
              );
            }
            return this.setFilterConditionData(condition, filtersFromMasterJson, operatorsFromMasterJson);
          });
        }
        this.setState({
          filter: { ...filter, conditions: [...filter.conditions, this.initialQuery] },
          ...(initialDate && { selectedDateRange: initialDate }),
          ...(rangeDate && { rangeDate }),
        });
      }
    }
  }

  setFilterConditionDataForGroup = (filter, filtersFromMasterJson, operatorsFromMasterJson, indexOfParent) => {
    filter.conditions = filter.conditions.map((condition, index) => {
      const { type } = condition || {};
      if (type === 'group') {
        const prentIndexForNestedGroup = indexOfParent ? `${indexOfParent}${index}_` : `${index}_`;
        return this.setFilterConditionDataForGroup(
          condition,
          filtersFromMasterJson,
          operatorsFromMasterJson,
          prentIndexForNestedGroup,
        );
      }
      return this.setFilterConditionData(condition, filtersFromMasterJson, operatorsFromMasterJson);
    });
    return { ...filter, parentIndex: indexOfParent, conditions: [...filter.conditions, this.initialQuery] };
  };

  setFilterConditionData = (condition, filtersFromMasterJson, operatorsFromMasterJson) => {
    const { condition: conditionObj } = condition || {};
    if (conditionObj) {
      const {
        isInstance,
        columnName,
        instanceName,
        attribute,
        mappingKey,
        mappingDataType,
        dataType,
        mappedValue,
        columnValue,
      } = conditionObj || {};
      const status = this.statusEnum.SAVED;
      const filterData = filtersFromMasterJson[condition.filterName];
      const fields = filterData.columns.flatMap((column) => column.values);
      let columnData;
      let instance;
      let attributeFields;
      if (mappingKey && mappingDataType) {
        conditionObj.columnName = mappingKey;
        conditionObj.dataType = mappingDataType;
        conditionObj.mappingKey = columnName;
        conditionObj.mappingDataType = dataType;
        conditionObj.mappedValue = columnValue;
        conditionObj.columnValue = mappedValue;
      }
      if (isInstance) {
        const tempColumnName = conditionObj.columnName;
        instance = fields.find((field) => field.name === instanceName);
        const instanceFields = filterData.instance[instance && instance.instanceColumns];
        columnData = instanceFields && instanceFields.find((field) => field.name === tempColumnName);
        condition.instanceFields = instanceFields;
        condition.instance = instance;
        conditionObj.columnName = instanceName;
        conditionObj.instanceFieldName = tempColumnName;
        attributeFields = instance.attribute;
      } else {
        columnData = fields.find((field) => field.name === conditionObj.columnName);
        attributeFields = columnData.attribute;
      }
      const columnOperators = columnData && operatorsFromMasterJson[columnData.operator];
      conditionObj.operator = conditionObj.operator && conditionObj.operator.toLowerCase();
      condition.status = status;
      condition.filterData = filterData;
      condition.columnData = columnData;
      condition.columnOperators = columnOperators;
      if (size(attributeFields) > 0) {
        const attributes = JSON.parse(
          JSON.stringify(attributeFields.map((attr) => fields.find((field) => field.name === attr))),
        );
        condition.attributes = attributes;
        if (size(attribute) > 0) {
          const updatedAttribute = attribute.map((attr) => {
            let instanceForAttr;
            const {
              isInstance: isInstanceForAttr,
              columnName: columnNameForAttr,
              instanceName: instanceNameForAttr,
              mappedValue: mappedValueForAttr,
              mappingKey: mappingKeyForAttr,
              mappingDataType: mappingDataTypeForAttr,
              columnValue: columnValueForAttr,
              dataType: dataTypeForAttr,
            } = attr || {};
            if (mappingKeyForAttr && mappingDataTypeForAttr) {
              attr.columnName = mappingKeyForAttr;
              attr.mappingKey = columnNameForAttr;
              attr.dataType = mappingDataTypeForAttr;
              attr.mappingDataType = dataTypeForAttr;
              attr.columnValue = mappedValueForAttr;
              attr.mappedValue = columnValueForAttr;
            }
            let columnDataForAttr;
            if (isInstanceForAttr) {
              instanceForAttr = fields.find((field) => field.name === instanceNameForAttr);
              const instanceFields = filterData.instance[instanceForAttr && instanceForAttr.instanceColumns];
              columnDataForAttr = instanceFields && instanceFields.find((field) => field.name === attr.columnName);
              attr.instanceFields = instanceFields;
              attr.instance = instanceForAttr;
              attr.columnName = instanceNameForAttr;
              attr.instanceFieldName = columnNameForAttr;
            } else {
              columnDataForAttr = fields.find((field) => field.name === attr.columnName);
            }
            attr.columnData = columnDataForAttr;
            attr.columnOperators = columnDataForAttr && operatorsFromMasterJson[columnDataForAttr.operator];
            attr.operator = attr.operator && attr.operator.toLowerCase();
            return attr;
          });
          conditionObj.attribute = updatedAttribute;

          condition.attributes = attributes.map((attr) => {
            const selectedAttribute = updatedAttribute.find((updatedAttr) => updatedAttr.columnName === attr.name);
            if (selectedAttribute) {
              attr.isSelected = true;
            }
            return attr;
          });
        }
      }
      condition.condition = conditionObj;
    }
    return condition;
  };

  filterOptions = () => {
    const { t } = this.props;
    return [
      { label: t('audience:All Filters'), value: 'all' },
      { label: t('audience:Any Filters'), value: 'any' },
    ];
  };

  defaultStaticRanges = createStaticRanges([
    {
      label: this.props.t('audience:Any Time'),
      range: () => ({
        startDate: new Date(null),
        endDate: new Date(null),
      }),
      isSelected() {
        return false;
      },
    },
    {
      label: this.props.t('audience:Last Week'),
      range: () => ({
        startDate: startOfWeek(addDays(new Date(), -7)),
        endDate: endOfWeek(addDays(new Date(), -7)),
      }),
      isSelected() {
        return false;
      },
    },
    {
      label: this.props.t('audience:Last Month'),
      range: () => ({
        startDate: startOfMonth(addMonths(new Date(), -1)),
        endDate: endOfMonth(addMonths(new Date(), -1)),
      }),
      isSelected() {
        return false;
      },
    },
  ]);

  handleClickOnEditIcon = () => {
    this.setState({ showInputBoxForPopupTitle: true });
  };

  getIndexArrayFromParentIndex = (parentIndex) => {
    const parentArray = parentIndex.split('_');
    return parentArray.filter((el) => !isNaN(parseFloat(el)) && isFinite(el));
  };

  handleChangeFilterType = (filterType, rowIndex, parentIndex) => {
    this.setState((state) => {
      const { filter } = state;
      const { conditions } = filter;
      if (!isNaN(rowIndex)) {
        return {
          ...state,
          filter: {
            ...filter,
            conditions: [
              ...conditions.map((condition, index) => {
                if (parentIndex) {
                  const parentIndexArray = this.getIndexArrayFromParentIndex(parentIndex);
                  if (parseInt(parentIndexArray[0], 10) === index) {
                    return this.handleChangeNestedFilterType(condition, index, parentIndex, filterType, 0);
                  }
                  return condition;
                }
                if (index === rowIndex) {
                  return { ...condition, conditionalOperator: filterType };
                }
                return condition;
              }),
            ],
          },
        };
      }
      return { ...state, filter: { ...filter, conditionalOperator: filterType } };
    });
  };

  handleChangeNestedFilterType = (filter, rowIndex, parentIndex, filterType, arrayIndex) => {
    ++arrayIndex;
    const { conditions } = filter || {};
    if (!conditions) {
      return filter;
    }
    if (filter.parentIndex === parentIndex) {
      return { ...filter, conditionalOperator: filterType };
    }
    return {
      ...filter,
      conditions: [
        ...conditions.map((condition, index) => {
          if (parentIndex) {
            const parentIndexArray = this.getIndexArrayFromParentIndex(parentIndex);
            if (parentIndexArray && parentIndexArray.length > 1) {
              if (parseInt(parentIndexArray[arrayIndex], 10) === index) {
                return this.handleChangeNestedFilterType(condition, index, parentIndex, filterType, arrayIndex);
              }
              return condition;
            }
            return condition;
          }
          if (index === rowIndex) {
            return { ...condition, conditionalOperator: filterType };
          }
          return condition;
        }),
      ],
    };
  };

  handleDateChange = (dateRange) => {
    const { selection } = dateRange || {};
    const { startDate, endDate } = selection;
    this.setState({ selectedDateRange: [dateRange.selection] });
    if (isEqual(startDate, endDate) && isEqual(startDate, new Date(null))) {
      this.isDateSelectedBefore = false;
      this.setState({ showDatePicker: false, selectedDateRange: [this.initialDate] }, () => this.getDateRange());
    } else if (!this.isDateSelectedBefore && isEqual(startDate, endDate)) {
      this.isDateSelectedBefore = true;
    } else {
      this.isDateSelectedBefore = false;
      this.setState({ showDatePicker: false }, () => this.getDateRange());
    }
  };

  getDateRange() {
    const { selectedDateRange } = this.state;
    const { startDate, endDate } = size(selectedDateRange) > 0 && selectedDateRange[0];
    const startDateFormatted = moment(startDate);
    const endDateFormatted = moment(endDate);
    if (startDateFormatted.isValid() && endDateFormatted.isValid()) {
      this.setState({
        rangeDate: `${startDateFormatted.format(this.dateFormat)}  >  ${endDateFormatted.format(this.dateFormat)}`,
      });
    } else {
      this.setState({ rangeDate: 'Any Time' });
    }
  }

  handleFocusOnSegmentName = () => {
    this.setState({ showLengthForName: true });
  };

  handleBlurOnSegmentName = () => {
    this.setState({ showLengthForName: false });
  };

  renderTitleLabel = (label) => <AELabel header={label} variant="heading4" labelClass="mb-0 overflow-txt-ellipsis" />;

  renderTitleOfPopup = () => {
    const { isEditing, t } = this.props;
    const {
      showInputBoxForPopupTitle,
      updatedName,
      isValidUpdatedName,
      isNameAlreadyTaken,
      showLengthForName,
    } = this.state;

    return (
      <div className="p-l-r-10">
        <div className="d-flex">
          {showInputBoxForPopupTitle ? (
            <>
              <div className="flex-column flex-fill input-name">
                <AEInputField
                  placeHolder={t('audience:Enter a name')}
                  value={updatedName}
                  onChange={(e) => this.handleOnNameChange(e.target.value)}
                  onBlur={this.handleBlurOnSegmentName}
                  onFocus={this.handleFocusOnSegmentName}
                  valid={isValidUpdatedName && !isNameAlreadyTaken}
                  feedBackText={
                    isValidUpdatedName && !isNameAlreadyTaken
                      ? `${updatedName.length}/255`
                      : isNameAlreadyTaken
                      ? t('audience:Segment name has been already taken')
                      : !updatedName
                      ? t('audience:Segment name required')
                      : t('audience:Remove leading & trailing white space')
                  }
                  isFeedBackShow={!isValidUpdatedName || isNameAlreadyTaken || showLengthForName}
                  isCounter
                  maxLength="255"
                />
              </div>
              <div className="flex-column pt-1 mr-2 mt-2">
                <AEIcon
                  type="ac-icon-check"
                  className="ml-3 prime-icon cursor"
                  size="small"
                  onClick={this.handleClickOnSaveUpdatedName}
                />
                <AEIcon
                  type="ac-icon-close"
                  className="ml-3 cursor"
                  size="small"
                  onClick={this.handleClickOnCancelUpdatedName}
                />
              </div>
            </>
          ) : isEditing ? (
            <AETooltip tooltip={updatedName} overlayProps={{ placement: 'left' }}>
              {this.renderTitleLabel(updatedName)}
            </AETooltip>
          ) : (
            this.renderTitleLabel(t('audience:Create Segment'))
          )}
          {isEditing && !showInputBoxForPopupTitle && (
            <AEIcon
              type="ac-icon-edit"
              className="ml-3 mt-2 cursor"
              size="exsmall"
              onClick={this.handleClickOnEditIcon}
            />
          )}
        </div>

        <AELabel
          color=""
          variant="caption3"
          labelClass="mb-0 muted-label"
          header={t('audience:All Filters will show the items that match every selected filter')}
        />
        <AELabel
          color=""
          variant="caption3"
          labelClass="mb-0 muted-label"
          header={t('audience:Any Filters will show the items that match one or more of the selected filters')}
        />
      </div>
    );
  };

  handleOnNameChange = (value) => {
    this.setState({ updatedName: value, isValidUpdatedName: true, isNameAlreadyTaken: false });
  };

  handleClickOnSaveUpdatedName = () => {
    const leadingAndTrailingWhiteSpaceRegex = /^\S$|^\S[\s\S]*\S$/;
    const { savedSegment } = this.props;
    const savedName = get(savedSegment, 'data.name');
    const { updatedName } = this.state;
    const isValidUpdatedName = leadingAndTrailingWhiteSpaceRegex.test(updatedName);
    let isNameAlreadyTaken = this.props.isNameAlreadyTaken(updatedName);
    if (savedName && updatedName && savedName.toLowerCase() === updatedName.toLowerCase()) {
      isNameAlreadyTaken = false;
    }
    if (!isValidUpdatedName || isNameAlreadyTaken) {
      this.setState({ isValidUpdatedName, isNameAlreadyTaken });
      return;
    }
    this.setState({ showInputBoxForPopupTitle: false, tempUpdatedName: updatedName });
  };

  handleClickOnCancelUpdatedName = () =>
    this.setState({
      updatedName: this.state.tempUpdatedName,
      showInputBoxForPopupTitle: false,
      isNameAlreadyTaken: false,
      isValidUpdatedName: true,
    });

  getVerticalLine = () => <div className="vertical-line" />;

  getLabelBasedOnConditionalOperator = (conditionalOperator) => {
    const { t, i18n } = this.props;
    return (
      <>
        {this.getVerticalLine()}
        <span className={cx(i18n?.language === 'es' ? 'operator-align' : 'operator-align-vertical')}>
          {conditionalOperator === 'any' ? t('audience:OR') : t('audience:AND')}
        </span>
      </>
    );
  };

  renderGroupQueryCard = (filter, index) => {
    const { parentIndex } = filter || {};
    const { t } = this.props;
    return (
      <>
        {this.getVerticalLine()}
        <div className="p-2 border-div-box m-t-5">
          <Row className="m-0 p-0 field-select p-b-10">
            <Col sm={2} className="match-text-align">
              {t('audience:Match')}
            </Col>
            <Col sm={8}>{this.renderGroupFilter(filter, index)}</Col>
            <Col sm={2}>{this.deleteGroupFilter(parentIndex)}</Col>
          </Row>
          <Row className="m-0 p-0">{this.renderQueryCard(filter)}</Row>
        </div>
      </>
    );
  };

  renderVerticalLineWithAddButton = (index, parentIndex) => {
    const { t } = this.props;
    return (
      <Row className="pl-3">
        {this.getVerticalLine()}
        <AEButton
          className="small button-to-text add-close-btn"
          variant="secondary"
          isPrevIcon
          icon="ac-icon-plus-round add-new-ticket-btn"
          label={t('audience:Add Filter')}
          onClick={() => this.handleOnAddFilter(index, parentIndex)}
        />
      </Row>
    );
  };

  handleOnAddFilter = (index, parentIndex, isShow = true) => {
    this.setState((state) => {
      const { filter } = state;
      const { conditions } = filter || {};
      return {
        ...state,
        filter: {
          ...filter,
          conditions: [
            ...conditions.map((condition, i) => {
              if (parentIndex) {
                const parentIndexArray = this.getIndexArrayFromParentIndex(parentIndex);
                if (parseInt(parentIndexArray[0], 10) === i) {
                  parentIndexArray.shift();
                  const updatedParentIndexArray = parentIndexArray.filter(
                    (el) => !isNaN(parseFloat(el)) && isFinite(el),
                  );
                  let updatedParentPathIndex;
                  if (updatedParentIndexArray.length > 0) {
                    updatedParentPathIndex = this.joinArrayByUnderScore(updatedParentIndexArray);
                  }
                  return this.handleOnNestedAddFilter(index, condition, isShow, updatedParentPathIndex);
                }
                return condition;
              }
              if (i === index) {
                return { ...condition, status: !isShow ? this.statusEnum.INITIAL : this.statusEnum.CREATED };
              }
              return condition;
            }),
          ],
        },
      };
    });
  };

  joinArrayByUnderScore = (array) => {
    const length = array.length;
    let str = '';
    for (let i = 0; i < length; i++) {
      str += `${array[i]}_`;
    }
    return str;
  };

  handleOnNestedAddFilter = (indexToSet, filter, isShow = true, parentIndex) => {
    const { conditions } = filter || {};

    if (!parentIndex) {
      return {
        ...filter,
        conditions: [
          ...conditions.map((condition, index) => {
            if (indexToSet === index) {
              return { ...condition, status: !isShow ? this.statusEnum.INITIAL : this.statusEnum.CREATED };
            }
            return condition;
          }),
        ],
      };
    }

    return {
      ...filter,
      conditions: [
        ...conditions.map((condition, index) => {
          if (parentIndex) {
            const parentIndexArray = this.getIndexArrayFromParentIndex(parentIndex);
            if (parseInt(parentIndexArray[0], 10) === index) {
              parentIndexArray.shift();
              const updatedParentIndexArray = parentIndexArray.filter((el) => !isNaN(parseFloat(el)) && isFinite(el));
              let updatedParentPathIndex;
              if (updatedParentIndexArray.length > 0) {
                updatedParentPathIndex = this.joinArrayByUnderScore(updatedParentIndexArray);
              }
              return this.handleOnNestedAddFilter(indexToSet, condition, isShow, updatedParentPathIndex);
            }
            return condition;
          }
          return condition;
        }),
      ],
    };
  };

  handleChangeOnSearchBox = (value) => this.setState({ searchBoxValue: value });

  handleSelectOnFilterType = (selectedFilter, index, indexOfParent) => {
    const { filterMasterJson } = this.props;
    const filters = get(filterMasterJson, 'filters');
    const operators = get(filterMasterJson, 'operator');
    const { field, filterKey } = selectedFilter;
    const filterData = filters[filterKey];
    const fields = filterData.columns.flatMap((column) => column.values);
    let defaultField;
    let instanceFields;
    const data = {};
    let columnData;
    if (field) {
      defaultField = fields.find((value) => value.name === field);
    } else {
      defaultField = fields[0];
    }
    const fieldAttributes = defaultField.attribute;
    if (fieldAttributes && Array.isArray(fieldAttributes)) {
      data.attributes = JSON.parse(
        JSON.stringify(fieldAttributes.map((attr) => fields.find((field) => field.name === attr))),
      );
    }
    if (defaultField && defaultField.fieldType === 'instance') {
      const instanceFromFilterData = filterData.instance;
      instanceFields = instanceFromFilterData[defaultField.instanceColumns];
      columnData = instanceFields && instanceFields[0];
      data.condition = {
        isInstance: true,
        instanceFieldName: columnData && columnData.name,
      };
      data.instanceFields = instanceFields;
      data.instance = defaultField;
    } else {
      columnData = defaultField;
      data.condition = {
        isInstance: false,
      };
    }

    const { operator, type, dataType, enumValue } = columnData || {};
    let value = '';
    if (operator === 'enum' && type === 'dropdown') {
      value = enumValue && enumValue[0];
    } else if (type === 'numeric') {
      value = 0;
    }

    data.condition.columnName = field || defaultField.name;
    data.columnData = columnData;
    data.condition.columnValue = value;
    data.condition.operator = operators[operator][0];
    data.condition.dataType = dataType;
    data.columnOperators = operators[operator];
    data.status = this.statusEnum.SELECTED;
    data.filterData = filterData;
    data.filterName = filterKey;

    this.setState((state) => {
      const { filter } = state;
      const { conditions } = filter;
      const updatedConditions = conditions.map((condition, i) => {
        if (indexOfParent) {
          const parentIndexArray = this.getIndexArrayFromParentIndex(indexOfParent);
          if (parseInt(parentIndexArray[0], 10) === i) {
            parentIndexArray.shift();
            const updatedParentIndexArray = parentIndexArray.filter((el) => !isNaN(parseFloat(el)) && isFinite(el));
            let updatedParentPathIndex;
            if (updatedParentIndexArray.length > 0) {
              updatedParentPathIndex = this.joinArrayByUnderScore(updatedParentIndexArray);
            }
            return this.handleNestedSelectOnFilterType(condition, index, updatedParentPathIndex, data);
          }
          return condition;
        }
        if (i === index) {
          return {
            ...condition,
            type: 'single',
            ...data,
          };
        }
        return condition;
      });
      if (!indexOfParent && size(updatedConditions) > 0) {
        updatedConditions.push(this.initialQuery);
      }
      return {
        ...state,
        searchBoxValue: '',
        filter: {
          ...filter,
          conditions: [...updatedConditions],
        },
      };
    });
  };

  handleNestedSelectOnFilterType = (filter, indexToSet, parentIndex, filterData) => {
    const { conditions } = filter || {};

    if (!parentIndex) {
      return {
        ...filter,
        conditions: [
          ...conditions.map((condition, index) => {
            if (indexToSet === index) {
              return {
                ...condition,
                type: 'single',
                ...filterData,
              };
            }
            return condition;
          }),
          { ...this.initialQuery },
        ],
      };
    }
    return {
      ...filter,
      conditions: [
        ...conditions.map((condition, index) => {
          if (parentIndex) {
            const parentIndexArray = this.getIndexArrayFromParentIndex(parentIndex);
            if (parseInt(parentIndexArray[0], 10) === index) {
              parentIndexArray.shift();
              const updatedParentIndexArray = parentIndexArray.filter((el) => !isNaN(parseFloat(el)) && isFinite(el));
              let updatedParentPathIndex;
              if (updatedParentIndexArray.length > 0) {
                updatedParentPathIndex = this.joinArrayByUnderScore(updatedParentIndexArray);
              }
              return this.handleNestedSelectOnFilterType(condition, indexToSet, updatedParentPathIndex, filterData);
            }
            return condition;
          }
          return condition;
        }),
      ],
    };
  };

  renderFilterSearchInputBox = (rowIndex, parentIndex) => {
    const { searchBoxValue } = this.state;
    const { t } = this.props;
    let isSearchValueFound;
    const trimmedSearchValue = searchBoxValue && searchBoxValue.trim();
    if (trimmedSearchValue) {
      isSearchValueFound = this.allFieldsForSearch.some((field) => {
        const { label } = field;
        const translatedLabel = t(`attendeeDetails:${label}`);
        const pos = translatedLabel && translatedLabel.toLowerCase().indexOf(trimmedSearchValue.toLowerCase());
        if (pos >= 0) {
          return true;
        }
        return false;
      });
    }

    return (
      <>
        {this.getVerticalLine()}
        <span onClick={() => this.handleOnAddFilter(rowIndex, parentIndex, false)} className="filter-cancel cursor">
          <span className="close-item-icon mr-2">
            <AEIcon type="ac-icon-close" size="exSmall" id="cancel_btn_filter" />
          </span>
          {t('common:Cancel')}
        </span>
        <div className="p-2 border-div-box search-box">
          <AESearchbox
            type="text"
            id="search_box_filter"
            onChange={this.handleChangeOnSearchBox}
            autoFocus
            showClearIcon
            value={searchBoxValue}
            placeholder={t('common:Search')}
            aria-label="Search here for attendees"
          />
          <ul key={`suggestion-box_${rowIndex}`}>
            {!trimmedSearchValue ? (
              this.filtersFromMasterJson.map((filter, index) => {
                const { key, fields, label } = filter || {};
                const firstThreeFields = fields
                  .slice(0, 3)
                  .map((field) => t(`attendeeDetails:${field.label}`))
                  .join(', ');
                const icon = this.iconMap[key];
                return (
                  <li className="mt-2" key={`without-search_${index}`}>
                    <div
                      className="d-flex"
                      onClick={() => this.handleSelectOnFilterType({ filterKey: key }, rowIndex, parentIndex)}
                    >
                      <AEIcon svgIcon={icon && icon.svgIcon} viewBox={icon && icon.viewBox} color="#6D6F7D" />
                      <AELabel
                        id="search_selectable_aud"
                        header={t(`audience:${label}`)}
                        variant="captions1"
                        className="mr-auto pr-3 filter-name-label"
                        labelClass="no-white-space-wrap"
                      />
                      <AELabel
                        labelClass="overflow-txt-ellipsis"
                        className="hover-visible-label"
                        variant="captions1"
                        header={`${firstThreeFields}, ${t('common: etc.')}`}
                      />
                    </div>
                  </li>
                );
              })
            ) : isSearchValueFound ? (
              this.allFieldsForSearch.map((field, index) => {
                const { label } = field;
                const translatedLabel = t(`attendeeDetails:${label}`);
                const pos = translatedLabel && translatedLabel.toLowerCase().indexOf(trimmedSearchValue.toLowerCase());
                if (pos >= 0) {
                  const updatedFieldLabel = [
                    translatedLabel.substring(0, pos),
                    <strong key={index}>{translatedLabel.substring(pos, pos + trimmedSearchValue.length)}</strong>,
                    translatedLabel.substring(pos + trimmedSearchValue.length),
                  ];
                  const icon = this.iconMap[field.filterKey];
                  return (
                    <li className="mt-2" key={`search_${index}`}>
                      <div
                        className="d-flex flex-row align-items-center"
                        onClick={() =>
                          this.handleSelectOnFilterType(
                            { filterKey: field.filterKey, field: field.name },
                            rowIndex,
                            parentIndex,
                          )
                        }
                      >
                        <AEIcon svgIcon={icon && icon.svgIcon} viewBox={icon && icon.viewBox} color="#6D6F7D" />
                        <AELabel
                          header={t(`audience:${field.filterName}`)}
                          variant="captions1"
                          labelClass="mb-0"
                          className="filter-name-label"
                        />
                        <AELabel
                          header={`>`}
                          variant="captions1"
                          className="mx-3 filter-name-label"
                          labelClass="mb-0"
                        />
                        {this.renderSvgIcon(field.name)}
                        <AELabel variant="captions1" header={updatedFieldLabel} className="ml-2" labelClass="mb-0" />
                      </div>
                    </li>
                  );
                }
                return <></>;
              })
            ) : (
              <div className="mt-3 text-center"> {t('toasterMsg:No options found')}</div>
            )}
          </ul>
        </div>
      </>
    );
  };

  renderGroupFilter = (filter, index) => {
    const { conditionalOperator, parentIndex } = filter || {};
    const { t } = this.props;
    const nodataText = t('No options');
    return (
      <AESelect
        onChange={(e) => this.handleChangeFilterType(e.value, index, parentIndex)}
        nodataText={nodataText}
        value={conditionalOperator}
        options={this.filterOptions()}
      />
    );
  };

  deleteGroupFilter = (parentIndex) => {
    const { t } = this.props;
    return (
      <div className="query-view-button m-r-5 p-t-15">
        <AETooltip tooltip={t('audience:Delete Group')} overlayProps={{ placement: 'top' }}>
          <AEIcon
            type="ac-icon-bin"
            size="exSmall"
            onClick={(e) => this.handleClickOnDeletGroupQuery(e, parentIndex)}
          />
        </AETooltip>
      </div>
    );
  };

  handleClickOnDeletGroupQuery = (e, indexOfParent) => {
    e && e.stopPropagation();
    this.setState((state) => {
      const { filter } = state;
      const { conditions } = filter;
      let updatedFilter = {
        ...filter,
        conditions: [
          ...conditions.map((condition, index) => {
            const { parentIndex, type } = condition || {};
            if (type === 'group') {
              if (parentIndex === indexOfParent) {
                return {};
              }
              const parentIndexArray = this.getIndexArrayFromParentIndex(indexOfParent);
              if (parentIndexArray && parentIndexArray.length > 1) {
                if (parseInt(parentIndexArray[0], 10) === index) {
                  return this.handleNestedDeleteGroupQuery(condition, indexOfParent, 0);
                }
                return condition;
              }
            }
            return condition;
          }),
        ],
      };
      updatedFilter = this.removeEmptyBlockAndGroup(updatedFilter);
      updatedFilter = this.reIndexingAftreDeleteEmptyBlocks(updatedFilter);
      this.setState({ filter: updatedFilter });
      return updatedFilter;
    });
  };

  handleNestedDeleteGroupQuery = (queryfilter, indexOfParent, arryIndex) => {
    arryIndex++;
    const { conditions } = queryfilter || {};
    if (!conditions) {
      return queryfilter;
    }
    return {
      ...queryfilter,
      conditions: [
        ...conditions.map((condition, index) => {
          const { parentIndex, type } = condition || {};
          if (type === 'group') {
            if (parentIndex === indexOfParent) {
              return {};
            }
            const parentIndexArray = this.getIndexArrayFromParentIndex(indexOfParent);
            if (parentIndexArray && parentIndexArray.length > 1) {
              if (parseInt(parentIndexArray[arryIndex], 10) === index) {
                return this.handleNestedDeleteGroupQuery(condition, indexOfParent, arryIndex);
              }
              return condition;
            }
          }
          return condition;
        }),
      ],
    };
  };

  renderQueryCard = (filter) => {
    const { conditions, conditionalOperator } = filter || {};
    let { parentIndex } = filter || {};
    const originalParentIndex = parentIndex;
    if (conditions) {
      return conditions.map((condition, index) => {
        const { status, type } = condition || {};
        parentIndex = (condition && condition.parentIndex) || parentIndex;
        let view = <></>;
        let operatorView = <></>;
        if (status === undefined && type === undefined) {
          return <> </>;
        }
        const operator = conditionalOperator || (condition && condition.conditionalOperator);
        if (operator) {
          operatorView = this.getLabelBasedOnConditionalOperator(operator);
        }
        switch (type) {
          case 'group':
            view = this.renderGroupQueryCard(condition, index);
            break;
          default:
            switch (status) {
              case this.statusEnum.INITIAL:
                view = this.renderVerticalLineWithAddButton(index, originalParentIndex);
                break;
              case this.statusEnum.CREATED:
                view = this.renderFilterSearchInputBox(index, originalParentIndex);
                break;
              case this.statusEnum.SELECTED:
              case this.statusEnum.EDITED:
                view = this.renderFilterFieldCard(index, condition, originalParentIndex);
                break;
              case this.statusEnum.SAVED:
                view = this.renderSavedQueryCard(condition, index, originalParentIndex);
                break;
              default:
                view = <></>;
                break;
            }
        }
        return (
          <>
            {index !== 0 && operatorView}
            {view}
          </>
        );
      });
    }
    return <></>;
  };

  handleSelectOnField = (selectedField, rowIndex, indexOfParent) => {
    const { value, fieldData, instanceFields, instance } = selectedField || {};
    const { filterMasterJson } = this.props;
    const operators = get(filterMasterJson, 'operator');
    const filters = get(filterMasterJson, 'filters');
    let columnData;
    let fieldAttributes;
    let data;
    if (instance && instance.fieldType === 'instance') {
      columnData = instanceFields && instanceFields[0];
      fieldAttributes = instance.attribute;
      data = {
        condition: {
          isInstance: true,
          instanceFieldName: columnData && columnData.name,
        },
        instanceFields,
        instance,
      };
    } else {
      columnData = fieldData;
      fieldAttributes = fieldData.attribute;
      data = {
        condition: {
          isInstance: false,
        },
        columnData: fieldData,
      };
    }
    if (fieldAttributes) {
      const allFields = [];
      Object.values(filters).forEach((object) => {
        const fields = object.columns.map((column) => column.values).flat();
        allFields.push(fields);
      });
      data.attributes = JSON.parse(
        JSON.stringify(fieldAttributes.map((attr) => allFields.flat().find((field) => field.name === attr))),
      );
    } else {
      data.attributes = [];
    }
    const { operator, type, dataType, enumValue } = columnData || {};
    let defaultValue = '';
    if (operator === 'enum' && type === 'dropdown') {
      defaultValue = enumValue && enumValue[0];
    } else if (type === 'numeric') {
      defaultValue = '0';
    }

    data.condition.dataType = dataType;
    data.condition.operator = operators[operator][0];
    data.condition.columnName = value;
    data.columnData = columnData;
    data.condition.columnValue = defaultValue;
    data.columnOperators = operators[operator];
    this.setState((state) => {
      const { filter } = state;
      const { conditions } = filter || {};
      return {
        filter: {
          ...filter,
          conditions: [
            ...conditions.map((condition, queryIndex) => {
              if (indexOfParent) {
                return this.handleNestedSelectOnField(condition, rowIndex, indexOfParent, data);
              }
              if (rowIndex === queryIndex) {
                delete condition.condition.attribute;
                return {
                  ...condition,
                  ...data,
                };
              }
              return condition;
            }),
          ],
        },
      };
    });
  };

  handleNestedSelectOnField = (filter, rowIndex, indexOfParent, data) => {
    const { conditions, parentIndex } = filter || {};
    if (!conditions) {
      return filter;
    }
    return {
      ...filter,
      conditions: [
        ...conditions.map((condition, index) => {
          if (indexOfParent) {
            if (indexOfParent === parentIndex && index === rowIndex) {
              return {
                ...condition,
                ...data,
              };
            }
            return this.handleNestedSelectOnField(condition, rowIndex, indexOfParent, data);
          }
          if (index === rowIndex) {
            return {
              ...condition,
              ...data,
            };
          }
          return condition;
        }),
      ],
    };
  };

  handleSelectOnOperator = (value, rowIndex, indexOfParent) => {
    this.setState((state) => {
      const { filter } = state;
      const { conditions } = filter || {};
      return {
        filter: {
          ...filter,
          conditions: [
            ...conditions.map((condition, index) => {
              if (indexOfParent) {
                return this.handleSelectOnNestedOperator(condition, value, rowIndex, indexOfParent);
              }

              if (rowIndex === index) {
                return { ...condition, condition: { ...condition.condition, operator: value } };
              }
              return condition;
            }),
          ],
        },
      };
    });
  };

  handleSelectOnNestedOperator = (filter, value, rowIndex, indexOfParent) => {
    const { conditions, parentIndex } = filter || {};
    if (!conditions) {
      return filter;
    }
    return {
      ...filter,
      conditions: [
        ...conditions.map((condition, index) => {
          if (indexOfParent) {
            if (indexOfParent === parentIndex && index === rowIndex) {
              return { ...condition, condition: { ...condition.condition, operator: value } };
            }
            return this.handleSelectOnNestedOperator(condition, value, rowIndex, indexOfParent);
          }
          if (index === rowIndex) {
            return { ...condition, condition: { ...condition.condition, operator: value } };
          }
          return condition;
        }),
      ],
    };
  };

  handleSelectOnInstanceField = (selectedInstanceField, rowIndex, indexOfParent) => {
    const { filterMasterJson } = this.props;
    const operators = get(filterMasterJson, 'operator');
    const { data, value } = selectedInstanceField;
    const columnOperators = operators && operators[data.operator];
    this.setState((state) => {
      const { filter } = state;
      const { conditions } = filter || {};
      return {
        filter: {
          ...filter,
          conditions: [
            ...conditions.map((condition, index) => {
              if (indexOfParent) {
                const parentArray = indexOfParent.split('_');
                const parentIndexArray = parentArray.filter((el) => !isNaN(parseFloat(el)) && isFinite(el));
                if (parseInt(parentIndexArray[0], 10) === index) {
                  return this.handleNestedSelectOnInstanceField(
                    condition,
                    rowIndex,
                    value,
                    columnOperators,
                    data,
                    parentIndexArray,
                    0,
                  );
                }
                return condition;
              }
              if (rowIndex === index) {
                return this.commonReturnConditionForSelectInstanceField(condition, value, columnOperators, data);
              }
              return condition;
            }),
          ],
        },
      };
    });
  };

  handleNestedSelectOnInstanceField = (
    filter,
    rowIndex,
    value,
    columnOperators,
    data,
    parentIndexArray,
    arrayIndex,
  ) => {
    ++arrayIndex;
    const { conditions } = filter || {};

    return {
      ...filter,
      conditions: [
        ...conditions.map((condition, index) => {
          if (parentIndexArray && parentIndexArray.length > arrayIndex) {
            if (parseInt(parentIndexArray[arrayIndex], 10) === index) {
              return this.handleNestedSelectOnInstanceField(
                condition,
                rowIndex,
                value,
                columnOperators,
                data,
                parentIndexArray,
                arrayIndex,
              );
            }
            return condition;
          }
          if (index === rowIndex) {
            return this.commonReturnConditionForSelectInstanceField(condition, value, columnOperators, data);
          }
          return condition;
        }),
      ],
    };
  };

  handleOnChangeInputBox = (value, rowIndex, indexOfParent, mappedValue) => {
    this.setState((state) => {
      const { filter } = state;
      const { conditions } = filter;
      return {
        filter: {
          ...filter,
          conditions: [
            ...conditions.map((condition, index) => {
              if (indexOfParent) {
                return this.handleOnChangeNestedInputBox(condition, value, rowIndex, indexOfParent, mappedValue);
              }
              if (index === rowIndex) {
                return { ...condition, condition: { ...condition.condition, columnValue: value, mappedValue } };
              }
              return condition;
            }),
          ],
        },
      };
    });
  };

  handleOnChangeNestedInputBox = (filter, value, rowIndex, indexOfParent, mappedValue) => {
    const { conditions, parentIndex } = filter || {};
    if (!conditions) {
      return filter;
    }
    return {
      ...filter,
      conditions: [
        ...conditions.map((condition, index) => {
          if (indexOfParent) {
            if (indexOfParent === parentIndex && index === rowIndex) {
              return { ...condition, condition: { ...condition.condition, columnValue: value, mappedValue } };
            }
            return this.handleOnChangeNestedInputBox(condition, value, rowIndex, indexOfParent, mappedValue);
          }
          if (index === rowIndex) {
            return { ...condition, condition: { ...condition.condition, columnValue: value, mappedValue } };
          }
          return condition;
        }),
      ],
    };
  };

  removeEmptyBlockAndGroup = (filter) => {
    let { conditions } = filter;
    for (let i = 0; i < conditions.length; i++) {
      if (conditions[i]) {
        if (!Object.keys(conditions[i]).length || conditions[i] === null || conditions[i] === undefined) {
          conditions.splice(i, 1);
        } else {
          const typeOfCondition = conditions[i].type;
          if (typeOfCondition === 'group') {
            conditions[i] = this.removeEmptyBlockAndGroupForGroup(conditions[i]);
            if (!Object.keys(conditions[i]).length || conditions[i] === null || conditions[i] === undefined) {
              conditions.splice(i, 1);
            }
          }
        }
      } else {
        conditions.splice(i, 1);
      }
    }
    conditions = conditions.filter((el) => Object.keys(el).length);
    return filter;
  };

  removeEmptyBlockAndGroupForGroup = (filter) => {
    let { conditions } = filter;
    const emptyGroup = this.checkGroupIsEmpty(conditions);
    if (emptyGroup) {
      return {};
    }
    for (let i = 0; i < conditions.length; i++) {
      if (conditions[i]) {
        if (!Object.keys(conditions[i]).length || conditions[i] === null || conditions[i] === undefined) {
          conditions.splice(i, 1);
        } else {
          const typeOfCondition = conditions[i].type;
          if (typeOfCondition === 'group') {
            conditions[i] = this.removeEmptyBlockAndGroupForGroup(conditions[i]);
            if (!Object.keys(conditions[i]).length || conditions[i] === null || conditions[i] === undefined) {
              conditions.splice(i, 1);
            }
          }
        }
      } else {
        conditions.splice(i, 1);
      }
    }
    conditions = conditions.filter((el) => Object.keys(el).length);
    return filter;
  };

  checkGroupIsEmpty = (conditions) => {
    let empty = true;
    for (let i = 0; i < conditions.length; i++) {
      if (
        conditions[i] &&
        conditions[i].type &&
        (conditions[i].type === 'group' ||
          conditions[i].type === 'single' ||
          conditions[i].type === this.statusEnum.SAVED)
      ) {
        empty = false;
        break;
      }
    }
    return empty;
  };

  handleClickOnCancelQuery = (e, rowIndex, parentIndex, forceDelete) => {
    e && e.stopPropagation();
    this.setState((state) => {
      const { filter } = state;
      const { conditions } = filter;
      let updatedFilter = {
        ...filter,
        conditions: [
          ...(forceDelete
            ? parentIndex
              ? conditions.map((condition) => this.handleNestedDeleteQuery(condition, rowIndex, parentIndex, 0))
              : conditions.filter((_, index) => index !== rowIndex)
            : conditions.map((condition, index) => {
                if (parentIndex) {
                  return this.handleNestedClickOnCancelQuery(condition, rowIndex, parentIndex);
                }
                if (index === rowIndex) {
                  return { ...condition.edited, status: this.statusEnum.SAVED };
                }
                return condition;
              })),
        ],
      };
      if (forceDelete) {
        updatedFilter = this.removeEmptyBlockAndGroup(updatedFilter);
        updatedFilter = this.reIndexingAftreDeleteEmptyBlocks(updatedFilter);
      }
      this.setState({ filter: updatedFilter });
      return updatedFilter;
    });
  };

  reIndexingAftreDeleteEmptyBlocks = (filter) => {
    let { conditions } = filter || {};
    if (conditions) {
      conditions = conditions.filter((el) => Object.keys(el).length);
      conditions.map((condition, index) => {
        const { type } = condition || {};
        if (type === 'group') {
          return this.reIndexingAftreDeleteEmptyBlocksForGroup(condition, index);
        }
        return condition;
      });
    }

    return filter;
  };

  reIndexingAftreDeleteEmptyBlocksForGroup = (filter, indexOfParent) => {
    let { conditions } = filter || {};
    if (conditions) {
      conditions = conditions.filter((el) => Object.keys(el).length);
      conditions.map((condition, index) => {
        const { type } = condition || {};
        const indexOfCondition = indexOfParent ? `${indexOfParent}${index}_` : `${index}_`;
        if (type === 'group') {
          return this.reIndexingAftreDeleteEmptyBlocksForGroup(condition, indexOfCondition);
        }
        return { ...condition, parentIndex: indexOfCondition };
      });
    }
    return filter;
  };

  handleNestedDeleteQuery = (queryfilter, rowIndex, indexOfParent, arryIndex) => {
    arryIndex++;
    const { conditions, parentIndex } = queryfilter || {};
    if (!conditions) {
      return queryfilter;
    }
    return {
      ...queryfilter,
      conditions: [
        ...conditions.map((condition, index) => {
          if (indexOfParent) {
            if (parentIndex === indexOfParent && index === rowIndex) {
              return {};
            }
            const parentIndexArray = this.getIndexArrayFromParentIndex(indexOfParent);
            if (parentIndexArray && parentIndexArray.length > 1) {
              if (parseInt(parentIndexArray[arryIndex], 10) === index) {
                return this.handleNestedDeleteQuery(condition, rowIndex, indexOfParent, arryIndex);
              }
              return condition;
            }
            if (index === rowIndex) {
              return {};
            }
            return condition;
          }
          return condition;
        }),
      ],
    };
  };

  handleNestedClickOnCancelQuery = (filter, rowIndex, indexOfParent) => {
    const { conditions, parentIndex } = filter || {};
    if (!conditions) {
      return filter;
    }
    return {
      ...filter,
      conditions: [
        ...conditions.map((condition, index) => {
          if (indexOfParent) {
            if (indexOfParent === parentIndex && index === rowIndex) {
              return { ...condition.edited, status: this.statusEnum.SAVED };
            }
            return this.handleNestedClickOnCancelQuery(condition, rowIndex, indexOfParent, true);
          }
          if (index === rowIndex) {
            return { ...condition.edited, status: this.statusEnum.SAVED };
          }
          return condition;
        }),
      ],
    };
  };

  handleClickOnAddToGroupQuery = (e, rowIndex, indexOfParent) => {
    e && e.stopPropagation();
    this.setState((state) => {
      const { filter } = state;
      const { conditions } = filter;
      return {
        filter: {
          ...filter,
          conditions: [
            ...conditions.map((condition, index) => {
              if (indexOfParent) {
                const parentIndexArray = this.getIndexArrayFromParentIndex(indexOfParent);
                if (parseInt(parentIndexArray[0], 10) === index) {
                  return this.handleClickOnNestedAddToGroupQuery(condition, rowIndex, indexOfParent);
                }
                return condition;
              }
              if (index === rowIndex) {
                const { parentIndex } = condition;
                return {
                  type: 'group',
                  parentIndex: parentIndex ? `${parentIndex}${rowIndex}_` : `${rowIndex}_`,
                  conditionalOperator: this.filterOptions()[0].value,
                  conditions: [condition, this.initialQuery],
                };
              }
              return condition;
            }),
          ],
        },
      };
    });
  };

  handleClickOnNestedAddToGroupQuery = (filter, rowIndex, indexOfParent, originalIndex) => {
    const { conditions } = filter;
    if (conditions) {
      return {
        ...filter,
        conditions: [
          ...conditions.map((condition, index) => {
            if (indexOfParent) {
              const parentIndexArray = this.getIndexArrayFromParentIndex(indexOfParent);
              if (parentIndexArray && parentIndexArray.length > 1) {
                if (parseInt(parentIndexArray[0], 10) === index) {
                  parentIndexArray.shift();
                  const updatedParentPathIndex = this.joinArrayByUnderScore(parentIndexArray.join);
                  return this.handleClickOnNestedAddToGroupQuery(
                    condition,
                    rowIndex,
                    updatedParentPathIndex,
                    originalIndex,
                  );
                }
                return condition;
              }
              if (index === rowIndex) {
                const indexToSet = originalIndex || indexOfParent;
                return {
                  type: 'group',
                  parentIndex: indexToSet ? `${indexToSet}${rowIndex}_` : `${rowIndex}_`,
                  conditionalOperator: this.filterOptions()[0].value,
                  conditions: [condition, this.initialQuery],
                };
              }
              return condition;
            }
            return condition;
          }),
        ],
      };
    }
    return filter;
  };

  handleClickOnSaveQuery = (rowIndex, indexOfParent) => {
    this.setState((state) => {
      const { filter } = state;
      const { conditions } = filter;
      return {
        filter: {
          ...filter,
          conditions: [
            ...conditions.map((condition, index) => {
              if (indexOfParent) {
                return this.handleClickOnNestedSaveQuery(condition, rowIndex, indexOfParent);
              }
              const { condition: columnCondition } = condition || {};
              if (index === rowIndex) {
                return {
                  ...condition,
                  status: this.statusEnum.SAVED,
                  condition: {
                    ...columnCondition,
                    columnValue:
                      columnCondition.columnValue && columnCondition.operator === 'has_any_value'
                        ? ''
                        : columnCondition.columnValue,
                  },
                };
              }
              return condition;
            }),
          ],
        },
      };
    });
  };

  handleClickOnNestedSaveQuery = (filter, rowIndex, indexOfParent) => {
    const { conditions, parentIndex } = filter || {};
    if (!conditions) {
      return filter;
    }
    return {
      ...filter,
      conditions: [
        ...conditions.map((condition, index) => {
          if (indexOfParent) {
            if (indexOfParent === parentIndex && index === rowIndex) {
              const { condition: columnCondition } = condition || {};
              return {
                ...condition,
                status: this.statusEnum.SAVED,
                condition: {
                  ...columnCondition,
                  columnValue:
                    columnCondition.columnValue && columnCondition.operator === 'has_any_value'
                      ? ''
                      : columnCondition.columnValue,
                },
              };
            }
            return this.handleClickOnNestedSaveQuery(condition, rowIndex, indexOfParent);
          }
          if (index === rowIndex) {
            const { condition: columnCondition } = condition || {};
            return {
              ...condition,
              status: this.statusEnum.SAVED,
              condition: {
                ...columnCondition,
                columnValue:
                  columnCondition.columnValue && columnCondition.operator === 'has_any_value'
                    ? ''
                    : columnCondition.columnValue,
              },
            };
          }
          return condition;
        }),
      ],
    };
  };

  handleClickOnEditQuery = (rowIndex, parentIndex) => {
    this.setState((state) => {
      const { filter } = state;
      const { conditions } = filter;
      return {
        filter: {
          ...filter,
          conditions: [
            ...conditions.map((condition, index) => {
              if (parentIndex) {
                return this.handleClickOnNestedEditQuery(condition, rowIndex, parentIndex);
              }
              if (index === rowIndex) {
                const rowData = {
                  ...condition,
                  status: this.statusEnum.EDITED,
                  edited: JSON.parse(JSON.stringify(condition)),
                };
                return rowData;
              }
              return condition;
            }),
          ],
        },
      };
    });
  };

  handleClickOnNestedEditQuery = (filter, rowIndex, indexOfParent) => {
    const { conditions, parentIndex } = filter || {};
    if (!conditions) {
      return filter;
    }
    return {
      ...filter,
      conditions: [
        ...conditions.map((condition, index) => {
          if (indexOfParent) {
            if (parentIndex === indexOfParent) {
              if (index === rowIndex) {
                return {
                  ...condition,
                  status: this.statusEnum.EDITED,
                  edited: JSON.parse(JSON.stringify(condition)),
                };
              }
              return condition;
            }
            return this.handleClickOnNestedEditQuery(condition, rowIndex, indexOfParent);
          }
          if (index === rowIndex) {
            return {
              ...condition,
              status: this.statusEnum.EDITED,
              edited: JSON.parse(JSON.stringify(condition)),
            };
          }
          return condition;
        }),
      ],
    };
  };

  handleSelectOnAttribute = (selectedAttribute, filterData, rowIndex, parentIndex) => {
    const { filterMasterJson } = this.props;
    const operators = get(filterMasterJson, 'operator');
    const { fieldType, instanceColumns, name } = selectedAttribute || {};
    let columnData = selectedAttribute;
    let attributeInstanceFields;
    const data = {
      columnName: name,
      isInstance: false,
    };
    if (fieldType === 'instance') {
      const instanceFromFilterData = filterData.instance;
      attributeInstanceFields = instanceFromFilterData[instanceColumns];
      columnData = attributeInstanceFields && attributeInstanceFields[0];
      data.isInstance = true;
      data.instanceFieldName = attributeInstanceFields[0].name;
      data.instanceFields = attributeInstanceFields;
      data.instance = selectedAttribute;
    }
    let defaultValue = '';
    if (columnData.operator === 'enum' && columnData.type === 'dropdown') {
      defaultValue = columnData.enumValue && columnData.enumValue[0];
    } else if (columnData.type === 'numeric') {
      defaultValue = '0';
    }
    data.columnData = columnData;
    data.columnOperators = operators[columnData.operator];
    data.operator = operators[columnData.operator][0];
    data.dataType = columnData.dataType;
    data.columnValue = defaultValue;

    this.setState((state) => {
      const { filter } = state;
      const { conditions } = filter;
      return {
        filter: {
          ...filter,
          conditions: [
            ...conditions.map((condition, index) => {
              if (parentIndex) {
                const parentArray = parentIndex.split('_');
                const parentIndexArray = parentArray.filter((el) => !isNaN(parseFloat(el)) && isFinite(el));
                if (parseInt(parentIndexArray[0], 10) === index) {
                  return this.handleNestedSelectOnAttribute(condition, data, name, rowIndex, parentIndexArray, 0);
                }
                return condition;
              }
              if (index === rowIndex) {
                return this.commonReturnConditionForSelectOnAttribute(condition, data, name);
              }
              return condition;
            }),
          ],
        },
      };
    });
  };

  commonReturnConditionForSelectOnAttribute = (condition, data, name) => {
    const attribute = condition.condition.attribute || [];
    const attributes = condition.attributes.map((attr) => {
      if (attr.name === name) {
        attr.isSelected = true;
        return attr;
      }
      return attr;
    });
    return {
      ...condition,
      attributes,
      condition: {
        ...condition.condition,
        attribute: [
          ...(attribute || []),
          {
            ...data,
          },
        ],
      },
    };
  };

  handleNestedSelectOnAttribute = (filter, data, name, rowIndex, parentIndexArray, arrayIndex) => {
    ++arrayIndex;
    const { conditions } = filter || {};

    return {
      ...filter,
      conditions: [
        ...conditions.map((condition, index) => {
          if (parentIndexArray && parentIndexArray.length > arrayIndex) {
            if (parseInt(parentIndexArray[arrayIndex], 10) === index) {
              return this.handleNestedSelectOnAttribute(condition, data, name, rowIndex, parentIndexArray, arrayIndex);
            }
            return condition;
          }
          if (index === rowIndex) {
            return this.commonReturnConditionForSelectOnAttribute(condition, data, name);
          }
          return condition;
        }),
      ],
    };
  };

  handleClickOnRemoveAttribute = (attributeIndex, rowIndex, parentIndex) => {
    this.setState((state) => {
      const { filter } = state;
      const { conditions } = filter;
      return {
        filter: {
          ...filter,
          conditions: [
            ...conditions.map((condition, index) => {
              if (parentIndex) {
                const parentArray = parentIndex.split('_');
                const parentIndexArray = parentArray.filter((el) => !isNaN(parseFloat(el)) && isFinite(el));
                if (parseInt(parentIndexArray[0], 10) === index) {
                  return this.handleNestedClickOnRemoveAttribute(
                    condition,
                    attributeIndex,
                    rowIndex,
                    parentIndexArray,
                    0,
                  );
                }
                return condition;
              }
              if (index === rowIndex) {
                return this.commonReturnConditionForClickOnRemoveAttribute(condition, attributeIndex);
              }
              return condition;
            }),
          ],
        },
      };
    });
  };

  handleNestedClickOnRemoveAttribute = (filter, attributeIndex, rowIndex, parentIndexArray, arrayIndex) => {
    ++arrayIndex;
    const { conditions } = filter || {};

    return {
      ...filter,
      conditions: [
        ...conditions.map((condition, index) => {
          if (parentIndexArray && parentIndexArray.length > arrayIndex) {
            if (parseInt(parentIndexArray[arrayIndex], 10) === index) {
              return this.handleNestedClickOnRemoveAttribute(
                condition,
                attributeIndex,
                rowIndex,
                parentIndexArray,
                arrayIndex,
              );
            }
            return condition;
          }
          if (index === rowIndex) {
            return this.commonReturnConditionForClickOnRemoveAttribute(condition, attributeIndex);
          }
          return condition;
        }),
      ],
    };
  };

  commonReturnConditionForClickOnRemoveAttribute = (condition, attributeIndex) => {
    const { attribute } = condition.condition || {};
    condition.condition.attribute = attribute.filter((attr, i) => {
      if (i === attributeIndex) {
        const attributes = condition.attributes.map((conditionAttribute) => {
          if (conditionAttribute.name === attr.columnName) {
            conditionAttribute.isSelected = false;
          }
          return conditionAttribute;
        });
        condition.attributes = attributes;
        return false;
      }
      return true;
    });
    return condition;
  };

  handleOnChangeAttributeInputValue = (value, attributeIndex, rowIndex, parentIndex, mappedValue) => {
    this.setState((state) => {
      const { filter } = state;
      const { conditions } = filter;
      return {
        filter: {
          ...filter,
          conditions: [
            ...conditions.map((condition, index) => {
              if (parentIndex) {
                const parentArray = parentIndex.split('_');
                const parentIndexArray = parentArray.filter((el) => !isNaN(parseFloat(el)) && isFinite(el));
                if (parseInt(parentIndexArray[0], 10) === index) {
                  return this.handleNestedOnChangeAttributeInputValue(
                    condition,
                    value,
                    attributeIndex,
                    rowIndex,
                    parentIndexArray,
                    0,
                    mappedValue,
                  );
                }
                return condition;
              }
              if (index === rowIndex) {
                return this.commonReturnConditionForChangeInputAttribute(condition, value, attributeIndex, mappedValue);
              }
              return condition;
            }),
          ],
        },
      };
    });
  };

  handleNestedOnChangeAttributeInputValue = (
    filter,
    value,
    attributeIndex,
    rowIndex,
    parentIndexArray,
    arrayIndex,
    mappedValue,
  ) => {
    ++arrayIndex;
    const { conditions } = filter || {};

    return {
      ...filter,
      conditions: [
        ...conditions.map((condition, index) => {
          if (parentIndexArray && parentIndexArray.length > arrayIndex) {
            if (parseInt(parentIndexArray[arrayIndex], 10) === index) {
              return this.handleNestedOnChangeAttributeInputValue(
                condition,
                value,
                attributeIndex,
                rowIndex,
                parentIndexArray,
                arrayIndex,
                mappedValue,
              );
            }
            return condition;
          }
          if (index === rowIndex) {
            return this.commonReturnConditionForChangeInputAttribute(condition, value, attributeIndex, mappedValue);
          }
          return condition;
        }),
      ],
    };
  };

  commonReturnConditionForChangeInputAttribute = (condition, value, attributeIndex, mappedValue) => {
    const attribute = condition.condition.attribute.map((attr, attributeMapIndex) => {
      if (attributeMapIndex === attributeIndex) {
        attr.columnValue = value;
        attr.mappedValue = mappedValue;
      }
      return attr;
    });
    condition.condition.attribute = attribute;
    return condition;
  };

  handleSelectOnInstanceFieldForAttribute = (selectedInstanceField, attributeIndex, rowIndex, parentIndex) => {
    const { filterMasterJson } = this.props;
    const operators = get(filterMasterJson, 'operator');
    const { data } = selectedInstanceField;
    const columnOperators = operators && operators[data.operator];
    this.setState((state) => {
      const { filter } = state;
      const { conditions } = filter || {};
      return {
        filter: {
          ...filter,
          conditions: [
            ...conditions.map((condition, index) => {
              if (parentIndex) {
                const parentArray = parentIndex.split('_');
                const parentIndexArray = parentArray.filter((el) => !isNaN(parseFloat(el)) && isFinite(el));
                if (parseInt(parentIndexArray[0], 10) === index) {
                  return this.handleNestedSelectOnInstanceFieldForAttribute(
                    condition,
                    data,
                    columnOperators,
                    attributeIndex,
                    rowIndex,
                    parentIndexArray,
                    0,
                  );
                }
                return condition;
              }
              if (rowIndex === index) {
                this.commonReturnForSelectOnInstanceFieldForAttribute(condition, data, columnOperators, attributeIndex);
              }
              return condition;
            }),
          ],
        },
      };
    });
  };

  handleNestedSelectOnInstanceFieldForAttribute = (
    filter,
    data,
    columnOperators,
    attributeIndex,
    rowIndex,
    parentIndexArray,
    arrayIndex,
  ) => {
    ++arrayIndex;
    const { conditions } = filter || {};

    return {
      ...filter,
      conditions: [
        ...conditions.map((condition, index) => {
          if (parentIndexArray && parentIndexArray.length > arrayIndex) {
            if (parseInt(parentIndexArray[arrayIndex], 10) === index) {
              return this.handleNestedSelectOnInstanceFieldForAttribute(
                condition,
                data,
                columnOperators,
                attributeIndex,
                rowIndex,
                parentIndexArray,
                arrayIndex,
              );
            }
            return condition;
          }
          if (index === rowIndex) {
            return this.commonReturnForSelectOnInstanceFieldForAttribute(
              condition,
              data,
              columnOperators,
              attributeIndex,
            );
          }
          return condition;
        }),
      ],
    };
  };

  commonReturnForSelectOnInstanceFieldForAttribute = (condition, data, columnOperators, attributeIndex) => {
    const attribute = condition.condition.attribute.map((attr, attrMapIndex) => {
      if (attrMapIndex === attributeIndex) {
        let defaultValue = '';
        if (data.operator === 'enum' && data.type === 'dropdown') {
          defaultValue = data.enumValue && data.enumValue[0];
        } else if (data.type === 'numeric') {
          defaultValue = '0';
        }
        attr.columnValue = defaultValue;
        attr.columnData = data;
        attr.columnOperators = columnOperators;
        attr.instanceFieldName = data.name;
        attr.operator = columnOperators[0];
      }
      return attr;
    });
    condition.condition.attribute = attribute;
    return condition;
  };

  handleSelectOperatorForAttribute = (selectedOperator, attributeIndex, rowIndex, parentIndex) => {
    this.setState((state) => {
      const { filter } = state;
      const { conditions } = filter;
      return {
        filter: {
          ...filter,
          conditions: [
            ...conditions.map((condition, index) => {
              if (parentIndex) {
                const parentArray = parentIndex.split('_');
                const parentIndexArray = parentArray.filter((el) => !isNaN(parseFloat(el)) && isFinite(el));
                if (parseInt(parentIndexArray[0], 10) === index) {
                  return this.handleNestedSelectOperatorForAttribute(
                    condition,
                    selectedOperator,
                    attributeIndex,
                    rowIndex,
                    parentIndexArray,
                    0,
                  );
                }
                return condition;
              }
              if (index === rowIndex) {
                this.commonReturnForSelectOperatorForAttribute(condition, selectedOperator, attributeIndex);
              }
              return condition;
            }),
          ],
        },
      };
    });
  };

  handleNestedSelectOperatorForAttribute = (
    filter,
    selectedOperator,
    attributeIndex,
    rowIndex,
    parentIndexArray,
    arrayIndex,
  ) => {
    ++arrayIndex;
    const { conditions } = filter || {};

    return {
      ...filter,
      conditions: [
        ...conditions.map((condition, index) => {
          if (parentIndexArray && parentIndexArray.length > arrayIndex) {
            if (parseInt(parentIndexArray[arrayIndex], 10) === index) {
              return this.handleNestedSelectOperatorForAttribute(
                condition,
                selectedOperator,
                attributeIndex,
                rowIndex,
                parentIndexArray,
                arrayIndex,
              );
            }
            return condition;
          }
          if (index === rowIndex) {
            return this.commonReturnForSelectOperatorForAttribute(condition, selectedOperator, attributeIndex);
          }
          return condition;
        }),
      ],
    };
  };

  commonReturnForSelectOperatorForAttribute = (condition, selectedOperator, attributeIndex) => {
    const attribute = condition.condition.attribute.map((attr, attrMapIndex) => {
      if (attrMapIndex === attributeIndex) {
        attr.operator = selectedOperator.value;
      }
      return attr;
    });
    condition.condition.attribute = attribute;
    return condition;
  };

  isValidQuery = (condition) => {
    const { operator, columnValue, attribute } = condition.condition;
    let isInvalid = true;
    if (operator === 'has_any_value' || columnValue) {
      isInvalid = false;
      if (size(attribute) > 0) {
        isInvalid = !attribute.every((attr) => !!attr.columnValue);
      }
    }
    return isInvalid;
  };

  getStringWithWhiteSpace = (str) => (str ? str.replace(/_/g, ' ') : '');

  renderSelectBox = (options, value, index, indexOfParent) => {
    const { t } = this.props;
    const nodataText = t('No options');
    return (
      <AESelect
        onChange={(e) => this.handleSelectOnOperator(e.value, index, indexOfParent)}
        nodataText={nodataText}
        options={options}
        value={value}
        menuShouldScrollIntoView={false}
      />
    );
  };

  renderSelectBoxForInstanceField = (instanceFields, value, index, indexOfParent) => {
    const { t } = this.props;
    const nodataText = t('No options');
    if (!(instanceFields && Array.isArray(instanceFields))) {
      return <></>;
    }
    const options = instanceFields.map((field) => ({
      label: t(`attendeeDetails:${field.label}`),
      value: field.name,
      data: field,
    }));
    return (
      <AESelect
        onChange={(e) => this.handleSelectOnInstanceField(e, index, indexOfParent)}
        nodataText={nodataText}
        options={options}
        value={value}
        menuShouldScrollIntoView={false}
      />
    );
  };

  renderSvgIcon = (key) => {
    const iconObj = key && this.iconMap[key];
    const { isNormalIcon, passTo, svgIcon: icon, viewBox } = iconObj || {};
    let view;
    if (iconObj) {
      if (isNormalIcon) {
        view = <AEIcon type={icon} size="exSmall" />;
      } else if (passTo === 'AEIcon') {
        view = <AEIcon svgIcon={icon} viewBox={viewBox} size="small" color="#6D6F7D" />;
      } else {
        view = svgIcon(icon);
      }
    }
    return <div className="display-svg-icon">{view}</div>;
  };

  filterOptionsOfFields = (options, inputValue) => {
    const name = get(options, 'data.searchableLabel');
    return inputValue && name ? name.toLowerCase().includes(inputValue.toLowerCase()) : true;
  };

  renderFieldSelectBox = (options, value, rowIndex, indexOfParent) => {
    const { t } = this.props;
    const nodataText = t('No options');
    return (
      <AESelect
        onChange={(e) => this.handleSelectOnField(e, rowIndex, indexOfParent)}
        options={options}
        nodataText={nodataText}
        value={value}
        menuShouldScrollIntoView={false}
        isTwoDimensional
        maxMenuHeight={190}
        isSearchable
        filterOption={this.filterOptionsOfFields}
      />
    );
  };

  commonReturnConditionForSelectInstanceField = (condition, value, columnOperators, data) => ({
    ...condition,
    condition: {
      ...condition.condition,
      instanceFieldName: value,
      operator: columnOperators && columnOperators[0],
      columnValue: data.type === 'numeric' ? 0 : '',
    },
    columnOperators,
    columnData: data,
  });

  getSuggestionByFilterTypeAndFieldAndValue(inputValue, filterType, field, instanceName, limit, callback) {
    const { organizer, t, isFromWhiteLabel, whiteLabel } = this.props;
    const { organizerPageURL } = organizer || {};
    const { whiteLabelUrl } = whiteLabel || {};
    const inputTrimmed = inputValue && inputValue.trim();
    if (organizerPageURL || whiteLabelUrl) {
      let apiCall;
      if (isFromWhiteLabel) {
        apiCall = getSuggestionByFilterTypeAndFieldAndValueAndWhiteLabelURL(
          whiteLabelUrl,
          filterType,
          field,
          inputTrimmed,
          instanceName,
          limit,
        );
      } else {
        apiCall = getSuggestionByFilterTypeAndFieldAndValue(
          organizerPageURL,
          filterType,
          field,
          inputTrimmed,
          instanceName,
          limit,
        );
      }
      apiCall.then((resp) => {
        let data = [];
        if (resp && !resp.errorMessage) {
          if (size(resp) > 0) {
            const mappedData = Object.keys(resp).map((key) => ({ label: resp[key], value: resp[key], data: key }));
            const options = mappedData.filter((obj) => !!obj.value);
            if (size(options) > 0) {
              data = [{ label: t(`First {{limit}} results`, { limit }), options }];
            }
          }
        }
        callback(data);
      });
    } else {
      callback([]);
    }
  }

  loadOptions = (inputValue, filterType, field, instanceName, limit, callback) =>
    this.getSuggestionByFilterTypeAndFieldAndValue(inputValue, filterType, field, instanceName, limit, callback);

  debounceLoadOptionsForInputField = debounce(this.loadOptions, 500);

  debounceLoadOptionsForInputAttribute = debounce(this.loadOptions, 500);

  numberOnly = (e) => {
    const re = /^\d*\.?\d*$/;
    if (!re.test(e.key)) {
      e.preventDefault();
    }
  };

  renderInputBox = (value, columnData, selectedOperator, filterName, field, instanceName, rowIndex, indexOfParent) => {
    const isDisabled = selectedOperator === 'has_any_value';
    const { api, type, enumValue, limit } = columnData;

    const { t } = this.props;
    const nodataText = t('No options');
    let inputView;
    if (api && (selectedOperator === 'is' || selectedOperator === 'is_not')) {
      inputView = (
        <AESelect
          id={field}
          key={field}
          selectType="asyncSelect"
          nodataText={nodataText}
          cacheOptions
          defaultOptions
          isLoading={false}
          options={(inputValue, callback) =>
            this.debounceLoadOptionsForInputField(inputValue, filterName, field, instanceName, limit, callback)
          }
          onChange={(e) => this.handleOnChangeInputBox(e.value, rowIndex, indexOfParent, e.data)}
          menuShouldScrollIntoView={false}
          maxMenuHeight={150}
          value={{ label: value || t('audience:Type for search'), value: '' }}
          defaultInputValue={value}
        />
      );
    } else if (type === 'dropdown' && (selectedOperator === 'is' || selectedOperator === 'is_not')) {
      const options =
        enumValue && enumValue.map((e) => ({ label: t(`audience:${this.getStringWithWhiteSpace(e)}`), value: e }));

      inputView = (
        <AESelect
          options={options}
          value={value}
          nodataText={nodataText}
          onChange={(e) => this.handleOnChangeInputBox(e.value, rowIndex, indexOfParent)}
          menuShouldScrollIntoView={false}
        />
      );
    } else if (type === 'numeric') {
      inputView = (
        <AEInputField
          placeHolder={t('common:Number')}
          type="Number"
          name="queryValue"
          bsSize="large"
          value={value}
          onChange={(e) => this.handleOnChangeInputBox(e.target.value, rowIndex, indexOfParent)}
          size="normal"
          onKeyPress={this.numberOnly}
        />
      );
    } else {
      inputView = (
        <AEInputField
          type="text"
          name="queryValue"
          bsSize="large"
          disabled={isDisabled}
          value={isDisabled ? '' : value}
          onChange={(e) => this.handleOnChangeInputBox(e.target.value, rowIndex, indexOfParent)}
          placeHolder={t('audience:Keyword')}
          size="normal"
        />
      );
    }
    return inputView;
  };

  renderButtonForSaveAndCancel = (isValid, index, conditionStatus, indexOfParent) => {
    const { t } = this.props;
    return (
      <div className="my-2 d-flex justify-content-end">
        <AEButton
          label={t('common:Cancel')}
          size="small"
          className="mr-2"
          variant="secondary"
          onClick={(e) =>
            this.handleClickOnCancelQuery(e, index, indexOfParent, conditionStatus !== this.statusEnum.EDITED)
          }
        />
        <AEButton
          label={t('common:Save')}
          size="small"
          disabled={isValid}
          onClick={() => this.handleClickOnSaveQuery(index, indexOfParent)}
        />
      </div>
    );
  };

  renderInputForAttribute = (attribute, filterName, attributeIndex, rowIndex, parentIndex) => {
    const { t } = this.props;
    const {
      columnName,
      columnValue,
      instanceFieldName,
      isInstance,
      columnData,
      columnOperators,
      operator,
      instanceFields,
      instance,
    } = attribute;
    const { label, api, type, enumValue, limit } = columnData || {};
    let instanceFieldsOptions;
    const operatorOptions =
      size(columnOperators) > 0 &&
      columnOperators.map((op) => ({ label: t(`audience:${this.getStringWithWhiteSpace(op)}`), value: op }));
    if (isInstance) {
      instanceFieldsOptions = instanceFields.map((field) => ({ label: field.label, value: field.name, data: field }));
    }
    const isDisabled = operator === 'has_any_value';
    let inputView;
    if (api && (operator === 'is' || operator === 'is_not')) {
      inputView = (
        <AESelect
          id={columnName}
          key={columnName}
          selectType="asyncSelect"
          cacheOptions
          defaultOptions
          options={(inputValue, callback) =>
            this.debounceLoadOptionsForInputAttribute(
              inputValue,
              filterName,
              isInstance ? instanceFieldName : columnName,
              isInstance ? columnName : '',
              limit,
              callback,
            )
          }
          onChange={(e) =>
            this.handleOnChangeAttributeInputValue(e.value, attributeIndex, rowIndex, parentIndex, e.data)
          }
          menuShouldScrollIntoView={false}
          maxMenuHeight={150}
          value={{ label: columnValue || 'Type for search', value: columnValue || '' }}
        />
      );
    } else if (type === 'dropdown' && (operator === 'is' || operator === 'is_not')) {
      const options = enumValue && enumValue.map((e) => ({ label: this.getStringWithWhiteSpace(e), value: e }));
      inputView = (
        <AESelect
          options={options}
          value={columnValue}
          menuShouldScrollIntoView={false}
          onChange={(e) => this.handleOnChangeAttributeInputValue(e.value, attributeIndex, rowIndex, parentIndex)}
        />
      );
    } else if (type === 'numeric') {
      inputView = (
        <AEInputField
          placeHolder={t('common:Number')}
          type="Number"
          name="queryValue"
          bsSize="large"
          value={columnValue}
          onChange={(e) =>
            this.handleOnChangeAttributeInputValue(e.target.value, attributeIndex, rowIndex, parentIndex)
          }
          size="normal"
          onKeyPress={this.numberOnly}
        />
      );
    } else {
      inputView = (
        <AEInputField
          type="text"
          name="queryValue"
          bsSize="large"
          disabled={isDisabled}
          value={isDisabled ? '' : columnValue}
          onChange={(e) =>
            this.handleOnChangeAttributeInputValue(e.target.value, attributeIndex, rowIndex, parentIndex)
          }
          placeHolder={t('audience:Keyword')}
          size="normal"
        />
      );
    }
    return (
      <div className="mt-2">
        <div className="d-flex justify-content-between">
          <AELabel
            header={isInstance ? t(`attendeeDetails:${instance.label}`) : t(`attendeeDetails:${label}`)}
            variant="subtitle1"
            labelClass="m-0"
          />
          <div onClick={() => this.handleClickOnRemoveAttribute(attributeIndex, rowIndex, parentIndex)}>
            <span className="d-flex align-items-center attribute-btn btn btn-text-red">
              <AEIcon type="ac-icon-close" size="exSmall" className="mr-1" /> {t(`common:Remove`)}
            </span>
          </div>
        </div>
        <div className="d-flex justify-content-between mt-1">
          {isInstance && (
            <div className="mr-2 p-0 col-md-3 col-xs-3 col-sm-3 col-lg-3">
              <AESelect
                onChange={(e) => this.handleSelectOnInstanceFieldForAttribute(e, attributeIndex, rowIndex, parentIndex)}
                options={instanceFieldsOptions}
                value={instanceFieldName}
                menuShouldScrollIntoView={false}
              />
            </div>
          )}
          <div
            className={cx(
              'mr-2 p-0',
              isInstance ? 'col-md-3 col-xs-3 col-sm-3 col-lg-3' : 'col-md-4 col-xs-4 col-sm-4 col-lg-4',
            )}
          >
            <AESelect
              options={operatorOptions}
              value={operator}
              onChange={(e) => this.handleSelectOperatorForAttribute(e, attributeIndex, rowIndex, parentIndex)}
              menuShouldScrollIntoView={false}
            />
          </div>
          <div
            className={cx(
              'm-0 p-0',
              isInstance ? 'col-md-6 col-xs-6 col-sm-6 col-lg-6' : 'col-md-8 col-xs-8 col-sm-8 col-lg-8',
            )}
          >
            {inputView}
          </div>
        </div>
      </div>
    );
  };

  renderFilterFieldCard = (index, conditionForFilter, indexOfParent) => {
    const { condition, columnOperators, filterData, columnData, status, filterName, instanceFields, attributes } =
      conditionForFilter || {};
    const { t } = this.props;
    const { columnName, columnValue, operator, isInstance, instanceFieldName, attribute } = condition || {};
    const fieldDataGroupWise = filterData.columns.map((column) => ({
      label: t(`audience:${column.label}`),
      options: column.values.map((v) => {
        const { fieldType, instanceColumns } = v;
        const { instance } = filterData || {};
        let data;
        if (fieldType === 'instance') {
          data = {
            instanceFields: instance && instance[instanceColumns],
            instance: v,
          };
        } else {
          data = {
            fieldData: v,
          };
        }
        data.searchableLabel = v.label;
        return {
          label: (
            <div className="d-flex align-items-center">
              {this.renderSvgIcon(v.name)}
              <span className="ml-2">{t(`attendeeDetails:${v.label}`)}</span>
            </div>
          ),
          value: v.name,
          ...data,
        };
      }),
    }));
    const operatorOptions =
      size(columnOperators) > 0 &&
      columnOperators.map((op) => ({ label: t(`audience:${this.getStringWithWhiteSpace(op)}`), value: op }));
    let allAttributeSelected;
    if (size(attributes) > 0) {
      allAttributeSelected = attributes.every((attribute) => attribute.isSelected);
    }
    return (
      <>
        {this.getVerticalLine()}
        <div className="p-2 border-div-box">
          <AELabel header={t(`audience:${filterData.label}`)} variant="subtitle1" className="my-2" />
          <Row className="m-0 p-0">
            {this.renderFieldSelectBox(fieldDataGroupWise, columnName, index, indexOfParent)}
          </Row>
          <div className="d-flex justify-content-between mt-2">
            {isInstance && (
              <div className="mr-2 p-0 col-sm-3 col-md-3 col-xs-3 col-lg-3">
                {this.renderSelectBoxForInstanceField(instanceFields, instanceFieldName, index, indexOfParent)}
              </div>
            )}
            <div
              className={cx(
                'p-0 mr-2',
                isInstance ? 'col-sm-3 col-md-3 col-xs-3 col-lg-3' : 'col-sm-4 col-md-4 col-xs-4 col-lg-4',
              )}
            >
              {this.renderSelectBox(operatorOptions, operator, index, indexOfParent)}
            </div>
            <div
              className={cx(
                'p-0 m-0',
                isInstance ? 'col-sm-6 col-md-6 col-xs-6 col-lg-6' : 'col-sm-8 col-md-8 col-xs-8 col-lg-8',
              )}
            >
              {this.renderInputBox(
                columnValue,
                columnData,
                operator,
                filterName,
                isInstance ? instanceFieldName : columnName,
                isInstance ? columnName : '',
                index,
                indexOfParent,
              )}
            </div>
          </div>
          {size(attribute) > 0 &&
            attribute.map((attr, attributeIndex) =>
              this.renderInputForAttribute(attr, filterName, attributeIndex, index, indexOfParent),
            )}
          {size(attributes) > 0 && (
            <DropdownButton
              className="attribute-btn mt-2"
              disabled={allAttributeSelected}
              title={
                <span className="d-flex align-items-center btn-background-prime">
                  <AEIcon type="virtual-icon-add" size="exSmall" className="mr-2" /> {t('audience:Attribute')}
                </span>
              }
              noCaret
            >
              {attributes.map((attr, attrIndex) => {
                if (attr.isSelected) {
                  return <></>;
                }
                return (
                  <MenuItem
                    eventKey={attrIndex}
                    onClick={() => this.handleSelectOnAttribute(attr, filterData, index, indexOfParent)}
                  >
                    {t(`attendeeDetails:${attr.label}`)}
                  </MenuItem>
                );
              })}
            </DropdownButton>
          )}
          {this.renderButtonForSaveAndCancel(this.isValidQuery(conditionForFilter), index, status, indexOfParent)}
        </div>
      </>
    );
  };

  showCreateGroupButton = (indexOfParent) => {
    if (indexOfParent) {
      const parentArray = indexOfParent.split('_');
      const parentIndexArray = parentArray.filter((el) => !isNaN(parseFloat(el)) && isFinite(el));
      return !(parentIndexArray.length > 1);
    }
    return true;
  };

  renderSavedQueryCard = (conditionForFilter, index, indexOfParent) => {
    const { columnData, condition, instance } = conditionForFilter || {};
    const { t } = this.props;
    const { operator, columnValue, columnName, isInstance, attribute } = condition;
    const { label, type, operator: operatorFromColumnData, api } = columnData || {};
    let value = columnValue || '';
    if (!api && operatorFromColumnData === 'enum' && type === 'dropdown') {
      value = t(`audience:${this.getStringWithWhiteSpace(columnValue)}`);
    }
    const displayGroupbutton = this.showCreateGroupButton(indexOfParent);
    let { parentIndex } = conditionForFilter || {};
    parentIndex = (condition && condition.parentIndex) || parentIndex || indexOfParent;
    return (
      <>
        {this.getVerticalLine()}
        <div
          className="card-saved-query d-flex align-items-center p-2"
          onClick={() => this.handleClickOnEditQuery(index, parentIndex)}
        >
          {this.renderSvgIcon(columnName)}
          <div className="mx-2 mr-auto query-width">
            <AELabel
              header={`${isInstance ? t(`attendeeDetails:${instance.label}`) : ''} ${t(`attendeeDetails:${label}`)} ${t(
                `audience:${this.getStringWithWhiteSpace(operator)}`,
              )} "${value}"`}
              className="d-md-inline-block mx-1"
              variant="subtitle1"
              labelClass="custom-label"
            />
            {size(attribute) > 0 &&
              attribute.map((attr) => {
                const { operator, columnValue, isInstance, columnData, instance } = attr;
                const { label, type, operator: operatorFromColumnData, api } = columnData || {};
                let attributeValue = columnValue || '';
                if (!api && operatorFromColumnData === 'enum' && type === 'dropdown') {
                  attributeValue = this.getStringWithWhiteSpace(columnValue);
                }
                return (
                  <>
                    <AEBadge variant="secondary" size="small" className="m-0 operator-badge">
                      {t('common:And')}
                    </AEBadge>
                    <AELabel
                      header={`${isInstance ? t(`attendeeDetails:${instance.label}`) : ''} ${t(
                        `attendeeDetails:${label}`,
                      )} ${t(`audience:${this.getStringWithWhiteSpace(operator)}`)} "${attributeValue}"`}
                      className="d-md-inline-block mx-1"
                      variant="subtitle1"
                      labelClass="custom-label"
                    />
                  </>
                );
              })}
          </div>

          <div className="query-view-button svg-height">
            {displayGroupbutton ? (
              <AETooltip tooltip={t('audience:Add to Create Group')} overlayProps={{ placement: 'top' }}>
                <AEIcon
                  className="m-r-5"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  svgIcon={'ac-icon-add-to-group'}
                  onClick={(e) => this.handleClickOnAddToGroupQuery(e, index, parentIndex)}
                  size="exSmall"
                />
              </AETooltip>
            ) : (
              <></>
            )}
            <AETooltip tooltip={t('common:Delete')} overlayProps={{ placement: 'top' }}>
              <AEIcon
                type="ac-icon-bin"
                size="exSmall"
                onClick={(e) => this.handleClickOnCancelQuery(e, index, parentIndex, true)}
              />
            </AETooltip>
          </div>
        </div>
      </>
    );
  };

  createFilter = () => {
    const { savedSegment, isEditing } = this.props;
    const { filter, rangeDate, updatedName } = this.state;
    const { data: filterToUpdate } = savedSegment || {};
    const segment = JSON.parse(JSON.stringify(filter));
    let startDate = '';
    let endDate = '';
    if (segment.conditions && Array.isArray(segment.conditions) && segment.conditions.length > 0) {
      if (rangeDate !== 'Any Time') {
        const dates = rangeDate.split('>');
        startDate = dates[0];
        endDate = dates[1];
      }
      segment.date = {
        startDate,
        endDate,
        format: this.dateFormat,
      };
      segment.conditions = segment.conditions.filter((el) => Object.keys(el).length);
      segment.conditions = segment.conditions.filter((_, index) => index !== segment.conditions.length - 1);
      segment.conditions = segment.conditions.map((condition) => {
        const { type } = condition;
        if (type === 'group') {
          delete condition.parentIndex;
          return this.setDataForCreateFilterByGroupType(condition);
        }
        return this.setDataForCreateFilterBySingleType(condition);
      });
      if (isEditing && filterToUpdate && filterToUpdate.id) {
        filterToUpdate.name = updatedName;
        filterToUpdate.filterJson = JSON.stringify(segment);
        return this.props.handleOnSaveSegment(filterToUpdate);
      }
      return this.props.handleOnSaveSegment({ filterJson: JSON.stringify(segment) });
    }
    return [];
  };

  setDataForCreateFilterByGroupType = (filter) => {
    filter.conditions = filter.conditions.filter((el) => Object.keys(el).length);
    filter.conditions = filter.conditions.filter((_, index) => index !== filter.conditions.length - 1);
    filter.conditions = filter.conditions.map((condition) => {
      const { type } = condition;
      if (type === 'group') {
        delete condition.parentIndex;
        return this.setDataForCreateFilterByGroupType(condition);
      }
      return this.setDataForCreateFilterBySingleType(condition);
    });
    return filter;
  };

  setDataForCreateFilterBySingleType = (condition) => {
    const { condition: conditionObj } = condition || {};
    if (!isEmpty(condition) && condition.status !== this.statusEnum.INITIAL && conditionObj) {
      conditionObj.operator = conditionObj.operator && conditionObj.operator.toUpperCase();
      const { isInstance, instanceFieldName, columnName, attribute, columnValue, mappedValue } = conditionObj || {};
      delete conditionObj.mappingKey;
      delete conditionObj.mappingDataType;
      delete conditionObj.instanceFieldName;
      if (isInstance) {
        conditionObj.columnName = instanceFieldName;
        conditionObj.instanceName = columnName;
      } else {
        delete conditionObj.instanceName;
      }
      if (attribute && size(attribute) === 0) {
        delete conditionObj.attribute;
      }
      if (size(attribute) > 0) {
        const updatedAttribute = attribute.map((attr) => {
          const {
            instanceFieldName: instanceFieldNameForAttr,
            columnValue: columnValueForAttr,
            dataType: dataTypeForAttr,
            mappedValue: mappedValueForAttr,
            columnData: columnDataForAttr,
            columnName: instanceNameForAttribute,
          } = attr || {};
          const { name: columnNameForAttr, mappingKey, mappingDataType } = columnDataForAttr || {};
          delete attr.columnData;
          delete attr.columnOperators;
          delete attr.instance;
          delete attr.instanceFields;
          delete attr.instanceFieldName;
          attr.operator = attr.operator && attr.operator.toUpperCase();
          if (attr.isInstance) {
            attr.instanceName = instanceNameForAttribute;
            attr.columnName = instanceFieldNameForAttr;
          } else {
            delete attr.instanceName;
          }
          if (mappingKey && mappingDataType) {
            attr.columnName = mappingKey;
            attr.mappingKey = columnNameForAttr;
            attr.dataType = mappingDataType;
            attr.mappingDataType = dataTypeForAttr;
            attr.columnValue = mappedValueForAttr;
            attr.mappedValue = columnValueForAttr;
          } else {
            delete attr.mappingKey;
            delete attr.mappingDataType;
            delete attr.mappedValue;
          }
          return attr;
        });
        conditionObj.attribute = updatedAttribute;
      }
      const {
        mappingKey,
        mappingDataType,
        name: columnNameForMapping,
        dataType: columnDataTypeForMapping,
      } = condition.columnData;
      if (mappingKey && mappingDataType) {
        conditionObj.columnName = mappingKey;
        conditionObj.dataType = mappingDataType;
        conditionObj.mappingKey = columnNameForMapping;
        conditionObj.mappingDataType = columnDataTypeForMapping;
        conditionObj.mappedValue = columnValue;
        conditionObj.columnValue = mappedValue;
      } else {
        delete conditionObj.mappingKey;
        delete conditionObj.mappingDataType;
        delete conditionObj.mappedValue;
      }
      delete condition.status;
      delete condition.parentIndex;
      delete condition.columnData;
      delete condition.filterData;
      delete condition.columnOperators;
      delete condition.edited;
      delete condition.instance;
      delete condition.instanceFields;
      delete condition.attributes;
      condition.condition = conditionObj;
      return condition;
    }
    return {};
  };

  validateConditions = (filter, originalIndex) => {
    const { conditions, type, status } = filter || {};
    if (type === 'group') {
      return conditions.every((condition, index) => this.validateConditions(condition, index));
    }
    if (status) {
      return status === this.statusEnum.SAVED || (originalIndex !== 0 && status === this.statusEnum.INITIAL);
    }
    return true;
  };

  render() {
    const { selectedDateRange, showDatePicker, rangeDate, filter, showInputBoxForPopupTitle } = this.state;
    const { conditions } = filter || {};
    const { showSegmentForm, t, i18n } = this.props;
    const isValidAll =
      conditions &&
      conditions.every((condition, index) => this.validateConditions(condition, index)) &&
      !showInputBoxForPopupTitle;
    return (
      <AESlidePopup
        key="segment-form"
        toggle={showSegmentForm}
        isShowTitle={false}
        headerData={this.renderTitleOfPopup()}
        className="header-data-container"
        isShowCloseBtn={false}
        onClick={() => this.props.handleSegmentClose(false)}
        isShowOverlay
      >
        <div id="segment-form" className="add-scrollbar-edit-item addon-setup-row segment-filter-form">
          <Row className="border-bottom-line">
            <Col sm={4}>{this.renderGroupFilter(filter)}</Col>
            <Col sm={7}>
              <AEButton
                id="range-date-picker-btn"
                name="range-date-picker-btn"
                label={t(`audience:${rangeDate}`)}
                variant="secondary"
                size="medium"
                className="full-width"
                onClick={() => this.setState({ showDatePicker: true })}
                isNextIcon
                icon="drop-down-arrow ac-icon-arrow-down-xs ml-auto"
              />
              <Overlay
                id="date-picker-overlay"
                show={showDatePicker}
                onHide={() => this.setState({ showDatePicker: false })}
                placement="bottom"
                container={this}
                rootClose
              >
                <div className="date-picker-overlay-position">
                  <div className="customDatePickerWidth">
                    {/* TODO: minDate confirmation required  */}
                    <DateRangePicker
                      maxDate={new Date()}
                      locale={locales[i18n?.language]}
                      onChange={(item) => this.handleDateChange(item)}
                      showSelectionPreview
                      moveRangeOnFirstSelection={false}
                      showDateDisplay={false}
                      inputRanges={[]}
                      staticRanges={this.defaultStaticRanges}
                      months={2}
                      ranges={selectedDateRange}
                      direction="horizontal"
                    />
                  </div>
                </div>
              </Overlay>
            </Col>
          </Row>
          {this.renderQueryCard(filter)}
          <div className={cx('col-md-12 col-xs-12 bottom-buttons p-15', 'flot-footer-buttons')}>
            <div className="text-center">
              <AEButton
                className="small"
                id="cancel_btn_filter_aud"
                variant="secondary"
                onClick={() => this.props.handleSegmentClose(false)}
                label={t('common:Cancel')}
              />
              <AEButton
                id="save_btn_filter_aud"
                className="btn-flat ml-5 small"
                disabled={!isValidAll}
                onClick={this.createFilter}
                label={t('common:Save')}
              />
            </div>
          </div>
        </div>
      </AESlidePopup>
    );
  }
}

const mapDispatchToProps = {};
const mapStateToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation(['audience', 'common'])(SegmentForm));
