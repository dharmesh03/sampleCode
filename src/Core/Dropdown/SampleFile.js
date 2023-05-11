import React from 'react';
import { map } from 'lodash';
import './Dropdown.scss';
import AEMenuItem from './MenuItem';
import DropdownButton from './Dropdown';

const DropdownGroup = ({ title, items, icon, isFilter }) => {
  const renderFilterLinks = (options) =>
    map(options, (option, key) => (
      <div className="ae-option-label" htmlFor={`filterCheck-${option.id}`}>
        <label className="checkbox-inline" key={key}>
          <input type="checkbox" name={`filterCheck-${option.id}`} id={`filterCheck-${option.id}`} />
          {option.text}
        </label>
        {option.count && <span className="badge primary pull-right">{option.count}</span>}
      </div>
    ));
  return (
    <div id="ae-dropdown">
      <DropdownButton icon={icon} title={title}>
        {isFilter
          ? map(items, (item, index) => (
              <div key={index}>
                <div className="ae-filter-heading">{item.title}</div>
                {renderFilterLinks(item.sub)}
              </div>
            ))
          : map(items, (item, index) => (
              <AEMenuItem className="ae-option-label" key={{ index }} eventKey={index.key}>
                {item.icon && <i className={item.icon} aria-hidden="true" />}
                <span>{item.title}</span>
              </AEMenuItem>
            ))}
      </DropdownButton>
    </div>
  );
};

export default DropdownGroup;
