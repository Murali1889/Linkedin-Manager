import { Button } from '@mui/material';

const Finished = () => {
  return (
    <div className="flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Task Complete!
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600 max-w-md">
        We have finished processing your request. You can now view all the matched talent profiles.
      </p>
      <div className="mt-8 w-full max-w-md">
        <Button variant="contained" color="primary">
          View All
        </Button>
      </div>
    </div>
  );
};

export default Finished;
