import React from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button'; // Import the custom Button
import { useAccounts } from './AccountsProvider'; // Import useAccounts hook
import RoleSelector from '../components/RoleSelector';

const AccountsList = () => {
  const { accounts, activeAccount, switchAccount, addAccount } = useAccounts(); // Use the context API

  return (
    <div style={{ padding: '10px' }}>
      {/* Account Selection */}
      <Select
        value={activeAccount ? activeAccount.id : 'no-account'}
        onValueChange={switchAccount}
        id="account-select"
      >
        <SelectTrigger>
          <SelectValue placeholder="Select an account" />
        </SelectTrigger>
        <SelectContent>
          {accounts.length > 0 ? (
            accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-account" disabled>
              No accounts available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      
      {/* Button to Create New Account */}
      <div style={{ marginTop: '10px' }}>
        <Button
          variant="default"
          size="default"
          fullWidth
          onClick={addAccount}
        >
          Create Account
        </Button>
      </div>
      <RoleSelector/>
    </div>
  );
};

export default AccountsList;