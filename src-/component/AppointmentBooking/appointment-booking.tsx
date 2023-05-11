import { Avatar, IconButton, Modal } from "@mui/material";
import TextTG from "../../ui-component/TextTG/text-tg";
import CloseIcon from "@mui/icons-material/Close";
import locationIcon from "../../assets/icons/location.svg";
import timeIcon from "../../assets/icons/time.svg";
import React from "react";
import { CalendarPicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import './calendar.override.css'
import PrimaryButton from "../../ui-component/PrimaryButton/primary-button";
import SecondaryButton from "../../ui-component/SecondaryButton/secondary-button";

import advancedFormat from 'dayjs/plugin/advancedFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(advancedFormat);

const candidate = {
    name: 'John Doe',
    location: 'New York, USA',
    avatar: 'https://i.pravatar.cc/300',
}

const interview = {
    duration: 45,
}

const times = ["8:00 AM", "8:15 AM", "8:30 AM", "8:45 AM", "9:00 AM", "9:15 AM", "9:30 AM", "9:45 AM", "10:00 AM", "10:15 AM", "10:30 AM", "10:45 AM", "11:00 AM", "11:15 AM", "11:30 AM", "11:45 AM", "12:00 PM", "12:15 PM", "12:30 PM", "12:45 PM", "1:00 PM", "1:15 PM", "1:30 PM", "1:45 PM", "2:00 PM", "2:15 PM", "2:30 PM", "2:45 PM", "3:00 PM", "3:15 PM", "3:30 PM", "3:45 PM", "4:00 PM", "4:15 PM", "4:30 PM", "4:45 PM", "5:00 PM", "5:15 PM", "5:30 PM", "5:45 PM", "6:00 PM"];

function AppointmentBooking({isOpen, setIsOpen}: {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}) {
    const [selectedDate, setSelectedDate] = React.useState<any>(dayjs());
    const [selectedTime, setSelectedTime] = React.useState<any>(times[0]);
    return (
        <Modal
            open={isOpen}
            onClose={() => {
                setIsOpen(false)
            }}>
            <div className={'full-width full-height flex flex-align-center flex-center'}>
                <div className={'p-20 bg-white b-r-10 shadow min-width-500'}>
                    <div className={'flex flex-align-center flex-space-between m-b-10'}>
                        <TextTG type={'text'} bold={true}>Book Slot</TextTG>
                        <IconButton
                            aria-label="close"
                            onClick={() => setIsOpen(false)}
                            sx={{
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <CloseIcon/>
                        </IconButton>
                    </div>
                    <div className={'flex flex-align-center flex-space-between m-b-10'}>
                        <div className={'flex gap-10'}>
                            <Avatar
                                alt={candidate.name}
                                src={candidate.avatar}
                                sx={{width: 50, height: 50, textAlign: "center"}}
                            >
                                {!candidate.avatar && candidate.name}
                            </Avatar>
                            <div className={'flex flex-column'}>
                                <TextTG type={'text'} bold={true}>{candidate.name}</TextTG>
                                <div className={'flex gap-10'}>
                                    <img src={locationIcon} alt={'location-icon'}/>
                                    <TextTG type={'small-text'}>{candidate.location}</TextTG>
                                </div>
                            </div>
                        </div>
                        <div className={'flex gap-10'}>
                            <img src={timeIcon} alt={'time-icon'}/>
                            <TextTG type={'small-text'}>{interview.duration} Mins</TextTG>
                        </div>
                    </div>
                    <div className={'flex gap-10'}>
                        <div className={'flex flex-column gap-5 w-320'}>
                            <TextTG type={'text'}>Select Date</TextTG>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <CalendarPicker
                                    date={selectedDate}
                                    onChange={(date: any) => setSelectedDate(date)}
                                />
                            </LocalizationProvider>
                        </div>
                        <div className={'flex flex-column gap-5 w-180'}>
                            <TextTG type={'text'}>Select Time Slots</TextTG>
                            <div className={'flex flex-column gap-5 h-300 overflow-scroll'}>
                                {times.map((time, index) => {
                                    if (time === selectedTime) {
                                        return (
                                            <PrimaryButton key={index}
                                                           onClick={() => setSelectedTime(time)}>{time}</PrimaryButton>
                                        )
                                    } else {
                                        return (
                                            <SecondaryButton key={index}
                                                             onClick={() => setSelectedTime(time)}
                                                             isPrimary={true}>{time}</SecondaryButton>
                                        )
                                    }
                                })}
                            </div>
                        </div>
                    </div>
                    <div className={'m-t-10'}>
                        <TextTG type={'text'}>{selectedDate.format('dddd, MMM D')}</TextTG>
                        <TextTG type={'text'}>{selectedTime} {selectedDate.format('zzz')}</TextTG>
                    </div>
                    <div className={'m-t-20 flex gap-25 w-400'}>
                        <SecondaryButton onClick={() => setIsOpen(false)} isPrimary={true}>Confirm</SecondaryButton>
                        <SecondaryButton onClick={() => setIsOpen(false)} isGrey={true}>Cancel</SecondaryButton>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

export default AppointmentBooking;
