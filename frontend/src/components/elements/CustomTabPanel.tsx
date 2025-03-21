import { ReactNode } from "react";

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

export function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ height: "85%" }}
    >
      {value === index && <>{children}</>}
    </div>
  );
}
