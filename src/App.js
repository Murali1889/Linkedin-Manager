import { Layout, Space, Spin } from "antd"; // Import Spin for loading indicator
import { ThemeProvider, createTheme } from "@mui/material";
import { ProfileProvider } from "./auth/ProfileProvider";
import 'semantic-ui-css/semantic.min.css'
import Main from "./Main";
import { useEffect, useState } from "react";
import { AccountsProvider } from "./Linkedin/AccountsProvider";
import { SheetsProvider } from "./Sheets/SheetsProvider";

const { Content } = Layout;
const theme = createTheme();
function App() {

  return (
    <ThemeProvider theme={theme}>
      <AccountsProvider>
        <ProfileProvider>
            <SheetsProvider>
              <Layout>
                <Content
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                  }}
                >
                  <Main />
                </Content>
              </Layout>
            </SheetsProvider>
        </ProfileProvider>
      </AccountsProvider>
    </ThemeProvider>
  );
}

export default App;
