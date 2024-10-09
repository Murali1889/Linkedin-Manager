import { Dialog, DialogContent, DialogActions, DialogTitle } from '@mui/material';
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useRoleContext } from '../auth/RoleProvider';
import { useState } from 'react';
import Loading from './Loading'; // Assuming you have a Loading component
import Finished from './Finished'; // Assuming you have a Finished component

const TalentForm = () => {
  const { startLoading, isButtonClicked, setIsButtonClicked } = useRoleContext();
  const [formData, setFormData] = useState({
    roleTitle: '',
    jobDescription: '',
    experienceLevel: '',
    companies: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleExperienceChange = (value) => {
    setFormData((prev) => ({ ...prev, experienceLevel: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    startLoading(); // Trigger loading after form submit
  };

  return (
    <Dialog
      open={isButtonClicked === 1 || isButtonClicked === 2 || isButtonClicked === 3}
      onClose={() => setIsButtonClicked(false)}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          maxWidth: '600px',
          height: '70vh',
          overflow: 'hidden',
          backgroundImage: 'linear-gradient(to bottom, #f3f4f6, #ffffff)',
        }
      }}
    >
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          height: '100%', // Ensure the content height takes the full space
        }}
      >
        {isButtonClicked === 1 && (
          <div className="  flex items-center justify-center px-4 sm:px-6 lg:px-8 p-5 w-full">
            <div className="p-5 w-full space-y-8">
              <div className='mt-5 mb-15'>
                <h2 className="mt-6 text-center text-[2.5rem] font-extrabold text-gray-900">
                  Talent Acquisition Search
                </h2>
                <p className="mt-2 text-center text-[1rem] text-gray-600">
                  Please provide the following information to initiate your talent search.
                </p>
              </div>
              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="rounded-md shadow-sm space-y-4">
                  <div className='flex flex-col my-5 gap-[6px]'>
                    <Label htmlFor="roleTitle" className="text-[1rem]">Role Title</Label>
                    <Input
                      id="roleTitle"
                      name="roleTitle"
                      type="text"
                      required
                      className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="e.g. Senior Software Engineer"
                      value={formData.roleTitle}
                      onChange={handleChange}
                    />
                  </div>
                  <div className='flex flex-col my-5 gap-[6px]'>
                    <Label htmlFor="jobDescription" className="text-[1rem]">Job Description</Label>
                    <Textarea
                      id="jobDescription"
                      name="jobDescription"
                      required
                      className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="Provide a brief description of the role and responsibilities"
                      value={formData.jobDescription}
                      onChange={handleChange}
                    />
                  </div>
                  <div className='flex flex-col my-5 gap-[6px]'>
                    <Label htmlFor="experienceLevel" className="text-[1rem]">Experience Level</Label>
                    <Select onValueChange={handleExperienceChange} value={formData.experienceLevel}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent >
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior Level</SelectItem>
                        <SelectItem value="executive">Executive Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='flex flex-col my-5 gap-[6px]'>
                    <Label htmlFor="companies" className="text-[1rem]">Target Companies</Label>
                    <Input
                      id="companies"
                      name="companies"
                      type="text"
                      className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="e.g. Google, Amazon, Microsoft (comma-separated)"
                      value={formData.companies}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create Talent Search
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isButtonClicked === 2 && <Loading />}

        {isButtonClicked === 3 && <Finished />}
      </DialogContent>
    </Dialog>
  );
};

export default TalentForm;
