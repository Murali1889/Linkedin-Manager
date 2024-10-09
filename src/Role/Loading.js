import { Loader2 } from "lucide-react";

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <Loader2 className="h-16 w-16 animate-spin text-indigo-600" />
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Processing Your Request
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600 max-w-md">
        We're currently searching for the best talent matches based on your criteria. This process may take 5-10 minutes. Please don't close this page.
      </p>
      <div className="mt-8 w-full max-w-md">
        <div className="relative pt-1">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
            <div className="animate-pulse w-full h-full bg-indigo-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
