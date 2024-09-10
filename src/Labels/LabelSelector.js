import React, { useState } from 'react';
import {
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close'; // Import the CloseIcon
import { HexColorPicker } from 'react-colorful';

const LabelSelector = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [labels, setLabels] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#ff0000'); // Default color

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleLabelClick = (label) => {
    if (selectedLabels.includes(label)) {
      setSelectedLabels(selectedLabels.filter((item) => item !== label));
    } else {
      setSelectedLabels([...selectedLabels, label]);
    }
  };

  const handleCreateNewLabel = () => {
    setShowCreateDialog(true);
  };

  const handleSaveNewLabel = () => {
    setLabels([...labels, newLabelName]);
    setSelectedLabels([...selectedLabels, newLabelName]);
    setShowCreateDialog(false);
    setNewLabelName('');
    setNewLabelColor('#ff0000');
  };

  return (
    <div className="fixed inset-0 flex flex-col justify-center items-center" style={{ zIndex: 999 }}>
      <div className="relative p-4 bg-white rounded shadow-md w-74">
        {/* Close Button */}
        <IconButton
          onClick={onClose} // Close the LabelSelector when clicked
          style={{ position: 'absolute', top: 0, right: 8 }}
        >
          <CloseIcon />
        </IconButton>
        <div className="flex items-center">
          <span className="font-semibold">Label as:</span>
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
          InputProps={{
            disableUnderline: true,
          }}
          className="mb-2"
        />
        <List>
          {labels
            .filter((label) => label.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((label, index) => (
              <ListItem
                key={index}
                button
                onClick={() => handleLabelClick(label)}
                className={`flex items-center px-2 py-1 cursor-pointer ${
                  selectedLabels.includes(label) ? 'bg-gray-200' : ''
                }`}
              >
                <span
                  className={`mr-2 w-4 h-4 rounded border flex items-center justify-center ${
                    selectedLabels.includes(label) ? 'bg-blue-500 text-white' : 'border-gray-400'
                  }`}
                >
                  {selectedLabels.includes(label) && '✓'}
                </span>
                <ListItemText primary={label} />
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
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Color:</label>
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
          </div>
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
