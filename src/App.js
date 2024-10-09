import { Layout, Space, Spin } from "antd"; // Import Spin for loading indicator
import { ThemeProvider, createTheme } from "@mui/material";
import { ProfileProvider } from "./auth/ProfileProvider";
import 'semantic-ui-css/semantic.min.css'
import Main from "./Main";
import { useEffect, useState } from "react";
import { AccountsProvider } from "./Linkedin/AccountsProvider";
import { LabelsProvider } from "./auth/LabelsProvider";
import { ShortcutProvider } from "./auth/ShortcutProvider";
import AccordionList from "./components/shortcuts/AccordionList";
import { SheetsProvider } from "./auth/SheetsProvider";
import { RoleProvider } from "./auth/RoleProvider";
import TalentForm from "./Role/TalentForm";

const { Content } = Layout;
const theme = createTheme();
function App() {

  return (
    <ThemeProvider theme={theme}>
      <AccountsProvider>
        <SheetsProvider>
        <ProfileProvider>
          <ShortcutProvider>
            <SheetsProvider>
              <RoleProvider>
              <LabelsProvider>
                <Layout>
                  <Content
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100vh",
                      flexDirection: 'column',
                    }}
                  >
                    <Main />
                    <TalentForm/>
                  </Content>
                  <AccordionList/>
                  
                </Layout>
              </LabelsProvider>
              </RoleProvider>
            </SheetsProvider>
          </ShortcutProvider>
        </ProfileProvider>
        </SheetsProvider>
      </AccountsProvider>
    </ThemeProvider>


  );
}

export default App;
