import {Card,Grid,CardHeader} from "@mui/material";
import ImageAvatars from "ui-component/Avatar";
import jobs from "../../assets/icons/jobs.svg";
import applicants from "../../assets/icons/applicants.svg";
import Candidate from "../../assets/icons/candidate.svg";
import Interviews from "../../assets/icons/interview.svg";
import Label from "ui-component/Label";

const CardItem = [
  {
    title: "Open Jobs",
    subheader: "4500",
    taskIcon: <img alt="" src={jobs} />,
    color: "var(--color-light-purple )",
  },
  {
    title: "Applicants",
    subheader: "45k",
    taskIcon: <img alt="" src={applicants} />,
    color: "var(--color-light-primary )",
  },
  {
    title: "Candidate Sourced",
    subheader: "51k",
    taskIcon: <img alt="" src={Candidate} />,
    color: "var(--color-light-green )",
  },
  {
    title: "Interviews",
    subheader: "2100",
    taskIcon: <img alt="" src={Interviews} />,
    color: "var(--color-light-orange )",
  },
];

export default function BasicCard() {
  return (
    <Grid
      container
      spacing={{ xs: 2, md: 3 }}
      columns={{ xs: 4, sm: 8, md: 12 }}
      sx={{ py: 3 }}
    >
      {CardItem.map((item) => (
        <Grid item xs={2} sm={4} md={3}>
          <Card
            sx={{
              borderRadius: "18px",
              background: "var(--color-white)",
              boxShadow: "none !important",
            }}
          >
            <CardHeader
              sx={{ padding: "32px" }}
              avatar={
                <ImageAvatars
                  backgroundColor={item.color}
                  height={80}
                  width={80}
                  TaskIcon={item.taskIcon}
                />
              }
              title={
                <Label
                  header={item.title}
                  labelClassName="ae-subtitle2"
                  styles={{ color: "var(--color-Sec-Grey)" }}
                />
              }
              subheader={
                <Label header={item.subheader} labelClassName="ae-heading1" />
              }
            />
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
