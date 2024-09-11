// AddLabel.js
import React, { useState, useEffect } from "react";
import LabelSelector from "./LabelSelector";

const AddLabel = () => {
  const [showForm, setShowForm] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [name, setName] = useState("")
  const [code, setCode] = useState("");




  const onClose = ()=>{
    setShowForm(false)
  }
  useEffect(() => {
    window.electron.onAddLabel((data) => {
      const { code, id, name} = data;
      setAccountId(id);
      setCode(code);
      setName(name)
      setShowForm(true);
    });
  }, []);

  return (
    <>
      {showForm && <LabelSelector onClose={onClose} code={code} name={name}/>}
    </>
  );
};

export default AddLabel;
