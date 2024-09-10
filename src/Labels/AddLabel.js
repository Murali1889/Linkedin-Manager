// AddLabel.js
import React, { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material"; // Import MUI components
import TagIcon from "@mui/icons-material/Label"; // Import a tag icon from MUI for label representation
import LabelSelector from "./LabelSelector";

const AddLabel = () => {
  const [showForm, setShowForm] = useState(false);
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState("#000000"); // Default color black
  const [accountId, setAccountId] = useState("");
  const [code, setCode] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [labels, setLabels] = useState([
    { name: "Paid", color: "#FF5733" },
    { name: "Work", color: "#75FF33" },
    { name: "Friends & Family", color: "#FFBD33" },
    { name: "Pending payment", color: "#8A33FF" },
    { name: "Order complete", color: "#FFC300" },
  ]); // Example label data

  // Define a set of 10 colors to choose from
  const predefinedColors = [
    "#FF5733", // Red
    "#FFBD33", // Yellow
    "#75FF33", // Green
    "#33FFBD", // Cyan
    "#3375FF", // Blue
    "#8A33FF", // Purple
    "#FF33A6", // Pink
    "#FFC300", // Orange
    "#28B463", // Emerald
    "#D35400", // Dark Orange
  ];

  const onClose = ()=>{
    setShowForm(false)
  }
  useEffect(() => {
    window.electron.onAddLabel((data) => {
      const { code, id } = data;
      setAccountId(id);
      setCode(code);
      setShowForm(true);
    });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!labelName.trim()) {
      alert("Please enter a label name.");
      return;
    }
    console.log("Label Details:", {
      accountId,
      code,
      labelName,
      labelColor,
    });
    setLabels([...labels, { name: labelName, color: labelColor }]);
    setLabelName("");
    setLabelColor("#000000");
    setShowForm(false);
  };

  // Filtered labels based on search term
  const filteredLabels = labels.filter((label) =>
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {showForm && <LabelSelector onClose={onClose}/>}
    </>
  );
};

export default AddLabel;
