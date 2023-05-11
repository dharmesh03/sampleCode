import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { Dayjs } from 'dayjs';

interface datePickerTabs {
  value:Dayjs | null;
  setValue:React.Dispatch<React.SetStateAction<Dayjs | null>>;
}

export default function DatePicker(props:datePickerTabs) {
  const {value,setValue} = props

  return (
   <Box sx={{"& .PrivatePickersYear-root":{background:"#FFFFFF"},
   "& .MuiPickersDay-root:focus":{background:"#00abd81a"},
   "& .MuiPickersDay-root:hover":{background:"#00abd81a"},
   "& .MuiPickersCalendarHeader-label" :{fontWeight:600},
   "& .PrivatePickersYear-yearButton:hover":{background:"#00abd81a"},
   "& .Mui-selected":{backgroundColor:"var(--color-primary) !important"},"& .MuiIconButton-root":{color:"var(--color-primary)"},"& .MuiIconButton-root:hover":{background:"#00abd81a"},"& .MuiPickersCalendarHeader-switchViewIcon":{display:"none"}}}>
     <LocalizationProvider dateAdapter={AdapterDayjs}>
      <StaticDatePicker
        displayStaticWrapperAs="desktop"
        openTo="year"
        value={value}
        onChange={(newValue) => {
          setValue(newValue);
        }}
        dayOfWeekFormatter={(day) => `${day}.`}
        renderInput={(params) => <TextField {...params} />}
        // showToolbar
      />
    </LocalizationProvider>
   </Box>
  );
}