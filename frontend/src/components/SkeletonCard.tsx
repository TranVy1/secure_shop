import React from "react";

const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] overflow-hidden w-full h-full flex flex-col border border-gray-100">
      {/* Image 1:1 Aspect Ratio skeleton */}
      <div className="w-full aspect-square shimmer"></div>

      {/* Content skeleton */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        {/* Title */}
        <div className="h-3.5 shimmer rounded w-full mt-1"></div>
        <div className="h-3.5 shimmer rounded w-3/4 mt-2"></div>

        <div className="mt-auto"></div>

        {/* Rating & Sales */}
        <div className="flex items-center justify-between mt-4 mb-2">
          <div className="h-3 shimmer rounded w-10"></div>
          <div className="h-3 shimmer rounded w-14"></div>
        </div>

        {/* Price */}
        <div className="mt-1">
          <div className="h-4 sm:h-5 shimmer rounded w-20"></div>
          <div className="h-3 shimmer rounded w-16 mt-1.5"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;