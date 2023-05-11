import IconButton from '@mui/material/IconButton';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import { useStyles } from "./FileUploadstyle"; 
import { Typography,Stack } from '@mui/material';
type FileUploadProps = {
    value?: number;
    handleChange?: string;
    title?:string;
    typography?:string;
  };

export default function FileUpload(props: FileUploadProps) {
  const { title,typography} = props;
    const classes = useStyles(props);
    return (
    <Stack className={classes.fileUpload}>
      <IconButton color="primary" aria-label="upload picture" component="label">
            <FileUploadOutlinedIcon sx={{color:"var(--color-primary)"}} />
            <input hidden accept="image/*" type="file" />
      </IconButton>
      <Typography className={classes.filetitle}>{title}</Typography>
      <Typography className={classes.filetypography}>{typography}</Typography>
    </Stack>
  );
}