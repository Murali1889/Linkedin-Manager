import React, { useState, useEffect } from "react";
import Navbar from "../Navbar";
import BrowserViews from "./BrowserViews";
import { Typography } from 'antd';
import { LinkedinOutlined } from '@ant-design/icons';

const Main = () => {
  const [accounts, setAccounts] = useState([]);
  const [visibleAccountId, setVisibleAccountId] = useState(null);
  const [profileName, setProfileName] = useState(false)
  useEffect(() => {
    const fetchData = async () => {
      const loadedAccounts = await window.electron.loadAccounts();
      console.log(loadedAccounts);
      setAccounts(loadedAccounts);
      if (loadedAccounts.length > 0) {
        setVisibleAccountId(loadedAccounts[0].id);
      }
    };

    fetchData();
    console.log('fetcing accounts')
  }, [profileName]);

  return (
    <div style={{ height: "100%", display: "flex", width: "100%", backgroundColor:"#ffffff" }}>
      <Navbar
        setAccounts={setAccounts}
        setVisibleAccountId={setVisibleAccountId}
        currentViewIndex={visibleAccountId}
        accounts={accounts}
      />
      {accounts && accounts.length > 0 ? (
          <BrowserViews
            accounts={accounts}
            visibleAccountId={visibleAccountId}
            setAccounts={setAccounts}
            setProfileName={setProfileName}
          />

      ) : (
        <div style={{ margin: "auto", textAlign: "center", color: "#8c8c8c" }}>
          <LinkedinOutlined style={{ fontSize: '64px', color: '#1890ff' }} />
          <Typography.Title level={4} style={{ color: '#1890ff', marginTop: '16px' }}>
            You haven't added any LinkedIn accounts yet.
          </Typography.Title>
          <Typography.Text>
            Please use the "Create Account" button in the navigation bar to add a LinkedIn account.
          </Typography.Text>
        </div>
      )}
    </div>
  );
};

export default Main;
