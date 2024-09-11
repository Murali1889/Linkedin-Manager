import React, { useState } from 'react';
import {
  TextField,
  Divider,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { HexColorPicker } from 'react-colorful';
import { database } from '../auth/firebaseConfig';
import { ref, set, push, get } from 'firebase/database';
import { useLabels } from '../auth/LabelsProvider';

// Predefined colors for easy selection
const colorOptions = [
    '#1B263B', // Dark Blue
    '#3C1874', // Purple
    '#4A4E69', // Slate Gray
    '#E63946', // Bright Red
    '#2A9D8F', // Teal
    '#F4A261', // Soft Orange
    '#E9C46A', // Mustard Yellow
    '#264653', // Dark Teal
    '#2B2D42', // Dark Slate Blue
    '#D62828', // Deep Red
    '#F77F00', // Vivid Orange
    '#118AB2', // Sky Blue
    '#06D6A0', // Mint Green
    '#073B4C', // Dark Cyan
    '#F4D35E', // Warm Yellow
    '#457B9D', // Steel Blue
    '#8D99AE', // Light Slate Gray
    '#BC4749', // Brick Red
    '#6A0572', // Dark Magenta
    '#83C5BE'  // Light Teal
  ];

const LabelSelector = ({ onClose, code, name }) => {
  const { headerLabels } = useLabels();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#ff0000');

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleLabelClick = async (label) => {
    try {
      const labelRef = ref(database, `labels/${label.name}`);
      const labelSnapshot = await get(labelRef);

      if (labelSnapshot.exists()) {
        const labelData = labelSnapshot.val();
        const codesArray = labelData.codes ? Object.values(labelData.codes) : [];

        if (!codesArray.some((item) => item.code === code)) {
          const newCodeRef = push(ref(database, `labels/${label.name}/codes`));
          await set(newCodeRef, { code, name });
          console.log('New code added:', { code, name });
        } else {
          console.log('Code already exists, not adding:', code);
        }
      }
    } catch (error) {
      console.error('Error adding code to label:', error);
    }
  };

  const handleCreateNewLabel = () => {
    setShowCreateDialog(true);
  };

  const handleSaveNewLabel = async () => {
    try {
      const labelRef = ref(database, `labels/${newLabelName}`);
      const labelSnapshot = await get(labelRef);

      if (labelSnapshot.exists()) {
        const labelData = labelSnapshot.val();

        if (labelData.color === newLabelColor) {
          const codesArray = labelData.codes ? Object.values(labelData.codes) : [];
          if (!codesArray.some((item) => item.code === code)) {
            const newCodeRef = push(ref(database, `labels/${newLabelName}/codes`));
            await set(newCodeRef, { code, name });
            console.log('New code added to existing label:', { code, name });
          } else {
            console.log('Code already exists in label.');
          }
        } else {
          console.log('Color mismatch for existing label.');
        }
      } else {
        const newLabelData = {
          color: newLabelColor,
          codes: {
            [push(ref(database, `labels/${newLabelName}/codes`)).key]: { code, name },
          },
        };

        await set(labelRef, newLabelData);
        console.log('New label created with color and code:', newLabelName, newLabelColor, { code, name });
      }

      setShowCreateDialog(false);
      setNewLabelName('');
      setNewLabelColor('#ff0000');
    } catch (error) {
      console.error('Error saving new label:', error);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col justify-center items-center" style={{ zIndex: 999 }}>
      <div className="relative p-4 bg-white rounded shadow-md w-74">
        {/* Close Button */}
        <IconButton onClick={onClose} style={{ position: 'absolute', top: 0, right: 8 }}>
          <CloseIcon />
        </IconButton>
        <div className="flex items-center">
          <span className="font-semibold">Select a Label:</span>
          <div className="ml-auto">
            <IconButton>
              <SearchIcon />
            </IconButton>
          </div>
        </div>
        <TextField
          variant="standard"
          placeholder="Search labels"
          fullWidth
          onChange={handleSearchChange}
          InputProps={{ disableUnderline: true }}
          className="mb-2"
        />

        {/* List of Header Labels */}
        <List>
          {headerLabels
            .filter((label) => label.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((label, index) => (
              <ListItem
                key={index}
                button
                onClick={() => handleLabelClick(label)}
                className="flex items-center"
              >
                <span
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: label.color }}
                ></span>
                <ListItemText primary={label.name} />
              </ListItem>
            ))}
        </List>

        <Divider />
        <div className="flex justify-between mt-2">
          <Button onClick={handleCreateNewLabel} color="primary">
            Create new
          </Button>
        </div>
      </div>

      {/* Create New Label Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
        <DialogTitle>Create New Label</DialogTitle>
        <DialogContent className="flex flex-col gap-4">
          <TextField
            label="Label Name"
            variant="outlined"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            required
            fullWidth
          />

          {/* Predefined Color Options */}
          <div className="flex flex-wrap gap-2 mt-2">
            {colorOptions.map((color) => (
              <div
                key={color}
                className={`cursor-pointer rounded-full border ${newLabelColor === color ? 'border-blue-500' : ''}`}
                style={{
                  backgroundColor: color,
                  width: '50px',
                  height: '50px',
                }}
                onClick={() => setNewLabelColor(color)}
              />
            ))}
          </div>

          <Divider>Or</Divider>

          {/* Custom Color Picker */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-700">Select Custom Color:</label>
            <HexColorPicker color={newLabelColor} onChange={setNewLabelColor} />
            <div className="mt-2">
              Selected Color:
              <span
                style={{
                  backgroundColor: newLabelColor,
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  marginLeft: '10px',
                  borderRadius: '50%',
                }}
              ></span>
            </div>
          </div> */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSaveNewLabel} color="primary" disabled={!newLabelName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default LabelSelector;
