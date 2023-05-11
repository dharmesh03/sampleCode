// @ts-nocheck

import * as React from "react";
import { useStyles } from "../../ui-component/ProfileTabs/Tabstyles.tsx";
import { Card, CardHeader, Grid,Box,Typography,Tab,Tabs } from "@mui/material";
import ImageAvatars from "ui-component/Avatar";
import Label from "ui-component/Label";

interface TabPanelProps {
  children?: React.ReactNode;
  index?: number;
  value?: number;
}

const CardItem = [
  {
    title: "I need a UI/UX developer",
    subheader: "Need website design and development...",
    color: "var(--color-light-purple )",
  },
  {
    title: "I need a UI/UX developer",
    subheader: "Need website design and development...",
    color: "var(--color-light-primary )",
  },
  {
    title: "I need a UI/UX developer",
    subheader: "Need website design and development...",
    color: "var(--color-light-green )",
  },
  {
    title: "I need a UI/UX developer",
    subheader: "Need website design and development...",
    color: "var(--color-light-orange )",
  },
];

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function BasicTabs(props) {
  const [value, setValue] = React.useState(0);
  const classes = useStyles(props);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
          className={classes.Tabstyle}
        >
          <Tab
            label="Top Jobs"
            {...a11yProps(0)}
            sx={{
              minHeight: 0,
              fontSize: "16px",
              lineHeight: "48px",
              fontWeight: 600,
              padding: 0,
              marginX: 2,
            }}
          />
          <Tab
            label="Top Candidates"
            {...a11yProps(1)}
            sx={{
              minHeight: 0,
              fontSize: "16px",
              lineHeight: "48px",
              fontWeight: 600,
              padding: 0,
              marginX: 2,
            }}
          />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
      {CardItem.map((item) => (
        <Grid item>
          <Card
            sx={{
              borderRadius: "18px",
              background: "var(--color-white)",
              boxShadow: "none !important",
              my:2,
            }}
          >
            <CardHeader
              sx={{ padding: "22px"}}
              avatar={
                <ImageAvatars
                  backgroundColor={item.color}
                  height={72}
                  width={72}
                  TaskIcon
                />
              }
              title={
                <Label
                  header={item.title}
                  labelClassName="ae-subtitle2"
                  styles={{ color: "var(--color-secondary1)" }}
                 
                />
              }
              subheader={
                <Label header={item.subheader} labelClassName="ae-subtitle3" styles={{color:"var(--color-secondary1)"}}  className="p-t-8"/>
              }
            />
          </Card>
        </Grid>
      ))}
      </TabPanel>
      <TabPanel value={value} index={1}>
        Top Candidates
      </TabPanel>
    </Box>
  );
}
