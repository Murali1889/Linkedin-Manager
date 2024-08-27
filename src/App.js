import { Layout, Space } from 'antd';
import { ThemeProvider, createTheme} from '@mui/material';
import Main from './pages/Main';
const { Content } = Layout;
const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Layout>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Space direction="vertical" align="center" style={{ width: '100%', height: '100%' }}>
              <Main
              />
          </Space>
        </Content>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
