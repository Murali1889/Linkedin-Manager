import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTitle, DialogActions, TextField, Typography, IconButton, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { useShortcuts } from '../../auth/ShortcutProvider';

export function AccordionDemo() {
  const { shortcuts, addCommand, deleteCommand, isOpenListDialog, setIsOpenListDialog, editCommand } = useShortcuts();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState({ id: null, title: '', content: '' });
  const [newItem, setNewItem] = useState({ title: '', content: '' });
  const [error, setError] = useState('');
  console.log(shortcuts)

  // Handle opening the edit dialog
  const handleEdit = (item) => {
    setCurrentItem(item);
    setOpenEditDialog(true);
  };

  // Handle saving the edited item
  const handleSave = () => {
    editCommand(currentItem.id, currentItem.title, currentItem.content);
    setOpenEditDialog(false);
    setError('');
  };

  // Handle adding a new command
  const handleAddNewCommand = () => {
    if (!newItem.title.trim() || !newItem.content.trim()) {
      setError('Both title and content are required.');
      return;
    }

    addCommand(newItem.title, newItem.content);
    setNewItem({ title: '', content: '' });
    setOpenAddDialog(false);
    setError('');
  };

  // Handle changes in the title or content in the edit dialog
  const handleChange = (field, value) => {
    setCurrentItem((prevItem) => ({ ...prevItem, [field]: value }));
  };

  // Handle changes for new command
  const handleNewChange = (field, value) => {
    setNewItem((prevItem) => ({ ...prevItem, [field]: value }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
      {/* Accordion List Dialog */}
      <Dialog
        open={isOpenListDialog}
        onClose={() => setIsOpenListDialog(false)}
        fullWidth
        maxWidth="md"
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Command Block
          <IconButton onClick={() => setIsOpenListDialog(false)} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ width: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {shortcuts.length > 0 ? (
            shortcuts.map((item) => (
              <Box
                key={item.id}
                sx={{
                  boxShadow: 3,
                  borderRadius: 2,
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  width: '400px',
                  padding: '10px 10px 0 10px',
                  marginBottom: '10px',
                }}
              >
                <Accordion type="single" collapsible>
                  <AccordionItem value={`item-${item.id}`}>
                    <AccordionTrigger>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                        }}
                      >
                        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                          {item.title}
                        </Typography>
                        <div className="flex space-x-2">
                          <IconButton onClick={() => handleEdit(item)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => deleteCommand(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </div>
                      </Box>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Box>
                        {/* Display content with white-space preserved */}
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: 'pre-wrap' }} // This preserves tabs, spaces, and newlines
                        >
                          {item.content}
                        </Typography>
                      </Box>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Box>
            ))
          ) : (
            <Typography sx={{ color: '#888', margin: '20px 0' }}>
              No commands available. Click the "+" button below to add a new command.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <IconButton
            onClick={() => setOpenAddDialog(true)}
            aria-label="add"
            sx={{
              backgroundColor: '#1976d2',
              color: '#fff',
              borderRadius: '50%',
              '&:hover': { backgroundColor: '#1565c0' },
            }}
          >
            <AddIcon />
          </IconButton>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Command</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            variant="outlined"
            fullWidth
            value={currentItem.title}
            onChange={(e) => handleChange('title', e.target.value)}
            margin="dense"
          />
          <TextField
            label="Content"
            variant="outlined"
            fullWidth
            multiline
            rows={10}
            value={currentItem.content}
            onChange={(e) => handleChange('content', e.target.value)}
            margin="dense"
          />
          {error && <Typography color="error">{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Command Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Command</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            variant="outlined"
            fullWidth
            value={newItem.title}
            onChange={(e) => handleNewChange('title', e.target.value)}
            margin="dense"
          />
          <TextField
            label="Content"
            variant="outlined"
            fullWidth
            multiline
            rows={10}
            value={newItem.content}
            onChange={(e) => handleNewChange('content', e.target.value)}
            margin="dense"
          />
          {error && <Typography color="error">{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleAddNewCommand} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AccordionDemo;