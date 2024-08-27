import React, { useEffect, useContext, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress"; // Import the CircularProgress component
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { Checkbox } from "../components/ui/checkbox";
import { ProfileContext } from "../auth/ProfileProvider";

const RoleSelector = () => {
  const { profiles, checkedItems, setCheckedItems, loading } = useContext(ProfileContext);
  console.log(loading)
  const [selectAll, setSelectAll] = useState(false);

  const handleToggle = (itemId) => {
    setCheckedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAllToggle = () => {
    setSelectAll((prevSelectAll) => {
      const newSelectAll = !prevSelectAll;
      const allIds = Object.keys(profiles);
      setCheckedItems(newSelectAll ? allIds : []);
      return newSelectAll;
    });
  };

  useEffect(() => {
    setSelectAll(checkedItems.length === Object.keys(profiles).length);
  }, [checkedItems, profiles]);

  const renderTree = (nodes) => (
    <TreeItem
      key={nodes.itemId}
      itemId={nodes.itemId}
      label={
        <Box display="flex" alignItems="center">
          <Checkbox
            checked={checkedItems.includes(nodes.itemId)}
            onCheckedChange={() => handleToggle(nodes.itemId)}
          />
          <label
            htmlFor={nodes.itemId}
            className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {nodes.label}
          </label>
        </Box>
      }
    ></TreeItem>
  );

  return (
    <Box sx={{ minHeight: 352, minWidth: 250 }}>
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          sx={{ minHeight: 352, minWidth: 250 }}
        >
          <CircularProgress />
          <Typography sx={{ marginTop: 2 }}>Roles are loading, please wait a moment...</Typography>
        </Box>
      ) : (
        <Box sx={{ maxHeight: "450px", overflowY: "auto" }}>
          <Box
            display="flex"
            alignItems="center"
            marginBottom={2}
            paddingLeft={2}
          >
            <Checkbox
              checked={selectAll}
              onCheckedChange={handleSelectAllToggle}
            />
            <label
              htmlFor="selectAll"
              className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Select All
            </label>
          </Box>
          <SimpleTreeView>
            {Object.entries(profiles).map(([id, profile]) =>
              renderTree({ itemId: id, label: profile.role })
            )}
          </SimpleTreeView>
        </Box>
      )}
    </Box>
  );
};

export default RoleSelector;
