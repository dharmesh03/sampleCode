import React from 'react';
import DropdownGroup from './SampleFile';
import { text } from '@storybook/addon-knobs';

export default { title: 'DropDown' };
const ListItems = [
  {
    id: 1,
    title: 'Item 1',
    icon: 'fa fa-file-pdf-o',
    count: 5,
  },
  {
    id: 2,
    title: 'Item 2',
    icon: 'fa fa-file-word-o',
  },
  {
    id: 3,
    title: 'Item 3',
    icon: 'fa fa-file-excel-o',
    count: 13,
  },
];

export const dropdown = () => {
  text('Text', 'Click to select!');
  const ButtonName = 'Dropdown Button';
  return <DropdownGroup title={ButtonName} items={ListItems} />;
};
export const dropdownWithIcon = () => {
  text('Text', 'Click to select!');
  const ButtonName = 'Dropdown with Icon';
  return <DropdownGroup title={ButtonName} items={ListItems} icon="fa fa-download" />;
};
export const dropdownWithFilter = () => {
  text('Text', 'Clink on it to filter');
  const ButtonName = 'Dropdown with Filter';
  const newList = [
    {
      title: 'abc',
      sub: [
        { id: 1, text: 'Item 1', icon: 'fa fa-file-pdf-o', count: 5 },
        { id: 2, text: 'Item 2', icon: 'fa fa-file-pdf-o', count: 50 },
      ],
    },
    {
      title: 'list 2',
      sub: [
        {
          id: 1,
          text: 'Item 2',
          icon: 'fa fa-file-word-o',
          count: 50,
        },
        {
          id: 2,
          text: 'Item 2',
          icon: 'fa fa-file-word-o',
          count: 50,
        },
      ],
    },
    {
      title: 'list 2',
      sub: [
        {
          id: 3,
          text: 'Item 3',
          icon: 'fa fa-file-excel-o',
          count: 13,
        },
      ],
    },
  ];
  return <DropdownGroup title={ButtonName} items={newList} isFilter />;
};
