import React from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";
import { useRenderData } from "streamlit-component-lib-react-hooks";

interface ThemeProviderProps {
  children: React.ReactNode;
}
const ThemeProvider: React.VFC<ThemeProviderProps> = (props) => {
  const { theme: stTheme } = useRenderData();

  if (stTheme == null) {
    return <>props.children</>;
  }

  const muiTheme = createTheme({
    palette: {
      primary: {
        main: stTheme.primaryColor,
      },
      background: {
        default: stTheme.backgroundColor,
        paper: stTheme.secondaryBackgroundColor,
      },
      text: {
        primary: stTheme.textColor,
      },
    },
    typography: {
      fontFamily: stTheme.font,
    },
  });

  return <MuiThemeProvider theme={muiTheme}>{props.children}</MuiThemeProvider>;
};

export default ThemeProvider;
