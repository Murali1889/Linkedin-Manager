import React, { useState } from 'react';
import { Button, Form as AntdForm, Input, notification } from 'antd';
import { useForm, FormProvider } from 'react-hook-form';
import axios from 'axios';
import { FormItem, FormLabel, FormControl, FormMessage } from "./components/ui/form";

const Login = ({ setAuthenticated }) => {
  const [buttonLoading, setButtonLoading] = useState(false);
  const [email, setEmail] = useState("");
  const methods = useForm();

  const handleFormSubmit = async () => {
    setButtonLoading(true);
    try {
      const response = await axios.post('https://hypertalent-server.onrender.com/send-auth-email', { email });
      setButtonLoading(false);
      notification.success({
        message: 'Success',
        description: 'The authentication email has been sent successfully!',
        style: {
          backgroundColor: '#f6ffed',
          borderColor: '#b7eb8f',
          color: '#52c41a',
        },
      });
    } catch (error) {
      setButtonLoading(false);
      notification.error({
        message: 'Error',
        description: 'Something went wrong, please try again.',
        style: {
          backgroundColor: '#fff1f0',
          borderColor: '#ffa39e',
          color: '#f5222d',
        },
      });
    }
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  return (
    <FormProvider {...methods}>
      <AntdForm layout="vertical" onFinish={methods.handleSubmit(handleFormSubmit)}>
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl asChild>
            <Input type="email" name="email" onChange={handleChange} required />
          </FormControl>
          <FormMessage />
        </FormItem>
        <Button
          type="primary"
          htmlType="submit"
          style={{ width: '100%' }}
          loading={buttonLoading}
        >
          Login
        </Button>
      </AntdForm>
    </FormProvider>
  );
};

export default Login;
