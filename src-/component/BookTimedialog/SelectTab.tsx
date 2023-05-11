
import Box from '@mui/material/Box';
import PrimaryButton from 'ui-component/PrimaryButton/primary-button';
import SecondaryButton from 'ui-component/SecondaryButton/secondary-button';

type timeTabs={
  timeSlot: { title: string }[]
  selectedTime:string;
  setSelectedTime:(select: string) => void;
}

export default function SelectTab(props:timeTabs) {
  const{selectedTime, setSelectedTime, timeSlot }=props

  return (
    <Box className={"flex flex-column w-full m-t-14"}
      sx={{
        gap:1,
        height:"310px",
        overflowY: 'scroll',
      }}
    >
      {timeSlot?.map((time, index:number) => {
        if (time.title === selectedTime) {
          return (
            <PrimaryButton key={index} onClick={() => setSelectedTime(time.title)}>
              {time.title}
            </PrimaryButton>
          );
        } else {
          return (
            <SecondaryButton
              key={index}
              onClick={() => setSelectedTime(time.title)}
              isPrimary={true}
            >
              {time.title}
            </SecondaryButton>
          );
        }
      })}
    </Box>
  );
}
