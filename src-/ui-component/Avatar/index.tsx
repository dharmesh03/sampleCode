import {Avatar,Stack} from '@mui/material';


type AvtarProps = {
    src?:  string | undefined;
    width?:number;
    height?:number;
    TaskIcon?:any;
    backgroundColor?:string;
  };
export default function ImageAvatars(props:AvtarProps) {
  const { src,height,width,TaskIcon,backgroundColor} = props;    
  return (
    <Stack direction="row">
        <Avatar src={src} sx={{height:{height},width:{width},backgroundColor:{backgroundColor}}}>
          {TaskIcon}
          </Avatar>
    </Stack>
  );
}