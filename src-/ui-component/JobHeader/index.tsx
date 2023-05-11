import CardHeader from "@mui/material/CardHeader";
import Label from "ui-component/Label";
import location from "../../assets/icons/location.svg";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ImageAvatars from "ui-component/Avatar";

interface cardHeader {
  Item: {
    title?: string,
    icon?:string,
    Subtitle?:string
  }
}

export default function JobHeader(props: cardHeader) {
  const { Item } = props;
  return (
    <>
      <CardHeader
      sx={{paddingX:"0 !important",paddingBottom:"0"}}
        avatar={
          Item.icon && (
            <ImageAvatars
              backgroundColor="var(--color-light-grey1)"
              height={72}
              width={72}
              TaskIcon={<img alt="" src={Item.icon} />}
            />
          )
        }
        title={
          <Label
            header={Item.title}
            labelClassName="ae-body2"
            styles={{ color: "var(--color-secondary1)" }}
          />
        }
        action={
          <div>
            <MoreVertIcon />
          </div>
        }
        subheader={
          <>
            <Label
              header={
                <span>
                  Denver, United States –{" "}
                  <span style={{ color: "var(--color-Sec-Grey)" }}>
                    11:40 am local time
                  </span>
                </span>
              }
              labelClassName="ae-captions"
              styles={{ color: "var(--color-light-secondary)" }}
              icon={
                <img
                  src={location}
                  alt=""
                  style={{ paddingRight: "6px", width: 8 }}
                />
              }
            />
            <Label
              header={Item.Subtitle}
              styles={{ color: "var(--color-secondary1)" }}
              labelClassName="ae-subtitle2"
            />
          </>
        }
      />
    </>
  );
}
